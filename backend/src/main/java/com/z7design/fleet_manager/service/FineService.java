package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.ReportLayoutConfig;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.service.StandardReportLayoutService;
import com.z7design.fleet_manager.dto.FineDTO;
import com.z7design.fleet_manager.dto.FineReportDTO;
import com.z7design.fleet_manager.model.Fine;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.repository.FineRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FineService {

    /** Janela em dias para alertar multas próximas do vencimento. */
    private static final int ALERTA_VENCIMENTO_DIAS = 3;
    
    private final FineRepository fineRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final JasperReportService jasperReportService;
    private final StandardReportLayoutService standardReportLayoutService;
    private final CompanyRepository companyRepository;
    private final EvolutionApiService evolutionApiService;
    private final BaileysRestService baileysRestService;
    
    public List<FineDTO> getAllFines() {
        log.info("Buscando todas as multas");
        List<Fine> fines = fineRepository.findAll();
        return fines.stream()
                .map(FineDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public FineDTO getFineById(UUID id) {
        log.info("Buscando multa com ID: {}", id);
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Multa nÃ£o encontrada com ID: " + id));
        return FineDTO.fromEntity(fine);
    }
    
    public List<FineDTO> getFinesByVehicle(UUID vehicleId) {
        log.info("Buscando multas do veÃ­culo: {}", vehicleId);
        List<Fine> fines = fineRepository.findByVehicleId(vehicleId);
        return fines.stream()
                .map(FineDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<FineDTO> getFinesByStatus(Fine.FineStatus status) {
        log.info("Buscando multas com status: {}", status);
        List<Fine> fines = fineRepository.findByStatus(status);
        return fines.stream()
                .map(FineDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<FineDTO> getFinesByVehicleAndStatus(UUID vehicleId, Fine.FineStatus status) {
        log.info("Buscando multas do veÃ­culo {} com status: {}", vehicleId, status);
        List<Fine> fines = fineRepository.findByVehicleIdAndStatus(vehicleId, status);
        return fines.stream()
                .map(FineDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /** Multas registradas no nome de um motorista (área do motorista). */
    public List<FineDTO> getFinesByDriver(UUID driverId) {
        log.info("Buscando multas do motorista: {}", driverId);
        return fineRepository.findByDriverId(driverId).stream()
                .map(FineDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public FineDTO createFine(FineDTO fineDTO) {
        log.info("Criando nova multa para veÃ­culo: {}", fineDTO.getVehicleId());
        
        Vehicle vehicle = vehicleRepository.findById(fineDTO.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado"));
        
        Fine fine = new Fine();
        fine.setVehicle(vehicle);
        
        // Definir motorista se fornecido
        Driver driver = null;
        if (fineDTO.getDriverId() != null) {
            driver = driverRepository.findById(fineDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Motorista nÃ£o encontrado"));
            fine.setDriver(driver);
        }
        
        // WhatsApp do motorista: se nÃ£o informado na multa, usa o telefone cadastrado no motorista
        String phone = fineDTO.getDriverPhone();
        if ((phone == null || phone.isBlank()) && driver != null
                && driver.getPhone() != null && !driver.getPhone().isBlank()) {
            phone = driver.getPhone();
        }
        
        fine.setDate(fineDTO.getDate());
        fine.setDescription(fineDTO.getDescription());
        fine.setAmount(fineDTO.getAmount());
        fine.setLocation(fineDTO.getLocation());
        fine.setStatus(fineDTO.getStatus());
        fine.setDueDate(fineDTO.getDueDate());
        fine.setPaymentDate(fineDTO.getPaymentDate());
        fine.setDriverPhone(phone);
        
        Fine savedFine = fineRepository.save(fine);
        log.info("Multa criada com sucesso: {}", savedFine.getId());
        
        // Notifica o motorista via WhatsApp quando a multa é registrada no nome dele
        notifyDriverOfFine(savedFine, driver);
        
        return FineDTO.fromEntity(savedFine);
    }
    
    /** Notifica o motorista via WhatsApp quando uma multa é registrada no nome dele. */
    private void notifyDriverOfFine(Fine fine, Driver driver) {
        String phone = fine.getDriverPhone();
        if (driver == null || phone == null || phone.isBlank()) {
            return;
        }
        String normalized = normalizeBrazilianPhone(phone);
        if (normalized == null) {
            log.warn("Número de WhatsApp inválido/sem DDD para multa {}", fine.getId());
            return;
        }
        
        String vehiclePlate = fine.getVehicle() != null ? fine.getVehicle().getPlate() : "";
        String statusLabel = getStatusLabel(fine.getStatus());
        String message = String.format(
                "Uma multa foi registrada no seu nome.%n%n"
                + "\uD83D\uDE97 Veículo: %s%n"
                + "\uD83D\uDCCB Infração: %s%n"
                + "\uD83D\uDCB0 Valor: R$ %s%n"
                + "\uD83D\uDCC5 Data: %s%n"
                + "\uD83D\uDCCC Local: %s%n"
                + "\uD83D\uDD04 Status: %s",
                vehiclePlate,
                fine.getDescription(),
                fine.getAmount() != null ? fine.getAmount().toPlainString() : "-",
                fine.getDate() != null ? fine.getDate().toString() : "-",
                fine.getLocation() != null ? fine.getLocation() : "-",
                statusLabel);
        
        String whatsappMessage = "\uD83D\uDEA8 *Nova Multa Registrada*\n\n" + message;
        boolean sent = false;
        try {
            sent = evolutionApiService.sendTextMessage(normalized, whatsappMessage);
        } catch (Exception e) {
            log.warn("Evolution API falhou ao notificar multa {}: {}", fine.getId(), e.getMessage());
        }
        if (!sent) {
            try {
                sent = baileysRestService.sendTextMessage(normalized, whatsappMessage);
            } catch (Exception e) {
                log.warn("Baileys falhou ao notificar multa {}: {}", fine.getId(), e.getMessage());
            }
        }
        log.info("Notificação WhatsApp de multa {} para {}: {}", fine.getId(), normalized, sent ? "enviada" : "falhou");
    }
    
    /** Job diário às 08:00: alerta multas PENDING próximas do vencimento ou vencidas via WhatsApp. */
    @Scheduled(cron = "0 0 8 * * ?")
    public int enviarAlertasVencimentoMultas() {
        log.info("Iniciando verificação de multas próximas do vencimento ou vencidas");
        int enviadas = 0;
        try {
            LocalDate hoje = LocalDate.now();
            LocalDate limite = hoje.plusDays(ALERTA_VENCIMENTO_DIAS);
            List<Fine> pendentes = fineRepository.findPendingFinesNeedingDueReminder(Fine.FineStatus.PENDING, limite);
            for (Fine fine : pendentes) {
                try {
                    if (enviarAlertaVencimento(fine)) {
                        enviadas++;
                    }
                } catch (Exception e) {
                    log.warn("Falha ao enviar alerta de vencimento da multa {}: {}", fine.getId(), e.getMessage());
                }
            }
            log.info("Verificação de multas concluída. {} alerta(s) de vencimento enviado(s)", enviadas);
        } catch (Exception e) {
            log.error("Erro ao enviar alertas de vencimento de multas", e);
        }
        return enviadas;
    }

    /** Envia o alerta de vencimento de uma multa e marca o flag correspondente para não reenviar. */
    private boolean enviarAlertaVencimento(Fine fine) {
        String phone = fine.getDriverPhone();
        if (fine.getDriver() == null || phone == null || phone.isBlank()) {
            fine.setDueReminderSent(true); // sem motorista/telefone não há o que enviar
            fine.setOverdueReminderSent(true);
            fineRepository.save(fine);
            return false;
        }
        String normalized = normalizeBrazilianPhone(phone);
        if (normalized == null) {
            fine.setDueReminderSent(true);
            fine.setOverdueReminderSent(true);
            fineRepository.save(fine);
            return false;
        }

        LocalDate hoje = LocalDate.now();
        boolean vencida = fine.getDueDate() != null && fine.getDueDate().isBefore(hoje);
        // Não reenviar o alerta já enviado para a categoria atual (próxima do vencimento ou vencida)
        if (vencida && Boolean.TRUE.equals(fine.getOverdueReminderSent())) {
            return false;
        }
        if (!vencida && Boolean.TRUE.equals(fine.getDueReminderSent())) {
            return false;
        }
        long diasRestantes = fine.getDueDate() != null ? ChronoUnit.DAYS.between(hoje, fine.getDueDate()) : 0;
        String vehiclePlate = fine.getVehicle() != null ? fine.getVehicle().getPlate() : "";

        String title = vencida ? "Multa Vencida" : "Multa Próxima do Vencimento";
        StringBuilder message = new StringBuilder();
        if (vencida) {
            message.append(String.format("Sua multa do veículo %s venceu e segue pendente!%n%n", vehiclePlate));
        } else if (diasRestantes == 0) {
            message.append(String.format("Sua multa do veículo %s vence hoje!%n%n", vehiclePlate));
        } else {
            message.append(String.format("Sua multa do veículo %s vence em %d dia(s).%n%n", vehiclePlate, diasRestantes));
        }
        message.append(String.format(
                "\uD83D\uDCCB Infração: %s%n"
                + "\uD83D\uDCB0 Valor: R$ %s%n"
                + "\uD83D\uDCC5 Vencimento: %s%n"
                + "\uD83D\uDCCC Local: %s%n"
                + "\u26A0\uFE0F Regularize o quanto antes para evitar novas penalidades.",
                fine.getDescription(),
                fine.getAmount() != null ? fine.getAmount().toPlainString() : "-",
                fine.getDueDate() != null ? fine.getDueDate().toString() : "-",
                fine.getLocation() != null ? fine.getLocation() : "-"));

        String whatsappMessage = (vencida ? "\uD83D\uDD34 " : "\uD83D\uDFE1 ") + "*" + title + "*\n\n" + message;
        boolean sent = false;
        try {
            sent = evolutionApiService.sendTextMessage(normalized, whatsappMessage);
        } catch (Exception e) {
            log.warn("Evolution API falhou ao alertar vencimento da multa {}: {}", fine.getId(), e.getMessage());
        }
        if (!sent) {
            try {
                sent = baileysRestService.sendTextMessage(normalized, whatsappMessage);
            } catch (Exception e) {
                log.warn("Baileys falhou ao alertar vencimento da multa {}: {}", fine.getId(), e.getMessage());
            }
        }
        if (sent) {
            if (vencida) {
                fine.setOverdueReminderSent(true);
            } else {
                fine.setDueReminderSent(true);
            }
            fineRepository.save(fine);
        }
        log.info("Alerta de vencimento da multa {} para {}: {}", fine.getId(), normalized, sent ? "enviada" : "falhou");
        return sent;
    }

    /** Normaliza número brasileiro para E.164 com DDI +55 (evita falha documentada de envio). */
    private String normalizeBrazilianPhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() < 10) {
            return null;
        }
        if (digits.startsWith("55") && digits.length() >= 12) {
            return "+" + digits;
        }
        return "+55" + digits;
    }
    
    public FineDTO updateFine(UUID id, FineDTO fineDTO) {
        log.info("Atualizando multa: {}", id);
        
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Multa nÃ£o encontrada com ID: " + id));
        
        // Atualizar veÃ­culo se fornecido
        if (fineDTO.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(fineDTO.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("VeÃ­culo nÃ£o encontrado"));
            fine.setVehicle(vehicle);
        }
        
        // Atualizar motorista se fornecido
        if (fineDTO.getDriverId() != null) {
            Driver driver = driverRepository.findById(fineDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Motorista nÃ£o encontrado"));
            fine.setDriver(driver);
        } else if (fineDTO.getDriverId() == null) {
            fine.setDriver(null);
        }
        
        // WhatsApp do motorista: se nÃ£o informado na multa, usa o telefone cadastrado no motorista
        String phone = fineDTO.getDriverPhone();
        if ((phone == null || phone.isBlank()) && fine.getDriver() != null
                && fine.getDriver().getPhone() != null && !fine.getDriver().getPhone().isBlank()) {
            phone = fine.getDriver().getPhone();
        }
        
        fine.setDate(fineDTO.getDate());
        fine.setDescription(fineDTO.getDescription());
        fine.setAmount(fineDTO.getAmount());
        fine.setLocation(fineDTO.getLocation());
        fine.setStatus(fineDTO.getStatus());
        fine.setDueDate(fineDTO.getDueDate());
        fine.setPaymentDate(fineDTO.getPaymentDate());
        fine.setDriverPhone(phone);
        if (fineDTO.getPoints() != null) {
            fine.setPoints(fineDTO.getPoints());
        }
        // Re-armar os alertas de vencimento ao editar a multa
        fine.setDueReminderSent(false);
        fine.setOverdueReminderSent(false);
        
        Fine savedFine = fineRepository.save(fine);
        log.info("Multa atualizada com sucesso: {}", savedFine.getId());
        return FineDTO.fromEntity(savedFine);
    }
    
    public void deleteFine(UUID id) {
        log.info("Deletando multa: {}", id);
        
        if (!fineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Multa nÃ£o encontrada com ID: " + id);
        }
        
        fineRepository.deleteById(id);
        log.info("Multa deletada com sucesso: {}", id);
    }
    
    // ===== RELATÃ“RIOS =====
    
    public List<FineReportDTO> getFinesForReport(LocalDate startDate, 
                                                LocalDate endDate, 
                                                String vehicleFilter, 
                                                String driverFilter, 
                                                String statusFilter,
                                                BigDecimal amountMin,
                                                BigDecimal amountMax,
                                                List<String> selectedIds) {
        log.info("Buscando multas para relatÃ³rio - PerÃ­odo: {} a {}, VeÃ­culo: {}, Motorista: {}, Status: {}, Valor: {} a {}, IDs: {}", 
                startDate, endDate, vehicleFilter, driverFilter, statusFilter, amountMin, amountMax, selectedIds);
        
        List<Fine> fines = fineRepository.findAllWithRelations();
        log.info("Encontradas {} multas no banco de dados", fines.size());
        
        // Aplicar filtros
        List<FineReportDTO> result = fines.stream()
                .filter(fine -> startDate == null || !fine.getDate().isBefore(startDate))
                .filter(fine -> endDate == null || !fine.getDate().isAfter(endDate))
                .filter(fine -> vehicleFilter == null || vehicleFilter.isEmpty() || 
                        fine.getVehicle().getPlate().toLowerCase().contains(vehicleFilter.toLowerCase()))
                .filter(fine -> driverFilter == null || driverFilter.isEmpty() || 
                        (fine.getDriver() != null && fine.getDriver().getName().toLowerCase().contains(driverFilter.toLowerCase())))
                .filter(fine -> statusFilter == null || statusFilter.isEmpty() || statusFilter.equals("ALL") || 
                        fine.getStatus().toString().equals(statusFilter))
                .filter(fine -> amountMin == null || fine.getAmount().compareTo(amountMin) >= 0)
                .filter(fine -> amountMax == null || fine.getAmount().compareTo(amountMax) <= 0)
                .filter(fine -> selectedIds == null || selectedIds.isEmpty() || 
                        selectedIds.contains(fine.getId().toString()))
                .map(this::convertToReportDTO)
                .collect(Collectors.toList());
        
        log.info("Convertidas {} multas para DTO de relatÃ³rio", result.size());
        return result;
    }
    
    public byte[] generateFineReportPDF(LocalDate startDate, 
                                       LocalDate endDate, 
                                       String vehicleFilter, 
                                       String driverFilter, 
                                       String statusFilter,
                                       BigDecimal amountMin,
                                       BigDecimal amountMax,
                                       List<String> selectedIds) throws Exception {
        log.info("Gerando relatÃ³rio PDF de multas");
        
        List<FineReportDTO> fines = getFinesForReport(startDate, endDate, vehicleFilter, driverFilter, statusFilter, amountMin, amountMax, selectedIds);
        return generateSimpleHTMLReport(fines);
    }
    
    public byte[] generateFineReportExcel(LocalDate startDate, 
                                         LocalDate endDate, 
                                         String vehicleFilter, 
                                         String driverFilter, 
                                         String statusFilter,
                                         BigDecimal amountMin,
                                         BigDecimal amountMax,
                                         List<String> selectedIds) throws Exception {
        log.info("Gerando relatÃ³rio Excel de multas");
        
        List<FineReportDTO> fines = getFinesForReport(startDate, endDate, vehicleFilter, driverFilter, statusFilter, amountMin, amountMax, selectedIds);
        return jasperReportService.generateFineReportPDF(fines, startDate, endDate, vehicleFilter, driverFilter, statusFilter);
    }
    
    private FineReportDTO convertToReportDTO(Fine fine) {
        return FineReportDTO.fromEntity(fine);
    }
    
    public List<Object> getFinesForReportSimple(LocalDate startDate, 
                                              LocalDate endDate, 
                                              String vehicleFilter, 
                                              String driverFilter, 
                                              String statusFilter,
                                              BigDecimal amountMin,
                                              BigDecimal amountMax,
                                              List<String> selectedIds) {
        log.info("Buscando multas para relatÃ³rio simples - PerÃ­odo: {} a {}, VeÃ­culo: {}, Motorista: {}, Status: {}, Valor: {} a {}, IDs: {}", 
                startDate, endDate, vehicleFilter, driverFilter, statusFilter, amountMin, amountMax, selectedIds);
        
        List<Fine> fines = fineRepository.findAllWithRelations();
        log.info("Encontradas {} multas no banco de dados", fines.size());
        
        // Aplicar filtros e converter para Map simples
        List<Object> result = fines.stream()
                .filter(fine -> startDate == null || !fine.getDate().isBefore(startDate))
                .filter(fine -> endDate == null || !fine.getDate().isAfter(endDate))
                .filter(fine -> vehicleFilter == null || vehicleFilter.isEmpty() || 
                        fine.getVehicle().getPlate().toLowerCase().contains(vehicleFilter.toLowerCase()))
                .filter(fine -> driverFilter == null || driverFilter.isEmpty() || 
                        (fine.getDriver() != null && fine.getDriver().getName().toLowerCase().contains(driverFilter.toLowerCase())))
                .filter(fine -> statusFilter == null || statusFilter.isEmpty() || statusFilter.equals("ALL") || 
                        fine.getStatus().toString().equals(statusFilter))
                .filter(fine -> amountMin == null || fine.getAmount().compareTo(amountMin) >= 0)
                .filter(fine -> amountMax == null || fine.getAmount().compareTo(amountMax) <= 0)
                .filter(fine -> selectedIds == null || selectedIds.isEmpty() || 
                        selectedIds.contains(fine.getId().toString()))
                .map(this::convertToSimpleMap)
                .collect(Collectors.toList());
        
        log.info("Convertidas {} multas para formato simples", result.size());
        return result;
    }
    
    private Object convertToSimpleMap(Fine fine) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", fine.getId().toString());
        map.put("vehiclePlate", fine.getVehicle().getPlate());
        map.put("vehicleBrand", fine.getVehicle().getBrand());
        map.put("vehicleModel", fine.getVehicle().getModel());
        map.put("driverName", fine.getDriver() != null ? fine.getDriver().getName() : null);
        map.put("driverLicenseNumber", fine.getDriver() != null ? fine.getDriver().getLicenseNumber() : null);
        map.put("infractionDate", fine.getDate().toString());
        map.put("description", fine.getDescription());
        map.put("amount", fine.getAmount().toString());
        map.put("location", fine.getLocation());
        map.put("status", translateStatusSimple(fine.getStatus()));
        map.put("dueDate", fine.getDueDate() != null ? fine.getDueDate().toString() : null);
        map.put("paymentDate", fine.getPaymentDate() != null ? fine.getPaymentDate().toString() : null);
        map.put("createdAt", fine.getCreatedAt().toLocalDate().toString());
        map.put("overdue", fine.getDueDate() != null && fine.getDueDate().isBefore(LocalDate.now()) && fine.getStatus() != Fine.FineStatus.PAID);
        return map;
    }
    
    private String translateStatusSimple(Fine.FineStatus status) {
        switch (status) {
            case PENDING:
                return "Pendente";
            case PAID:
                return "Paga";
            case CANCELLED:
                return "Cancelada";
            default:
                return status.toString();
        }
    }
    
    private byte[] generateSimpleHTMLReport(List<FineReportDTO> fines) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<title>RelatÃ³rio de Multas</title>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; margin: 20px; }");
        html.append("h1 { color: #333; text-align: center; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        html.append("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        html.append("th { background-color: #f2f2f2; font-weight: bold; }");
        html.append("tr:nth-child(even) { background-color: #f9f9f9; }");
        html.append(".status-paga { color: green; font-weight: bold; }");
        html.append(".status-pendente { color: orange; font-weight: bold; }");
        html.append(".status-cancelada { color: red; font-weight: bold; }");
        html.append("</style>");
        html.append("</head><body>");
        
        html.append("<h1>RELATÃ“RIO DE MULTAS</h1>");
        html.append("<p><strong>Data de GeraÃ§Ã£o:</strong> ").append(java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        html.append("<p><strong>Total de Multas:</strong> ").append(fines.size()).append("</p>");
        
        html.append("<table>");
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th>VeÃ­culo</th>");
        html.append("<th>Motorista</th>");
        html.append("<th>Data InfraÃ§Ã£o</th>");
        html.append("<th>DescriÃ§Ã£o</th>");
        html.append("<th>Valor</th>");
        html.append("<th>Status</th>");
        html.append("<th>Vencimento</th>");
        html.append("</tr>");
        html.append("</thead>");
        html.append("<tbody>");
        
        for (FineReportDTO fine : fines) {
            html.append("<tr>");
            html.append("<td>").append(fine.getVehiclePlate()).append("</td>");
            html.append("<td>").append(fine.getDriverName() != null ? fine.getDriverName() : "NÃ£o informado").append("</td>");
            html.append("<td>").append(fine.getInfractionDate()).append("</td>");
            html.append("<td>").append(fine.getDescription()).append("</td>");
            html.append("<td>R$ ").append(fine.getAmount()).append("</td>");
            
            String statusClass = "";
            String statusText = fine.getStatus();
            if ("Paga".equals(statusText)) {
                statusClass = "status-paga";
            } else if ("Pendente".equals(statusText)) {
                statusClass = "status-pendente";
            } else if ("Cancelada".equals(statusText)) {
                statusClass = "status-cancelada";
            }
            
            html.append("<td class='").append(statusClass).append("'>").append(statusText).append("</td>");
            html.append("<td>").append(fine.getDueDate()).append("</td>");
            html.append("</tr>");
        }
        
        html.append("</tbody>");
        html.append("</table>");
        html.append("</body></html>");
        
        return html.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
    
    @Transactional(readOnly = true)
    public byte[] generatePDFReport(String vehiclePlate, String driverName, String infraction,
                                    LocalDate startDate, LocalDate endDate,
                                    LocalDate dueDateStart, LocalDate dueDateEnd,
                                    BigDecimal minValue, BigDecimal maxValue,
                                    Fine.FineStatus status) throws IOException {
        log.info("Gerando relatÃ³rio PDF de multas - VehiclePlate: {}, DriverName: {}, Infraction: {}, " +
                "StartDate: {}, EndDate: {}, DueDateStart: {}, DueDateEnd: {}, MinValue: {}, MaxValue: {}, Status: {}",
                vehiclePlate, driverName, infraction, startDate, endDate, dueDateStart, dueDateEnd, minValue, maxValue, status);

        List<Fine> fines = getFinesFiltered(vehiclePlate, driverName, infraction, startDate, endDate,
                dueDateStart, dueDateEnd, minValue, maxValue, status);
        log.info("Total de multas encontradas para o relatÃ³rio: {}", fines.size());

        // Determinar companyId - tentar obter das multas primeiro
        java.util.UUID companyId = null;
        if (!fines.isEmpty()) {
            for (Fine fine : fines) {
                if (fine.getVehicle() != null && fine.getVehicle().getCompanyId() != null) {
                    companyId = fine.getVehicle().getCompanyId();
                    log.info("Usando empresa do veÃ­culo {}: {}", fine.getVehicle().getPlate(), companyId);
                    break;
                }
            }
        }
        
        // Fallback: usar primeira empresa ativa se nenhuma multa tiver companyId
        if (companyId == null) {
            log.warn("Nenhuma multa possui empresa associada. Buscando primeira empresa ativa como fallback...");
            List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
            if (activeCompanies != null && !activeCompanies.isEmpty()) {
                companyId = activeCompanies.get(0).getId();
                log.info("Usando primeira empresa ativa como fallback: {} (ID: {})", 
                        activeCompanies.get(0).getName(), companyId);
            } else {
                List<Company> allCompanies = companyRepository.findAll();
                if (allCompanies != null && !allCompanies.isEmpty()) {
                    companyId = allCompanies.get(0).getId();
                    log.warn("Nenhuma empresa ativa encontrada. Usando primeira empresa cadastrada: {} (ID: {})", 
                            allCompanies.get(0).getName(), companyId);
                } else {
                    throw new ResourceNotFoundException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio. " +
                            "Nenhuma empresa cadastrada no sistema. Por favor, cadastre pelo menos uma empresa.");
                }
            }
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StandardReportLayoutService.DocumentWithPdf docWithPdf = null;
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            
            // Criar documento com layout padrÃ£o
            ReportLayoutConfig layoutConfig = ReportLayoutConfig.builder()
                .companyId(companyId)
                .reportTitle("RELATÃ“RIO DE MULTAS")
                .topMargin(120f)  // EspaÃ§o para cabeÃ§alho
                .bottomMargin(80f) // EspaÃ§o para rodapÃ©
                .leftMargin(50f)
                .rightMargin(50f)
                .build();
            
            docWithPdf = standardReportLayoutService.createDocumentWithLayout(writer, layoutConfig);
            Document document = docWithPdf.getDocument();

            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);

            // Filtros aplicados
            if (vehiclePlate != null || driverName != null || infraction != null || startDate != null || endDate != null ||
                dueDateStart != null || dueDateEnd != null || minValue != null || maxValue != null || status != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);

                if (vehiclePlate != null && !vehiclePlate.isEmpty()) {
                    document.add(new Paragraph("Placa: " + vehiclePlate).setFontSize(10).setMarginBottom(2));
                }
                if (driverName != null && !driverName.isEmpty()) {
                    document.add(new Paragraph("Motorista: " + driverName).setFontSize(10).setMarginBottom(2));
                }
                if (infraction != null && !infraction.isEmpty()) {
                    document.add(new Paragraph("InfraÃ§Ã£o: " + infraction).setFontSize(10).setMarginBottom(2));
                }
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("Data InfraÃ§Ã£o: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (dueDateStart != null && dueDateEnd != null) {
                    document.add(new Paragraph("Vencimento: " + dueDateStart.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                            " a " + dueDateEnd.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (minValue != null || maxValue != null) {
                    String valueRange = "Valor: ";
                    if (minValue != null) valueRange += "R$ " + minValue.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    if (minValue != null && maxValue != null) valueRange += " a ";
                    if (maxValue != null) valueRange += "R$ " + maxValue.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
                    document.add(new Paragraph(valueRange).setFontSize(10).setMarginBottom(2));
                }
                if (status != null) {
                    document.add(new Paragraph("Status: " + getStatusLabel(status)).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // EstatÃ­sticas
            BigDecimal totalAmount = fines.stream()
                    .map(Fine::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long pendingCount = fines.stream().filter(f -> f.getStatus() == Fine.FineStatus.PENDING).count();
            long paidCount = fines.stream().filter(f -> f.getStatus() == Fine.FineStatus.PAID).count();
            long cancelledCount = fines.stream().filter(f -> f.getStatus() == Fine.FineStatus.CANCELLED).count();

            Paragraph stats = new Paragraph(String.format(
                    "Total de multas: %d | Pendentes: %d | Pagas: %d | Canceladas: %d | Valor Total: R$ %s",
                    fines.size(), pendingCount, paidCount, cancelledCount,
                    totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",")))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);

            // Tabela de multas
            if (fines.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma multa encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(9).setWidth(UnitValue.createPercentValue(100));

                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Placa"));
                table.addHeaderCell(createHeaderCell("Motorista"));
                table.addHeaderCell(createHeaderCell("InfraÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("Data InfraÃ§Ã£o"));
                table.addHeaderCell(createHeaderCell("Vencimento"));
                table.addHeaderCell(createHeaderCell("Valor"));
                table.addHeaderCell(createHeaderCell("Local"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Pagamento"));

                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (Fine fine : fines) {
                    table.addCell(createCell(fine.getVehicle() != null ? fine.getVehicle().getPlate() : ""));
                    table.addCell(createCell(fine.getDriver() != null ? fine.getDriver().getName() : "NÃ£o informado"));
                    
                    // DescriÃ§Ã£o (truncar se muito longa)
                    String desc = fine.getDescription() != null ? fine.getDescription() : "";
                    if (desc.length() > 40) {
                        desc = desc.substring(0, 37) + "...";
                    }
                    table.addCell(createCell(desc));
                    
                    table.addCell(createCell(fine.getDate() != null ? fine.getDate().format(dateFormatter) : ""));
                    table.addCell(createCell(fine.getDueDate() != null ? fine.getDueDate().format(dateFormatter) : ""));
                    
                    // Valor formatado
                    String amount = fine.getAmount() != null ?
                            "R$ " + fine.getAmount().setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",") : "";
                    table.addCell(createCell(amount));
                    
                    // Local (truncar se muito longo)
                    String location = fine.getLocation() != null ? fine.getLocation() : "";
                    if (location.length() > 30) {
                        location = location.substring(0, 27) + "...";
                    }
                    table.addCell(createCell(location));
                    
                    table.addCell(createCell(fine.getStatus() != null ? getStatusLabel(fine.getStatus()) : ""));
                    table.addCell(createCell(fine.getPaymentDate() != null ? fine.getPaymentDate().format(dateFormatter) : "-"));
                }

                document.add(table);
            }

            // Finalizar layout padrÃ£o (adiciona header/footer em todas as pÃ¡ginas)
            standardReportLayoutService.finalizeDocumentLayout(docWithPdf);
            
            document.close();

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de multas: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }

        byte[] result = baos.toByteArray();
        log.info("PDF de multas gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }

    private List<Fine> getFinesFiltered(String vehiclePlate, String driverName, String infraction,
                                       LocalDate startDate, LocalDate endDate,
                                       LocalDate dueDateStart, LocalDate dueDateEnd,
                                       BigDecimal minValue, BigDecimal maxValue,
                                       Fine.FineStatus status) {
        log.debug("Aplicando filtros - vehiclePlate: {}, driverName: {}, infraction: {}, " +
                "startDate: {}, endDate: {}, dueDateStart: {}, dueDateEnd: {}, minValue: {}, maxValue: {}, status: {}",
                vehiclePlate, driverName, infraction, startDate, endDate, dueDateStart, dueDateEnd, minValue, maxValue, status);

        try {
            List<Fine> fines = fineRepository.findAllWithRelations();

            // Aplicar filtros
            if (vehiclePlate != null && !vehiclePlate.isEmpty()) {
                fines = fines.stream()
                        .filter(f -> f.getVehicle() != null && f.getVehicle().getPlate().equalsIgnoreCase(vehiclePlate))
                        .collect(Collectors.toList());
            }

            if (driverName != null && !driverName.isEmpty()) {
                fines = fines.stream()
                        .filter(f -> f.getDriver() != null && f.getDriver().getName().equalsIgnoreCase(driverName))
                        .collect(Collectors.toList());
            }

            if (infraction != null && !infraction.isEmpty()) {
                fines = fines.stream()
                        .filter(f -> f.getDescription() != null && f.getDescription().toLowerCase().contains(infraction.toLowerCase()))
                        .collect(Collectors.toList());
            }

            if (startDate != null) {
                fines = fines.stream()
                        .filter(f -> f.getDate() != null && !f.getDate().isBefore(startDate))
                        .collect(Collectors.toList());
            }

            if (endDate != null) {
                fines = fines.stream()
                        .filter(f -> f.getDate() != null && !f.getDate().isAfter(endDate))
                        .collect(Collectors.toList());
            }

            if (dueDateStart != null) {
                fines = fines.stream()
                        .filter(f -> f.getDueDate() != null && !f.getDueDate().isBefore(dueDateStart))
                        .collect(Collectors.toList());
            }

            if (dueDateEnd != null) {
                fines = fines.stream()
                        .filter(f -> f.getDueDate() != null && !f.getDueDate().isAfter(dueDateEnd))
                        .collect(Collectors.toList());
            }

            if (minValue != null) {
                fines = fines.stream()
                        .filter(f -> f.getAmount() != null && f.getAmount().compareTo(minValue) >= 0)
                        .collect(Collectors.toList());
            }

            if (maxValue != null) {
                fines = fines.stream()
                        .filter(f -> f.getAmount() != null && f.getAmount().compareTo(maxValue) <= 0)
                        .collect(Collectors.toList());
            }

            if (status != null) {
                fines = fines.stream()
                        .filter(f -> f.getStatus() == status)
                        .collect(Collectors.toList());
            }

            log.info("Filtros aplicados. {} multas encontradas", fines.size());
            return fines;

        } catch (Exception e) {
            log.error("Erro ao aplicar filtros nas multas", e);
            throw new RuntimeException("Erro ao buscar multas: " + e.getMessage(), e);
        }
    }

    private String getStatusLabel(Fine.FineStatus status) {
        if (status == null) return "";
        switch (status) {
            case PENDING: return "Pendente";
            case PAID: return "Paga";
            case CANCELLED: return "Cancelada";
            default: return status.toString();
        }
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold().setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }

    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(8))
                .setTextAlignment(TextAlignment.LEFT);
    }
    
}

