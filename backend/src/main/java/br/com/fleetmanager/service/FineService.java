package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.FineDTO;
import br.com.fleetmanager.dto.FineReportDTO;
import br.com.fleetmanager.model.Fine;
import br.com.fleetmanager.model.Vehicle;
import br.com.fleetmanager.model.Driver;
import br.com.fleetmanager.repository.FineRepository;
import br.com.fleetmanager.repository.VehicleRepository;
import br.com.fleetmanager.repository.DriverRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FineService {
    
    private final FineRepository fineRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final JasperReportService jasperReportService;
    
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
                .orElseThrow(() -> new ResourceNotFoundException("Multa não encontrada com ID: " + id));
        return FineDTO.fromEntity(fine);
    }
    
    public List<FineDTO> getFinesByVehicle(UUID vehicleId) {
        log.info("Buscando multas do veículo: {}", vehicleId);
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
        log.info("Buscando multas do veículo {} com status: {}", vehicleId, status);
        List<Fine> fines = fineRepository.findByVehicleIdAndStatus(vehicleId, status);
        return fines.stream()
                .map(FineDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public FineDTO createFine(FineDTO fineDTO) {
        log.info("Criando nova multa para veículo: {}", fineDTO.getVehicleId());
        
        Vehicle vehicle = vehicleRepository.findById(fineDTO.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado"));
        
        Fine fine = new Fine();
        fine.setVehicle(vehicle);
        
        // Definir motorista se fornecido
        if (fineDTO.getDriverId() != null) {
            Driver driver = driverRepository.findById(fineDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado"));
            fine.setDriver(driver);
        }
        
        fine.setDate(fineDTO.getDate());
        fine.setDescription(fineDTO.getDescription());
        fine.setAmount(fineDTO.getAmount());
        fine.setLocation(fineDTO.getLocation());
        fine.setStatus(fineDTO.getStatus());
        fine.setDueDate(fineDTO.getDueDate());
        fine.setPaymentDate(fineDTO.getPaymentDate());
        
        Fine savedFine = fineRepository.save(fine);
        log.info("Multa criada com sucesso: {}", savedFine.getId());
        return FineDTO.fromEntity(savedFine);
    }
    
    public FineDTO updateFine(UUID id, FineDTO fineDTO) {
        log.info("Atualizando multa: {}", id);
        
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Multa não encontrada com ID: " + id));
        
        // Atualizar veículo se fornecido
        if (fineDTO.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(fineDTO.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado"));
            fine.setVehicle(vehicle);
        }
        
        // Atualizar motorista se fornecido
        if (fineDTO.getDriverId() != null) {
            Driver driver = driverRepository.findById(fineDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado"));
            fine.setDriver(driver);
        } else if (fineDTO.getDriverId() == null) {
            fine.setDriver(null);
        }
        
        fine.setDate(fineDTO.getDate());
        fine.setDescription(fineDTO.getDescription());
        fine.setAmount(fineDTO.getAmount());
        fine.setLocation(fineDTO.getLocation());
        fine.setStatus(fineDTO.getStatus());
        fine.setDueDate(fineDTO.getDueDate());
        fine.setPaymentDate(fineDTO.getPaymentDate());
        
        Fine savedFine = fineRepository.save(fine);
        log.info("Multa atualizada com sucesso: {}", savedFine.getId());
        return FineDTO.fromEntity(savedFine);
    }
    
    public void deleteFine(UUID id) {
        log.info("Deletando multa: {}", id);
        
        if (!fineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Multa não encontrada com ID: " + id);
        }
        
        fineRepository.deleteById(id);
        log.info("Multa deletada com sucesso: {}", id);
    }
    
    // ===== RELATÓRIOS =====
    
    public List<FineReportDTO> getFinesForReport(LocalDate startDate, 
                                                LocalDate endDate, 
                                                String vehicleFilter, 
                                                String driverFilter, 
                                                String statusFilter,
                                                BigDecimal amountMin,
                                                BigDecimal amountMax,
                                                List<String> selectedIds) {
        log.info("Buscando multas para relatório - Período: {} a {}, Veículo: {}, Motorista: {}, Status: {}, Valor: {} a {}, IDs: {}", 
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
        
        log.info("Convertidas {} multas para DTO de relatório", result.size());
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
        log.info("Gerando relatório PDF de multas");
        
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
        log.info("Gerando relatório Excel de multas");
        
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
        log.info("Buscando multas para relatório simples - Período: {} a {}, Veículo: {}, Motorista: {}, Status: {}, Valor: {} a {}, IDs: {}", 
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
        html.append("<title>Relatório de Multas</title>");
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
        
        html.append("<h1>RELATÓRIO DE MULTAS</h1>");
        html.append("<p><strong>Data de Geração:</strong> ").append(java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        html.append("<p><strong>Total de Multas:</strong> ").append(fines.size()).append("</p>");
        
        html.append("<table>");
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th>Veículo</th>");
        html.append("<th>Motorista</th>");
        html.append("<th>Data Infração</th>");
        html.append("<th>Descrição</th>");
        html.append("<th>Valor</th>");
        html.append("<th>Status</th>");
        html.append("<th>Vencimento</th>");
        html.append("</tr>");
        html.append("</thead>");
        html.append("<tbody>");
        
        for (FineReportDTO fine : fines) {
            html.append("<tr>");
            html.append("<td>").append(fine.getVehiclePlate()).append("</td>");
            html.append("<td>").append(fine.getDriverName() != null ? fine.getDriverName() : "Não informado").append("</td>");
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
    
}
