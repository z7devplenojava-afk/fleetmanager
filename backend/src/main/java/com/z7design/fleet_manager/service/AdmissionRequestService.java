package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.AdmissionRequestDTO;
import com.z7design.fleet_manager.dto.CreateAdmissionRequestDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.AdmissionRequest;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.AdmissionRequestStatus;
import com.z7design.fleet_manager.model.enums.AdmissionRequestType;
import com.z7design.fleet_manager.model.enums.AdmissionRequestPriority;
import com.z7design.fleet_manager.repository.AdmissionRequestRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdmissionRequestService {
    
    private final AdmissionRequestRepository admissionRequestRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    
    public List<AdmissionRequestDTO> findAll() {
        List<AdmissionRequest> requests = admissionRequestRepository.findAll();
        return requests.stream()
                .map(AdmissionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public AdmissionRequestDTO findById(UUID id) {
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        return AdmissionRequestDTO.fromEntity(request);
    }
    
    public AdmissionRequestDTO create(CreateAdmissionRequestDTO dto) {
        log.info("Criando nova solicitaÃ§Ã£o de admissÃ£o/demissÃ£o: {}", dto);
        
        AdmissionRequest request = AdmissionRequest.builder()
                .type(dto.getType())
                .employeeName(dto.getEmployeeName())
                .employeeCpf(dto.getEmployeeCpf())
                .employeeRg(dto.getEmployeeRg())
                .employeeEmail(dto.getEmployeeEmail())
                .employeePhone(dto.getEmployeePhone())
                .position(dto.getPosition())
                .department(dto.getDepartment())
                .unit(dto.getUnitId() != null ? unitRepository.findById(dto.getUnitId()).orElse(null) : null)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .justification(dto.getJustification())
                .priority(dto.getPriority() != null ? dto.getPriority() : AdmissionRequestPriority.MEDIUM)
                .status(AdmissionRequestStatus.PENDING)
                .requestDate(LocalDate.now())
                .requesterName(dto.getRequesterName())
                .requester(dto.getRequesterId() != null ? userRepository.findById(dto.getRequesterId()).orElse(null) : null)
                .approver(dto.getApproverId() != null ? userRepository.findById(dto.getApproverId()).orElse(null) : null)
                .notes(dto.getNotes())
                .build();
        
        AdmissionRequest savedRequest = admissionRequestRepository.save(request);
        log.info("SolicitaÃ§Ã£o criada com sucesso: {}", savedRequest.getId());
        return AdmissionRequestDTO.fromEntity(savedRequest);
    }
    
    public AdmissionRequestDTO update(UUID id, CreateAdmissionRequestDTO dto) {
        log.info("Atualizando solicitaÃ§Ã£o: {}", id);
        
        AdmissionRequest existingRequest = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        
        // Atualizar campos
        existingRequest.setType(dto.getType());
        existingRequest.setEmployeeName(dto.getEmployeeName());
        existingRequest.setEmployeeCpf(dto.getEmployeeCpf());
        existingRequest.setEmployeeRg(dto.getEmployeeRg());
        existingRequest.setEmployeeEmail(dto.getEmployeeEmail());
        existingRequest.setEmployeePhone(dto.getEmployeePhone());
        existingRequest.setPosition(dto.getPosition());
        existingRequest.setDepartment(dto.getDepartment());
        existingRequest.setUnit(dto.getUnitId() != null ? unitRepository.findById(dto.getUnitId()).orElse(null) : null);
        existingRequest.setStartDate(dto.getStartDate());
        existingRequest.setEndDate(dto.getEndDate());
        existingRequest.setReason(dto.getReason());
        existingRequest.setJustification(dto.getJustification());
        if (dto.getPriority() != null) {
            existingRequest.setPriority(dto.getPriority());
        }
        existingRequest.setRequesterName(dto.getRequesterName());
        existingRequest.setRequester(dto.getRequesterId() != null ? userRepository.findById(dto.getRequesterId()).orElse(null) : null);
        existingRequest.setApprover(dto.getApproverId() != null ? userRepository.findById(dto.getApproverId()).orElse(null) : null);
        existingRequest.setNotes(dto.getNotes());
        
        AdmissionRequest updatedRequest = admissionRequestRepository.save(existingRequest);
        log.info("SolicitaÃ§Ã£o atualizada com sucesso: {}", updatedRequest.getId());
        return AdmissionRequestDTO.fromEntity(updatedRequest);
    }
    
    public void delete(UUID id) {
        log.info("Excluindo solicitaÃ§Ã£o: {}", id);
        if (!admissionRequestRepository.existsById(id)) {
            throw new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id);
        }
        admissionRequestRepository.deleteById(id);
        log.info("SolicitaÃ§Ã£o excluÃ­da com sucesso: {}", id);
    }
    
    public AdmissionRequestDTO approve(UUID id, String approverName, String approvalNotes) {
        log.info("Aprovando solicitaÃ§Ã£o: {}", id);
        
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        
        if (request.getStatus() != AdmissionRequestStatus.PENDING) {
            throw new IllegalStateException("Apenas solicitaÃ§Ãµes pendentes podem ser aprovadas");
        }
        
        request.setStatus(AdmissionRequestStatus.APPROVED);
        request.setApprovalDate(LocalDate.now());
        request.setApprovalNotes(approvalNotes);
        // TODO: Buscar usuÃ¡rio atual do contexto de seguranÃ§a
        if (approverName != null) {
            request.setApprovedByName(approverName);
        }
        
        AdmissionRequest approvedRequest = admissionRequestRepository.save(request);
        log.info("SolicitaÃ§Ã£o aprovada com sucesso: {}", approvedRequest.getId());
        return AdmissionRequestDTO.fromEntity(approvedRequest);
    }
    
    public AdmissionRequestDTO reject(UUID id, String rejectorName, String rejectionReason) {
        log.info("Rejeitando solicitaÃ§Ã£o: {}", id);
        
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        
        if (request.getStatus() != AdmissionRequestStatus.PENDING) {
            throw new IllegalStateException("Apenas solicitaÃ§Ãµes pendentes podem ser rejeitadas");
        }
        
        request.setStatus(AdmissionRequestStatus.REJECTED);
        request.setRejectionReason(rejectionReason);
        request.setRejectedByName(rejectorName);
        // TODO: Buscar usuÃ¡rio atual do contexto de seguranÃ§a e setar rejectedBy
        
        AdmissionRequest rejectedRequest = admissionRequestRepository.save(request);
        log.info("SolicitaÃ§Ã£o rejeitada com sucesso: {}", rejectedRequest.getId());
        return AdmissionRequestDTO.fromEntity(rejectedRequest);
    }
    
    public AdmissionRequestDTO complete(UUID id) {
        log.info("Completando solicitaÃ§Ã£o: {}", id);
        
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        
        if (request.getStatus() != AdmissionRequestStatus.APPROVED) {
            throw new IllegalStateException("Apenas solicitaÃ§Ãµes aprovadas podem ser completadas");
        }
        
        request.setStatus(AdmissionRequestStatus.COMPLETED);
        request.setCompletionDate(LocalDate.now());
        
        AdmissionRequest completedRequest = admissionRequestRepository.save(request);
        log.info("SolicitaÃ§Ã£o completada com sucesso: {}", completedRequest.getId());
        return AdmissionRequestDTO.fromEntity(completedRequest);
    }
    
    public List<AdmissionRequestDTO> findByStatus(AdmissionRequestStatus status) {
        List<AdmissionRequest> requests = admissionRequestRepository.findByStatus(status);
        return requests.stream()
                .map(AdmissionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<AdmissionRequestDTO> findByType(AdmissionRequestType type) {
        List<AdmissionRequest> requests = admissionRequestRepository.findByType(type);
        return requests.stream()
                .map(AdmissionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<AdmissionRequestDTO> findPendingApprovalRequests() {
        List<AdmissionRequest> requests = admissionRequestRepository.findPendingApprovalRequests();
        return requests.stream()
                .map(AdmissionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<AdmissionRequestDTO> searchRequests(String type, String searchTerm, LocalDate startDate, LocalDate endDate) {
        AdmissionRequestType requestType = null;
        if (type != null && !type.isEmpty()) {
            try {
                requestType = AdmissionRequestType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Tipo de solicitaÃ§Ã£o invÃ¡lido: {}", type);
            }
        }
        
        List<AdmissionRequest> requests = admissionRequestRepository.searchWithFilters(
            requestType,
            searchTerm,
            startDate,
            endDate
        );
        
        return requests.stream()
                .map(AdmissionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public long countByStatus(AdmissionRequestStatus status) {
        return admissionRequestRepository.countByStatus(status);
    }
    
    public long countByType(AdmissionRequestType type) {
        return admissionRequestRepository.countByType(type);
    }
    
    @Transactional(readOnly = true)
    public byte[] generatePDFReport(String employeeName, AdmissionRequestType type, 
                                     LocalDate startDate, LocalDate endDate, 
                                     AdmissionRequestStatus status) throws IOException {
        log.info("Gerando relatÃ³rio PDF de solicitaÃ§Ãµes - EmployeeName: {}, Type: {}, StartDate: {}, EndDate: {}, Status: {}",
                employeeName, type, startDate, endDate, status);
        
        // Buscar solicitaÃ§Ãµes com filtros
        List<AdmissionRequest> allRequests = admissionRequestRepository.findAll();
        
        // Aplicar filtros
        List<AdmissionRequest> filteredRequests = allRequests.stream()
                .filter(r -> employeeName == null || employeeName.isEmpty() || 
                        (r.getEmployeeName() != null && r.getEmployeeName().toLowerCase().contains(employeeName.toLowerCase())))
                .filter(r -> type == null || r.getType() == type)
                .filter(r -> status == null || r.getStatus() == status)
                .filter(r -> startDate == null || (r.getRequestDate() != null && !r.getRequestDate().isBefore(startDate)))
                .filter(r -> endDate == null || (r.getRequestDate() != null && !r.getRequestDate().isAfter(endDate)))
                .collect(Collectors.toList());
        
        log.info("Total de solicitaÃ§Ãµes encontradas para o relatÃ³rio: {}", filteredRequests.size());
        
        List<AdmissionRequestDTO> dtos = filteredRequests.stream()
                .map(AdmissionRequestDTO::fromEntity)
                .collect(Collectors.toList());
        
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
            Paragraph title = new Paragraph("RELATÃ“RIO DE SOLICITAÃ‡Ã•ES DE ADMISSÃƒO/DEMISSÃƒO")
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
            if (employeeName != null || type != null || status != null || startDate != null || endDate != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(12)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);
                
                if (employeeName != null && !employeeName.isEmpty()) {
                    document.add(new Paragraph("FuncionÃ¡rio: " + employeeName).setFontSize(10).setMarginBottom(2));
                }
                if (type != null) {
                    document.add(new Paragraph("Tipo: " + (type == AdmissionRequestType.ADMISSION ? "AdmissÃ£o" : "DemissÃ£o")).setFontSize(10).setMarginBottom(2));
                }
                if (status != null) {
                    String statusText = switch (status) {
                        case PENDING -> "Pendente";
                        case APPROVED -> "Aprovado";
                        case REJECTED -> "Rejeitado";
                        case COMPLETED -> "Completado";
                        case CANCELLED -> "Cancelado";
                        default -> status.toString();
                    };
                    document.add(new Paragraph("Status: " + statusText).setFontSize(10).setMarginBottom(2));
                }
                if (startDate != null && endDate != null) {
                    document.add(new Paragraph("PerÃ­odo: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                            " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                } else if (startDate != null) {
                    document.add(new Paragraph("Data inicial: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                } else if (endDate != null) {
                    document.add(new Paragraph("Data final: " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                
                document.add(new Paragraph("").setMarginBottom(10));
            }
            
            // EstatÃ­sticas
            long totalRequests = dtos.size();
            long admissionCount = dtos.stream().filter(d -> d.getType() == AdmissionRequestType.ADMISSION).count();
            long dismissalCount = dtos.stream().filter(d -> d.getType() == AdmissionRequestType.DISMISSAL).count();
            long pendingCount = dtos.stream().filter(d -> d.getStatus() == AdmissionRequestStatus.PENDING).count();
            long approvedCount = dtos.stream().filter(d -> d.getStatus() == AdmissionRequestStatus.APPROVED).count();
            
            Paragraph stats = new Paragraph(String.format(
                    "Total de solicitaÃ§Ãµes: %d | AdmissÃµes: %d | DemissÃµes: %d | Pendentes: %d | Aprovadas: %d",
                    totalRequests, admissionCount, dismissalCount, pendingCount, approvedCount))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);
            
            // Tabela com solicitaÃ§Ãµes
            if (!dtos.isEmpty()) {
                Table table = new Table(UnitValue.createPercentArray(new float[]{12f, 15f, 12f, 10f, 10f, 12f, 12f, 17f}))
                        .useAllAvailableWidth()
                        .setMarginBottom(20);
                
                // CabeÃ§alho da tabela
                table.addHeaderCell(createHeaderCell("NÃºmero"));
                table.addHeaderCell(createHeaderCell("FuncionÃ¡rio"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Cargo"));
                table.addHeaderCell(createHeaderCell("Unidade"));
                table.addHeaderCell(createHeaderCell("Solicitante"));
                
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (AdmissionRequestDTO dto : dtos) {
                    table.addCell(createCell(dto.getRequestNumber() != null ? dto.getRequestNumber() : ""));
                    table.addCell(createCell(dto.getEmployeeName() != null ? dto.getEmployeeName() : ""));
                    table.addCell(createCell(dto.getType() == AdmissionRequestType.ADMISSION ? "AdmissÃ£o" : "DemissÃ£o"));
                    table.addCell(createCell(dto.getRequestDate() != null ? dto.getRequestDate().format(dateFormatter) : ""));
                    
                    String statusText = "";
                    if (dto.getStatus() != null) {
                        statusText = switch (dto.getStatus()) {
                            case PENDING -> "Pendente";
                            case APPROVED -> "Aprovado";
                            case REJECTED -> "Rejeitado";
                            case COMPLETED -> "Completado";
                            case CANCELLED -> "Cancelado";
                            default -> dto.getStatus().toString();
                        };
                    }
                    table.addCell(createCell(statusText));
                    table.addCell(createCell(dto.getPosition() != null ? dto.getPosition() : ""));
                    table.addCell(createCell(dto.getUnitName() != null ? dto.getUnitName() : ""));
                    table.addCell(createCell(dto.getRequesterName() != null ? dto.getRequesterName() : ""));
                }
                
                document.add(table);
            } else {
                Paragraph noData = new Paragraph("Nenhuma solicitaÃ§Ã£o encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            }
            
            document.close();
            pdfDoc.close();
            writer.close();
            
            byte[] pdfBytes = baos.toByteArray();
            log.info("RelatÃ³rio PDF gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF: {}", e.getMessage(), e);
            if (document != null) document.close();
            if (pdfDoc != null) pdfDoc.close();
            if (writer != null) writer.close();
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public byte[] generatePDF(UUID id) throws IOException {
        log.info("Gerando PDF para solicitaÃ§Ã£o de admissÃ£o/demissÃ£o: {}", id);
        
        AdmissionRequest request = admissionRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SolicitaÃ§Ã£o nÃ£o encontrada com ID: " + id));
        
        AdmissionRequestDTO dto = AdmissionRequestDTO.fromEntity(request);
        
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
            String titleText = dto.getType() == AdmissionRequestType.ADMISSION 
                    ? "SOLICITAÃ‡ÃƒO DE ADMISSÃƒO" 
                    : "SOLICITAÃ‡ÃƒO DE DEMISSÃƒO";
            Paragraph title = new Paragraph(titleText)
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
                    .setMarginBottom(20);
            document.add(reportInfo);
            
            // Tabela com informaÃ§Ãµes da solicitaÃ§Ã£o
            Table table = new Table(UnitValue.createPercentArray(new float[]{35f, 65f}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);
            
            // Adicionar linhas da tabela
            table.addCell(createHeaderCell("NÃºmero da SolicitaÃ§Ã£o"));
            table.addCell(createCell(dto.getRequestNumber() != null ? dto.getRequestNumber() : "N/A"));
            
            table.addCell(createHeaderCell("Tipo"));
            String typeText = dto.getType() != null 
                    ? (dto.getType() == AdmissionRequestType.ADMISSION ? "AdmissÃ£o" : "DemissÃ£o")
                    : "N/A";
            table.addCell(createCell(typeText));
            
            table.addCell(createHeaderCell("Status"));
            String statusText = "N/A";
            if (dto.getStatus() != null) {
                statusText = switch (dto.getStatus()) {
                    case PENDING -> "Pendente";
                    case APPROVED -> "Aprovado";
                    case REJECTED -> "Rejeitado";
                    case COMPLETED -> "Completado";
                    case CANCELLED -> "Cancelado";
                    default -> dto.getStatus().toString();
                };
            }
            table.addCell(createCell(statusText));
            
            table.addCell(createHeaderCell("FuncionÃ¡rio"));
            table.addCell(createCell(dto.getEmployeeName() != null ? dto.getEmployeeName() : "N/A"));
            
            if (dto.getEmployeeCpf() != null && !dto.getEmployeeCpf().isEmpty()) {
                table.addCell(createHeaderCell("CPF"));
                table.addCell(createCell(dto.getEmployeeCpf()));
            }
            
            if (dto.getEmployeeRg() != null && !dto.getEmployeeRg().isEmpty()) {
                table.addCell(createHeaderCell("RG"));
                table.addCell(createCell(dto.getEmployeeRg()));
            }
            
            if (dto.getPosition() != null && !dto.getPosition().isEmpty()) {
                table.addCell(createHeaderCell("Cargo"));
                table.addCell(createCell(dto.getPosition()));
            }
            
            if (dto.getDepartment() != null && !dto.getDepartment().isEmpty()) {
                table.addCell(createHeaderCell("Departamento"));
                table.addCell(createCell(dto.getDepartment()));
            }
            
            if (dto.getUnitName() != null && !dto.getUnitName().isEmpty()) {
                table.addCell(createHeaderCell("Unidade"));
                table.addCell(createCell(dto.getUnitName()));
            }
            
            if (dto.getRequestDate() != null) {
                table.addCell(createHeaderCell("Data da SolicitaÃ§Ã£o"));
                table.addCell(createCell(dto.getRequestDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            } else {
                table.addCell(createHeaderCell("Data da SolicitaÃ§Ã£o"));
                table.addCell(createCell("N/A"));
            }
            
            if (dto.getStartDate() != null) {
                table.addCell(createHeaderCell("Data de InÃ­cio"));
                table.addCell(createCell(dto.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            }
            
            if (dto.getEndDate() != null) {
                table.addCell(createHeaderCell("Data de Fim"));
                table.addCell(createCell(dto.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            }
            
            if (dto.getReason() != null && !dto.getReason().isEmpty()) {
                table.addCell(createHeaderCell("Motivo"));
                table.addCell(createCell(dto.getReason()));
            }
            
            if (dto.getJustification() != null && !dto.getJustification().isEmpty()) {
                table.addCell(createHeaderCell("Justificativa"));
                table.addCell(createCell(dto.getJustification()));
            }
            
            if (dto.getNotes() != null && !dto.getNotes().isEmpty()) {
                table.addCell(createHeaderCell("ObservaÃ§Ãµes"));
                table.addCell(createCell(dto.getNotes()));
            }
            
            if (dto.getRequesterName() != null && !dto.getRequesterName().isEmpty()) {
                table.addCell(createHeaderCell("Solicitante"));
                table.addCell(createCell(dto.getRequesterName()));
            }
            
            if (dto.getApprovedByName() != null && !dto.getApprovedByName().isEmpty()) {
                table.addCell(createHeaderCell("Aprovador"));
                table.addCell(createCell(dto.getApprovedByName()));
            }
            
            if (dto.getApprovalDate() != null) {
                table.addCell(createHeaderCell("Data de AprovaÃ§Ã£o"));
                table.addCell(createCell(dto.getApprovalDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            }
            
            if (dto.getApprovalNotes() != null && !dto.getApprovalNotes().isEmpty()) {
                table.addCell(createHeaderCell("Notas de AprovaÃ§Ã£o"));
                table.addCell(createCell(dto.getApprovalNotes()));
            }
            
            document.add(table);
            
            document.close();
            pdfDoc.close();
            writer.close();
            
            byte[] pdfBytes = baos.toByteArray();
            log.info("PDF gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da solicitaÃ§Ã£o: {}", e.getMessage(), e);
            if (document != null) document.close();
            if (pdfDoc != null) pdfDoc.close();
            if (writer != null) writer.close();
            throw new IOException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }
    
    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "N/A"))
                .setPadding(8);
    }
    
    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "N/A"))
                .setPadding(8)
                .setBold()
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }
}









