package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.dto.VisitControlDTO;
import com.z7design.fleet_manager.dto.VisitControlReportDTO;
import com.z7design.fleet_manager.dto.VisitControlStatsDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.VisitControl;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.VisitControlRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.WorkPostAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitControlService {

    private final VisitControlRepository visitControlRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final UserRepository userRepository;
    private final VisitControlReportService reportService;
    private final WorkPostAssignmentRepository workPostAssignmentRepository;

    @Transactional(readOnly = true)
    public List<VisitControlDTO> getAllVisitControls() {
        return visitControlRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<VisitControlDTO> getVisitControlById(UUID id) {
        return visitControlRepository.findById(id)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<VisitControlDTO> getTodayVisits() {
        return visitControlRepository.findTodayVisits(LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitControlDTO> getRecentVisits() {
        return visitControlRepository.findRecentVisits().stream()
                .limit(3)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitControlDTO> getVisitsByStatus(VisitControlStatus status) {
        return visitControlRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitControlDTO> getVisitsBySupervisor(UUID supervisorId) {
        return visitControlRepository.findBySupervisorId(supervisorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisitControlStatsDTO getVisitStats() {
        LocalDate today = LocalDate.now();
        
        Long todayCount = visitControlRepository.countTodayVisits(today);
        Long completedCount = visitControlRepository.countByStatus(VisitControlStatus.COMPLETED);
        Long pendingCount = visitControlRepository.countByStatus(VisitControlStatus.SCHEDULED) 
                          + visitControlRepository.countByStatus(VisitControlStatus.PENDING);
        Long activeSupervisors = visitControlRepository.countActiveSupervisors();
        Double successRate = visitControlRepository.calculateSuccessRate();

        if (successRate == null) {
            successRate = 0.0;
        }

        return new VisitControlStatsDTO(
            todayCount,
            completedCount,
            pendingCount,
            successRate,
            activeSupervisors
        );
    }

    @Transactional
    public VisitControlDTO createVisitControl(VisitControlDTO dto) {
        VisitControl visitControl = new VisitControl();
        mapDTOToEntity(dto, visitControl);
        
        VisitControl saved = visitControlRepository.save(visitControl);
        return convertToDTO(saved);
    }

    @Transactional
    public VisitControlDTO updateVisitControl(UUID id, VisitControlDTO dto) {
        VisitControl visitControl = visitControlRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada com ID: " + id));
        
        mapDTOToEntity(dto, visitControl);
        
        VisitControl updated = visitControlRepository.save(visitControl);
        return convertToDTO(updated);
    }

    @Transactional
    public VisitControlDTO startVisit(UUID id) {
        VisitControl visitControl = visitControlRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada com ID: " + id));
        
        visitControl.setStatus(VisitControlStatus.IN_PROGRESS);
        visitControl.setStartedAt(LocalDateTime.now());
        
        VisitControl updated = visitControlRepository.save(visitControl);
        return convertToDTO(updated);
    }

    @Transactional
    public VisitControlDTO completeVisit(UUID id, String findings, Boolean isSuccessful) {
        VisitControl visitControl = visitControlRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada com ID: " + id));
        
        visitControl.setStatus(VisitControlStatus.COMPLETED);
        visitControl.setCompletedAt(LocalDateTime.now());
        visitControl.setFindings(findings);
        visitControl.setIsSuccessful(isSuccessful != null ? isSuccessful : true);
        
        VisitControl updated = visitControlRepository.save(visitControl);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteVisitControl(UUID id) {
        if (!visitControlRepository.existsById(id)) {
            throw new RuntimeException("Visita nÃ£o encontrada com ID: " + id);
        }
        visitControlRepository.deleteById(id);
    }

    private void mapDTOToEntity(VisitControlDTO dto, VisitControl entity) {
        entity.setLocation(dto.getLocation());
        entity.setAssignedTo(dto.getAssignedTo());
        entity.setVisitDate(dto.getVisitDate());
        entity.setScheduledAt(dto.getScheduledAt());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : VisitControlStatus.SCHEDULED);
        entity.setObservations(dto.getObservations());
        entity.setFindings(dto.getFindings());
        entity.setReportUrl(dto.getReportUrl());
        entity.setIsSuccessful(dto.getIsSuccessful() != null ? dto.getIsSuccessful() : false);

        if (dto.getSupervisorId() != null) {
            Employee supervisor = employeeRepository.findById(dto.getSupervisorId())
                    .orElse(null);
            entity.setSupervisor(supervisor);
        }

        if (dto.getWorkPostId() != null) {
            WorkPost workPost = workPostRepository.findById(dto.getWorkPostId())
                    .orElse(null);
            entity.setWorkPost(workPost);
        }

        // Mapear funcionÃ¡rio identificado no local
        if (dto.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElse(null);
            entity.setEmployee(employee);
        }
        
        // Armazenar CPF e matrÃ­cula informados manualmente
        entity.setEmployeeCpf(dto.getEmployeeCpf());
        entity.setEmployeeRegistrationNumber(dto.getEmployeeRegistrationNumber());

        if (dto.getCreatedBy() != null) {
            User user = userRepository.findById(dto.getCreatedBy())
                    .orElse(null);
            entity.setCreatedBy(user);
        }

        if (dto.getStartedAt() != null) {
            entity.setStartedAt(dto.getStartedAt());
        }

        if (dto.getCompletedAt() != null) {
            entity.setCompletedAt(dto.getCompletedAt());
        }
    }

    private VisitControlDTO convertToDTO(VisitControl entity) {
        VisitControlDTO dto = new VisitControlDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setLocation(entity.getLocation());
        dto.setAssignedTo(entity.getAssignedTo());
        dto.setVisitDate(entity.getVisitDate());
        dto.setScheduledAt(entity.getScheduledAt());
        dto.setStartedAt(entity.getStartedAt());
        dto.setCompletedAt(entity.getCompletedAt());
        dto.setStatus(entity.getStatus());
        dto.setObservations(entity.getObservations());
        dto.setFindings(entity.getFindings());
        dto.setReportUrl(entity.getReportUrl());
        dto.setIsSuccessful(entity.getIsSuccessful());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getSupervisor() != null) {
            dto.setSupervisorId(entity.getSupervisor().getId());
            dto.setSupervisorName(entity.getSupervisor().getName());
        }

        if (entity.getWorkPost() != null) {
            dto.setWorkPostId(entity.getWorkPost().getId());
            dto.setWorkPostName(entity.getWorkPost().getName());
        }

        // Mapear funcionÃ¡rio identificado
        if (entity.getEmployee() != null) {
            dto.setEmployeeId(entity.getEmployee().getId());
            dto.setEmployeeName(entity.getEmployee().getName());
        }
        dto.setEmployeeCpf(entity.getEmployeeCpf());
        dto.setEmployeeRegistrationNumber(entity.getEmployeeRegistrationNumber());

        if (entity.getCreatedBy() != null) {
            dto.setCreatedBy(entity.getCreatedBy().getId());
            dto.setCreatedByName(entity.getCreatedBy().getUsername());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<VisitControlDTO> getVisitControlsByFilters(UUID workPostId, VisitControlStatus status, LocalDate startDate, LocalDate endDate) {
        log.info("Buscando visitas com filtros - WorkPost: {}, Status: {}, StartDate: {}, EndDate: {}", 
                workPostId, status, startDate, endDate);
        
        // Usar Criteria API para buscar visitas com filtros
        List<VisitControl> visits = visitControlRepository.findByFiltersWithFetch(workPostId, status, startDate, endDate);
        log.info("Query findByFiltersWithFetch retornou {} visitas", visits.size());
        
        return visits.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] generatePDFReport(UUID workPostId, VisitControlStatus status, LocalDate startDate, LocalDate endDate) throws IOException {
        log.info("Gerando relatÃ³rio PDF de visitas - WorkPost: {}, Status: {}, StartDate: {}, EndDate: {}", 
                workPostId, status, startDate, endDate);
        
        // Buscar visitas com filtros usando Criteria API
        List<VisitControl> visits = visitControlRepository.findByFiltersWithFetch(workPostId, status, startDate, endDate);
        log.info("Query findByFiltersWithFetch retornou {} visitas", visits.size());
        
        // Verificar se as relaÃ§Ãµes foram carregadas
        if (!visits.isEmpty()) {
            VisitControl first = visits.get(0);
            log.debug("Primeira visita - WorkPost: {}, Supervisor: {}", 
                first.getWorkPost() != null ? first.getWorkPost().getName() : "null",
                first.getSupervisor() != null ? first.getSupervisor().getName() : "null");
        }
        
        log.info("Gerando PDF com {} visitas", visits.size());
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = null;
        PdfDocument pdfDoc = null;
        Document document = null;
        
        try {
            writer = new PdfWriter(baos);
            pdfDoc = new PdfDocument(writer);
            document = new Document(pdfDoc);
            document.setMargins(50, 50, 50, 50);
            
            // CabeÃ§alho da empresa
            Paragraph companyHeader = new Paragraph("PROMOVER VIGILÃ‚NCIA PATRIMONIAL LTDA")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(5);
            document.add(companyHeader);
            
            Paragraph companyInfo = new Paragraph("CNPJ: 43.576.260/0001-12")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(10)
                    .setMarginBottom(20);
            document.add(companyInfo);
            
            // TÃ­tulo
            Paragraph title = new Paragraph("RELATÃ“RIO DE CONTROLE DE VISITAS")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18)
                    .setBold()
                    .setMarginTop(10)
                    .setMarginBottom(20);
            document.add(title);
            
            // InformaÃ§Ãµes do relatÃ³rio
            Paragraph reportInfo = new Paragraph("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(10)
                    .setMarginBottom(10);
            document.add(reportInfo);
            
            // Filtros aplicados
            if (workPostId != null || status != null || startDate != null || endDate != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);
                
                if (workPostId != null) {
                    WorkPost workPost = workPostRepository.findById(workPostId).orElse(null);
                    String workPostName = workPost != null ? workPost.getName() : "ID: " + workPostId;
                    document.add(new Paragraph("Posto de Trabalho: " + workPostName).setFontSize(10).setMarginBottom(2));
                }
                if (status != null) {
                    document.add(new Paragraph("Status: " + getStatusLabel(status)).setFontSize(10).setMarginBottom(2));
                }
                if (startDate != null) {
                    document.add(new Paragraph("Data InÃ­cio: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (endDate != null) {
                    document.add(new Paragraph("Data Fim: " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // Total de visitas
            Paragraph totalInfo = new Paragraph("Total de visitas: " + visits.size())
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(totalInfo);
            
            // Tabela de visitas
            if (visits.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhuma visita encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));
                
                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("Local"));
                table.addHeaderCell(createHeaderCell("Posto de Trabalho"));
                table.addHeaderCell(createHeaderCell("ResponsÃ¡vel"));
                table.addHeaderCell(createHeaderCell("Supervisor"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Sucesso"));
                
                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (VisitControl visit : visits) {
                    // Debug: verificar se as relaÃ§Ãµes foram carregadas
                    String workPostName = "";
                    String supervisorName = "";
                    
                    if (visit.getWorkPost() != null) {
                        workPostName = visit.getWorkPost().getName();
                        log.debug("Visit {} - WorkPost carregado: {}", visit.getId(), workPostName);
                    } else {
                        log.warn("Visit {} - WorkPost Ã© null", visit.getId());
                    }
                    
                    if (visit.getSupervisor() != null) {
                        supervisorName = visit.getSupervisor().getName();
                        log.debug("Visit {} - Supervisor carregado: {}", visit.getId(), supervisorName);
                    } else {
                        log.warn("Visit {} - Supervisor Ã© null", visit.getId());
                    }
                    
                    table.addCell(createCell(visit.getVisitDate() != null ? 
                            visit.getVisitDate().format(dateFormatter) : ""));
                    table.addCell(createCell(visit.getLocation() != null ? visit.getLocation() : ""));
                    table.addCell(createCell(workPostName != null ? workPostName : ""));
                    table.addCell(createCell(visit.getAssignedTo() != null ? visit.getAssignedTo() : ""));
                    table.addCell(createCell(supervisorName != null ? supervisorName : ""));
                    table.addCell(createCell(visit.getStatus() != null ? getStatusLabel(visit.getStatus()) : ""));
                    table.addCell(createCell(visit.getIsSuccessful() != null && visit.getIsSuccessful() ? "Sim" : "NÃ£o"));
                }
                
                document.add(table);
            }
            
            // RodapÃ©
            Paragraph footer = new Paragraph("Documento gerado automaticamente pelo sistema FluxBus")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setMarginTop(30);
            document.add(footer);
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de visitas: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        } finally {
            if (document != null) {
                document.close();
            }
            if (pdfDoc != null) {
                pdfDoc.close();
            }
            if (writer != null) {
                writer.close();
            }
        }
        
        byte[] result = baos.toByteArray();
        log.info("PDF de visitas gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }

    @Transactional
    public VisitControlReportDTO generateAndSavePDFReport(UUID workPostId, VisitControlStatus status, 
                                                          LocalDate startDate, LocalDate endDate, UUID createdBy) throws IOException {
        log.info("Gerando e salvando relatÃ³rio PDF - WorkPost: {}, Status: {}, StartDate: {}, EndDate: {}, CreatedBy: {}", 
                workPostId, status, startDate, endDate, createdBy);
        
        // Buscar visitas uma Ãºnica vez para usar tanto no PDF quanto na contagem
        List<VisitControl> visits = visitControlRepository.findByFiltersWithFetch(workPostId, status, startDate, endDate);
        int totalVisits = visits.size();
        log.info("Total de visitas encontradas para o relatÃ³rio: {} (WorkPost: {}, Status: {}, StartDate: {}, EndDate: {})", 
                totalVisits, workPostId, status, startDate, endDate);
        
        if (totalVisits == 0) {
            log.warn("âš ï¸ Nenhuma visita encontrada com os filtros aplicados");
        } else {
            log.info("âœ… Visitas encontradas: {}", totalVisits);
            // Log das primeiras 3 visitas para debug
            for (int i = 0; i < Math.min(3, visits.size()); i++) {
                VisitControl v = visits.get(i);
                log.debug("Visita {}: ID={}, Data={}, Local={}, WorkPost={}, Supervisor={}", 
                        i + 1, v.getId(), v.getVisitDate(), v.getLocation(),
                        v.getWorkPost() != null ? v.getWorkPost().getName() : "null",
                        v.getSupervisor() != null ? v.getSupervisor().getName() : "null");
            }
        }
        
        // Gerar PDF (que tambÃ©m busca as visitas internamente, mas vamos usar a contagem acima)
        byte[] pdfBytes = generatePDFReport(workPostId, status, startDate, endDate);
        
        // Salvar relatÃ³rio com o total correto de visitas
        return reportService.saveReport(pdfBytes, workPostId, status, startDate, endDate, totalVisits, createdBy);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> findEmployeeByCpfOrRegistration(String cpf, String registrationNumber, UUID workPostId) {
        log.info("Buscando funcionÃ¡rio - CPF: {}, MatrÃ­cula: {}, WorkPost: {}", cpf, registrationNumber, workPostId);
        
        Map<String, Object> result = new HashMap<>();
        
        // Validar que pelo menos CPF ou matrÃ­cula foi informado
        if ((cpf == null || cpf.trim().isEmpty()) && (registrationNumber == null || registrationNumber.trim().isEmpty())) {
            result.put("success", false);
            result.put("error", "Informe CPF ou matrÃ­cula do funcionÃ¡rio");
            return result;
        }
        
        // Validar que workPostId foi informado
        if (workPostId == null) {
            result.put("success", false);
            result.put("error", "Posto de trabalho Ã© obrigatÃ³rio");
            return result;
        }
        
        // Verificar se o posto de trabalho existe
        WorkPost workPost = workPostRepository.findById(workPostId)
                .orElse(null);
        if (workPost == null) {
            result.put("success", false);
            result.put("error", "Posto de trabalho nÃ£o encontrado");
            return result;
        }
        
        Optional<Employee> employeeOpt = Optional.empty();
        
        // Buscar por CPF se informado
        if (cpf != null && !cpf.trim().isEmpty()) {
            String normalizedCpf = cpf.replaceAll("[^0-9]", "");
            log.debug("Buscando funcionÃ¡rio por CPF normalizado: {}", normalizedCpf);
            
            // Tentar buscar por CPF
            employeeOpt = employeeRepository.findByCpf(normalizedCpf);
            
            // Se nÃ£o encontrou, tentar buscar por document
            if (employeeOpt.isEmpty()) {
                employeeOpt = employeeRepository.findByDocument(normalizedCpf);
            }
            
            // Se ainda nÃ£o encontrou, tentar buscar por username do User
            if (employeeOpt.isEmpty()) {
                Optional<User> userOpt = userRepository.findByUsername(normalizedCpf);
                if (userOpt.isPresent()) {
                    employeeOpt = employeeRepository.findByUserId(userOpt.get().getId());
                }
            }
        }
        
        // Se nÃ£o encontrou por CPF, tentar buscar por matrÃ­cula
        if (employeeOpt.isEmpty() && registrationNumber != null && !registrationNumber.trim().isEmpty()) {
            log.debug("Buscando funcionÃ¡rio por matrÃ­cula: {}", registrationNumber);
            employeeOpt = employeeRepository.findByRegistrationNumber(registrationNumber.trim());
        }
        
        if (employeeOpt.isEmpty()) {
            result.put("success", false);
            result.put("error", "FuncionÃ¡rio nÃ£o encontrado com os dados informados");
            return result;
        }
        
        Employee employee = employeeOpt.get();
        log.info("âœ… FuncionÃ¡rio encontrado: {} (ID: {})", employee.getName(), employee.getId());
        
        // Verificar se o funcionÃ¡rio estÃ¡ atribuÃ­do ao posto de trabalho
        LocalDate today = LocalDate.now();
        List<com.z7design.fleet_manager.model.WorkPostAssignment> assignments = 
                workPostAssignmentRepository.findByWorkPostId(workPostId);
        
        boolean isAssigned = assignments.stream()
                .anyMatch(assignment -> 
                    assignment.getEmployee().getId().equals(employee.getId()) &&
                    (assignment.getAssignmentDate().equals(today) || 
                     assignment.getAssignmentDate().isBefore(today)) &&
                    assignment.getStatus() == com.z7design.fleet_manager.model.WorkPostAssignment.AssignmentStatus.ACTIVE
                );
        
        // Montar resposta
        result.put("success", true);
        result.put("employee", Map.of(
            "id", employee.getId().toString(),
            "name", employee.getName() != null ? employee.getName() : "",
            "cpf", employee.getDocument() != null ? employee.getDocument() : "",
            "registrationNumber", employee.getRegistrationNumber() != null ? employee.getRegistrationNumber() : "",
            "position", employee.getPosition() != null ? employee.getPosition().getName() : ""
        ));
        result.put("isAssignedToWorkPost", isAssigned);
        result.put("workPostName", workPost.getName());
        
        if (!isAssigned) {
            result.put("warning", "FuncionÃ¡rio nÃ£o estÃ¡ atribuÃ­do ao posto de trabalho na data atual");
        }
        
        return result;
    }
    
    private String getStatusLabel(VisitControlStatus status) {
        if (status == null) return "";
        switch (status) {
            case SCHEDULED: return "Agendada";
            case IN_PROGRESS: return "Em Andamento";
            case COMPLETED: return "ConcluÃ­da";
            case CANCELLED: return "Cancelada";
            case PENDING: return "Pendente";
            default: return status.toString();
        }
    }
    
    private Cell createHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }
    
    private Cell createCell(String text) {
        return new Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setTextAlignment(TextAlignment.LEFT);
    }
}

















