package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateOccurrenceDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.OperationalOccurrence;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.OperationalOccurrenceRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
public class OperationalOccurrenceService {
    
    private final OperationalOccurrenceRepository occurrenceRepository;
    private final EmployeeRepository employeeRepository;
    
    /**
     * Criar nova ocorrÃªncia operacional a partir de DTO
     */
    public OperationalOccurrence createFromDTO(CreateOccurrenceDTO dto) {
        log.info("Criando nova ocorrÃªncia a partir de DTO para funcionÃ¡rio: {}", dto.getEmployeeId());
        
        // Validar funcionÃ¡rio
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Validar nÃºmero de advertÃªncia se fornecido
        if (dto.getWarningNumber() != null && 
            occurrenceRepository.existsByWarningNumber(dto.getWarningNumber())) {
            throw new BusinessException("NÃºmero de advertÃªncia jÃ¡ existe");
        }
        
        // Converter tipo
        OperationalOccurrence.OccurrenceType type;
        try {
            type = OperationalOccurrence.OccurrenceType.valueOf(dto.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Tipo de ocorrÃªncia invÃ¡lido: " + dto.getType());
        }
        
        // Converter status (se nÃ£o fornecido, usar PENDENTE)
        OperationalOccurrence.OccurrenceStatus status = OperationalOccurrence.OccurrenceStatus.PENDENTE;
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            try {
                status = OperationalOccurrence.OccurrenceStatus.valueOf(dto.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Status invÃ¡lido: {}, usando PENDENTE", dto.getStatus());
            }
        }
        
        // Converter prioridade (se nÃ£o fornecido, usar MEDIA)
        OperationalOccurrence.OccurrencePriority priority = OperationalOccurrence.OccurrencePriority.MEDIA;
        if (dto.getPriority() != null && !dto.getPriority().isEmpty()) {
            try {
                priority = OperationalOccurrence.OccurrencePriority.valueOf(dto.getPriority().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Prioridade invÃ¡lida: {}, usando MEDIA", dto.getPriority());
            }
        }
        
        // Converter data
        LocalDateTime date = dto.getDateAsLocalDateTime();
        
        // Criar ocorrÃªncia
        OperationalOccurrence occurrence = OperationalOccurrence.builder()
            .type(type)
            .title(dto.getTitle())
            .description(dto.getDescription())
            .employee(employee)
            .location(dto.getLocation())
            .status(status)
            .priority(priority)
            .date(date)
            .responsible(dto.getResponsible())
            .warningNumber(dto.getWarningNumber())
            .build();
        
        OperationalOccurrence savedOccurrence = occurrenceRepository.save(occurrence);
        log.info("OcorrÃªncia criada com sucesso: {}", savedOccurrence.getId());
        
        return savedOccurrence;
    }
    
    /**
     * Criar nova ocorrÃªncia operacional
     */
    public OperationalOccurrence createOccurrence(OperationalOccurrence occurrence) {
        log.info("Criando nova ocorrÃªncia para funcionÃ¡rio: {}", occurrence.getEmployee().getId());
        
        // Validar funcionÃ¡rio
        Employee employee = employeeRepository.findById(occurrence.getEmployee().getId())
            .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Validar nÃºmero de advertÃªncia se fornecido
        if (occurrence.getWarningNumber() != null && 
            occurrenceRepository.existsByWarningNumber(occurrence.getWarningNumber())) {
            throw new BusinessException("NÃºmero de advertÃªncia jÃ¡ existe");
        }
        
        // Definir status inicial
        occurrence.setStatus(OperationalOccurrence.OccurrenceStatus.PENDENTE);
        occurrence.setEmployee(employee);
        occurrence.setDate(LocalDateTime.now());
        
        OperationalOccurrence savedOccurrence = occurrenceRepository.save(occurrence);
        log.info("OcorrÃªncia criada com sucesso: {}", savedOccurrence.getId());
        
        return savedOccurrence;
    }
    
    /**
     * Atualizar ocorrÃªncia existente
     */
    public OperationalOccurrence updateOccurrence(UUID id, OperationalOccurrence occurrenceDetails) {
        log.info("Atualizando ocorrÃªncia: {}", id);
        
        OperationalOccurrence existingOccurrence = occurrenceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("OcorrÃªncia nÃ£o encontrada"));
        
        // Validar funcionÃ¡rio se foi alterado
        if (occurrenceDetails.getEmployee() != null && 
            !occurrenceDetails.getEmployee().getId().equals(existingOccurrence.getEmployee().getId())) {
            Employee employee = employeeRepository.findById(occurrenceDetails.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
            existingOccurrence.setEmployee(employee);
        }
        
        // Validar nÃºmero de advertÃªncia se foi alterado
        if (occurrenceDetails.getWarningNumber() != null && 
            !occurrenceDetails.getWarningNumber().equals(existingOccurrence.getWarningNumber()) &&
            occurrenceRepository.existsByWarningNumber(occurrenceDetails.getWarningNumber())) {
            throw new BusinessException("NÃºmero de advertÃªncia jÃ¡ existe");
        }
        
        // Atualizar campos
        if (occurrenceDetails.getType() != null) {
            existingOccurrence.setType(occurrenceDetails.getType());
        }
        if (occurrenceDetails.getTitle() != null) {
            existingOccurrence.setTitle(occurrenceDetails.getTitle());
        }
        if (occurrenceDetails.getDescription() != null) {
            existingOccurrence.setDescription(occurrenceDetails.getDescription());
        }
        if (occurrenceDetails.getLocation() != null) {
            existingOccurrence.setLocation(occurrenceDetails.getLocation());
        }
        if (occurrenceDetails.getStatus() != null) {
            existingOccurrence.setStatus(occurrenceDetails.getStatus());
        }
        if (occurrenceDetails.getPriority() != null) {
            existingOccurrence.setPriority(occurrenceDetails.getPriority());
        }
        if (occurrenceDetails.getResponsible() != null) {
            existingOccurrence.setResponsible(occurrenceDetails.getResponsible());
        }
        if (occurrenceDetails.getWarningNumber() != null) {
            existingOccurrence.setWarningNumber(occurrenceDetails.getWarningNumber());
        }
        
        existingOccurrence.setUpdatedAt(LocalDateTime.now());
        
        OperationalOccurrence updatedOccurrence = occurrenceRepository.save(existingOccurrence);
        log.info("OcorrÃªncia atualizada com sucesso: {}", updatedOccurrence.getId());
        
        return updatedOccurrence;
    }
    
    /**
     * Buscar ocorrÃªncia por ID
     */
    @Transactional(readOnly = true)
    public OperationalOccurrence getOccurrenceById(UUID id) {
        return occurrenceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("OcorrÃªncia nÃ£o encontrada"));
    }
    
    /**
     * Listar todas as ocorrÃªncias
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getAllOccurrences() {
        try {
            return occurrenceRepository.findAllWithRelationships();
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar todas as ocorrÃªncias", e);
            // Fallback para findAll() sem relaÃ§Ãµes se houver erro
            log.warn("âš ï¸ Tentando buscar ocorrÃªncias sem relaÃ§Ãµes carregadas");
            return occurrenceRepository.findAll();
        }
    }
    
    /**
     * Buscar ocorrÃªncias por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByEmployee(UUID employeeId) {
        return occurrenceRepository.findByEmployeeIdOrderByDateDesc(employeeId);
    }
    
    /**
     * Buscar ocorrÃªncias por tipo
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByType(OperationalOccurrence.OccurrenceType type) {
        return occurrenceRepository.findByTypeOrderByDateDesc(type);
    }
    
    /**
     * Buscar ocorrÃªncias por status
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByStatus(OperationalOccurrence.OccurrenceStatus status) {
        return occurrenceRepository.findByStatusOrderByDateDesc(status);
    }
    
    /**
     * Buscar ocorrÃªncias por prioridade
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByPriority(OperationalOccurrence.OccurrencePriority priority) {
        return occurrenceRepository.findByPriorityOrderByDateDesc(priority);
    }
    
    /**
     * Buscar ocorrÃªncias por perÃ­odo
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
    }
    
    /**
     * Buscar ocorrÃªncias pendentes
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getPendingOccurrences() {
        return occurrenceRepository.findByStatusOrderByPriorityDescDateAsc(OperationalOccurrence.OccurrenceStatus.PENDENTE);
    }
    
    /**
     * Buscar ocorrÃªncias nÃ£o resolvidas por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getUnresolvedOccurrencesByEmployee(UUID employeeId) {
        return occurrenceRepository.findUnresolvedByEmployee(employeeId);
    }
    
    /**
     * Buscar ocorrÃªncias por responsÃ¡vel
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByResponsible(String responsible) {
        return occurrenceRepository.findByResponsibleOrderByDateDesc(responsible);
    }
    
    /**
     * Buscar ocorrÃªncias por local
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByLocation(String location) {
        return occurrenceRepository.findByLocationContainingIgnoreCaseOrderByDateDesc(location);
    }
    
    /**
     * Buscar ocorrÃªncia por nÃºmero de advertÃªncia
     */
    @Transactional(readOnly = true)
    public OperationalOccurrence getOccurrenceByWarningNumber(Integer warningNumber) {
        return occurrenceRepository.findByWarningNumber(warningNumber);
    }
    
    /**
     * Atualizar status da ocorrÃªncia
     */
    public OperationalOccurrence updateOccurrenceStatus(UUID id, OperationalOccurrence.OccurrenceStatus newStatus) {
        log.info("Atualizando status da ocorrÃªncia: {} para {}", id, newStatus);
        
        OperationalOccurrence occurrence = getOccurrenceById(id);
        
        // Validar transiÃ§Ã£o de status
        if (occurrence.getStatus() == OperationalOccurrence.OccurrenceStatus.CONCLUIDO) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel alterar o status de uma ocorrÃªncia jÃ¡ concluÃ­da");
        }
        
        occurrence.setStatus(newStatus);
        occurrence.setUpdatedAt(LocalDateTime.now());
        
        OperationalOccurrence updatedOccurrence = occurrenceRepository.save(occurrence);
        log.info("Status da ocorrÃªncia atualizado com sucesso: {}", updatedOccurrence.getId());
        
        return updatedOccurrence;
    }
    
    /**
     * Atualizar prioridade da ocorrÃªncia
     */
    public OperationalOccurrence updateOccurrencePriority(UUID id, OperationalOccurrence.OccurrencePriority newPriority) {
        log.info("Atualizando prioridade da ocorrÃªncia: {} para {}", id, newPriority);
        
        OperationalOccurrence occurrence = getOccurrenceById(id);
        occurrence.setPriority(newPriority);
        occurrence.setUpdatedAt(LocalDateTime.now());
        
        OperationalOccurrence updatedOccurrence = occurrenceRepository.save(occurrence);
        log.info("Prioridade da ocorrÃªncia atualizada com sucesso: {}", updatedOccurrence.getId());
        
        return updatedOccurrence;
    }
    
    /**
     * Deletar ocorrÃªncia
     */
    public void deleteOccurrence(UUID id) {
        log.info("Deletando ocorrÃªncia: {}", id);
        
        OperationalOccurrence occurrence = getOccurrenceById(id);
        
        if (occurrence.getStatus() == OperationalOccurrence.OccurrenceStatus.CONCLUIDO) {
            throw new BusinessException("NÃ£o Ã© possÃ­vel deletar uma ocorrÃªncia jÃ¡ concluÃ­da");
        }
        
        occurrenceRepository.delete(occurrence);
        log.info("OcorrÃªncia deletada com sucesso: {}", id);
    }
    
    /**
     * Contar ocorrÃªncias por funcionÃ¡rio e perÃ­odo
     */
    @Transactional(readOnly = true)
    public long countOccurrencesByEmployeeAndPeriod(UUID employeeId, LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.countByEmployeeAndPeriod(employeeId, startDate, endDate);
    }
    
    /**
     * Contar ocorrÃªncias por tipo e perÃ­odo
     */
    @Transactional(readOnly = true)
    public long countOccurrencesByTypeAndPeriod(OperationalOccurrence.OccurrenceType type, 
                                               LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.countByTypeAndPeriod(type, startDate, endDate);
    }
    
    /**
     * Gerar prÃ³ximo nÃºmero de advertÃªncia
     */
    @Transactional(readOnly = true)
    public Integer generateNextWarningNumber() {
        // Buscar o maior nÃºmero de advertÃªncia existente
        List<OperationalOccurrence> occurrences = occurrenceRepository.findAll();
        return occurrences.stream()
            .mapToInt(o -> o.getWarningNumber() != null ? o.getWarningNumber() : 0)
            .max()
            .orElse(0) + 1;
    }
    
    /**
     * Converter OperationalOccurrence para OccurrenceResponseDTO
     */
    public com.z7design.fleet_manager.dto.OccurrenceResponseDTO convertToResponseDTO(OperationalOccurrence occurrence) {
        try {
            if (occurrence == null) {
                log.error("âŒ Tentativa de converter OperationalOccurrence nula para DTO");
                throw new IllegalArgumentException("OperationalOccurrence nÃ£o pode ser nula");
            }
            
            // Acessar employee de forma segura
            String employeeId = null;
            String employeeName = null;
            try {
                if (occurrence.getEmployee() != null) {
                    employeeId = occurrence.getEmployee().getId().toString();
                    employeeName = occurrence.getEmployee().getName();
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao acessar employee da ocorrÃªncia {}: {}", occurrence.getId(), e.getMessage());
            }
            
            return com.z7design.fleet_manager.dto.OccurrenceResponseDTO.builder()
                .id(occurrence.getId())
                .type(occurrence.getType() != null ? occurrence.getType().name() : null)
                .title(occurrence.getTitle())
                .description(occurrence.getDescription())
                .employeeId(employeeId)
                .employeeName(employeeName)
                .location(occurrence.getLocation())
                .status(occurrence.getStatus() != null ? occurrence.getStatus().name() : null)
                .priority(occurrence.getPriority() != null ? occurrence.getPriority().name() : null)
                .date(occurrence.getDate())
                .responsible(occurrence.getResponsible())
                .warningNumber(occurrence.getWarningNumber())
                .createdAt(occurrence.getCreatedAt())
                .updatedAt(occurrence.getUpdatedAt())
                .build();
        } catch (Exception e) {
            log.error("âŒ Erro ao converter OperationalOccurrence para DTO - ID: {}", occurrence != null ? occurrence.getId() : "null", e);
            throw new RuntimeException("Erro ao converter OperationalOccurrence para DTO: " + e.getMessage(), e);
        }
    }

    /**
     * Gerar relatÃ³rio PDF de ocorrÃªncias com filtros
     */
    @Transactional(readOnly = true)
    public byte[] generatePDFReport(UUID employeeId, OperationalOccurrence.OccurrenceType type,
                                   OperationalOccurrence.OccurrenceStatus status,
                                   OperationalOccurrence.OccurrencePriority priority,
                                   LocalDate startDate, LocalDate endDate,
                                   String responsible, String location) throws IOException {
        log.info("Gerando relatÃ³rio PDF de ocorrÃªncias - EmployeeId: {}, Type: {}, Status: {}, Priority: {}, " +
                "StartDate: {}, EndDate: {}, Responsible: {}, Location: {}",
                employeeId, type, status, priority, startDate, endDate, responsible, location);

        // Buscar todas as ocorrÃªncias
        List<OperationalOccurrence> allOccurrences = occurrenceRepository.findAll();

        // Aplicar filtros
        List<OperationalOccurrence> filteredOccurrences = allOccurrences.stream()
                .filter(o -> employeeId == null || (o.getEmployee() != null && o.getEmployee().getId().equals(employeeId)))
                .filter(o -> type == null || o.getType().equals(type))
                .filter(o -> status == null || o.getStatus().equals(status))
                .filter(o -> priority == null || o.getPriority().equals(priority))
                .filter(o -> startDate == null || !o.getDate().toLocalDate().isBefore(startDate))
                .filter(o -> endDate == null || !o.getDate().toLocalDate().isAfter(endDate))
                .filter(o -> responsible == null || responsible.isEmpty() || 
                        (o.getResponsible() != null && o.getResponsible().toLowerCase().contains(responsible.toLowerCase())))
                .filter(o -> location == null || location.isEmpty() || 
                        (o.getLocation() != null && o.getLocation().toLowerCase().contains(location.toLowerCase())))
                .collect(Collectors.toList());

        log.info("Total de ocorrÃªncias encontradas para o relatÃ³rio: {}", filteredOccurrences.size());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try (PdfWriter writer = new PdfWriter(baos);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {
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
            Paragraph title = new Paragraph("RELATÃ“RIO DE OCORRÃŠNCIAS")
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
            if (employeeId != null || type != null || status != null || priority != null || 
                startDate != null || endDate != null || (responsible != null && !responsible.isEmpty()) || 
                (location != null && !location.isEmpty())) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);

                if (employeeId != null) {
                    employeeRepository.findById(employeeId).ifPresent(emp ->
                            document.add(new Paragraph("FuncionÃ¡rio: " + emp.getName()).setFontSize(10).setMarginBottom(2)));
                }
                if (type != null) {
                    document.add(new Paragraph("Tipo: " + getTypeLabel(type)).setFontSize(10).setMarginBottom(2));
                }
                if (status != null) {
                    document.add(new Paragraph("Status: " + getStatusLabel(status)).setFontSize(10).setMarginBottom(2));
                }
                if (priority != null) {
                    document.add(new Paragraph("Prioridade: " + getPriorityLabel(priority)).setFontSize(10).setMarginBottom(2));
                }
                if (startDate != null) {
                    document.add(new Paragraph("Data InÃ­cio: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (endDate != null) {
                    document.add(new Paragraph("Data Fim: " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(10).setMarginBottom(2));
                }
                if (responsible != null && !responsible.isEmpty()) {
                    document.add(new Paragraph("ResponsÃ¡vel: " + responsible).setFontSize(10).setMarginBottom(2));
                }
                if (location != null && !location.isEmpty()) {
                    document.add(new Paragraph("Local: " + location).setFontSize(10).setMarginBottom(2));
                }
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // EstatÃ­sticas
            long pendentes = filteredOccurrences.stream().filter(o -> o.getStatus() == OperationalOccurrence.OccurrenceStatus.PENDENTE).count();
            long emAndamento = filteredOccurrences.stream().filter(o -> o.getStatus() == OperationalOccurrence.OccurrenceStatus.EM_ANDAMENTO).count();
            long resolvidas = filteredOccurrences.stream().filter(o -> o.getStatus() == OperationalOccurrence.OccurrenceStatus.RESOLVIDO).count();
            long concluidas = filteredOccurrences.stream().filter(o -> o.getStatus() == OperationalOccurrence.OccurrenceStatus.CONCLUIDO).count();

            Paragraph stats = new Paragraph(String.format(
                    "Total de ocorrÃªncias: %d | Pendentes: %d | Em Andamento: %d | Resolvidas: %d | ConcluÃ­das: %d",
                    filteredOccurrences.size(), pendentes, emAndamento, resolvidas, concluidas))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);

            // Tabela de ocorrÃªncias
            if (filteredOccurrences.isEmpty()) {
                document.add(new Paragraph("Nenhuma ocorrÃªncia encontrada com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20));
            } else {
                Table table = new Table(UnitValue.createPercentArray(new float[]{2f, 1.5f, 2f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f}))
                        .useAllAvailableWidth()
                        .setMarginBottom(20);

                table.addHeaderCell(createHeaderCell("FuncionÃ¡rio"));
                table.addHeaderCell(createHeaderCell("Tipo"));
                table.addHeaderCell(createHeaderCell("TÃ­tulo"));
                table.addHeaderCell(createHeaderCell("Status"));
                table.addHeaderCell(createHeaderCell("Prioridade"));
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("ResponsÃ¡vel"));
                table.addHeaderCell(createHeaderCell("Local"));

                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

                for (OperationalOccurrence occurrence : filteredOccurrences) {
                    table.addCell(createCell(occurrence.getEmployee() != null ? occurrence.getEmployee().getName() : ""));
                    table.addCell(createCell(getTypeLabel(occurrence.getType())));
                    table.addCell(createCell(occurrence.getTitle() != null ? occurrence.getTitle() : ""));
                    table.addCell(createCell(getStatusLabel(occurrence.getStatus())));
                    table.addCell(createCell(getPriorityLabel(occurrence.getPriority())));
                    table.addCell(createCell(occurrence.getDate() != null ? occurrence.getDate().format(dateFormatter) : ""));
                    table.addCell(createCell(occurrence.getResponsible() != null ? occurrence.getResponsible() : ""));
                    table.addCell(createCell(occurrence.getLocation() != null ? occurrence.getLocation() : ""));
                }

                document.add(table);
            }

            // RodapÃ©
            Paragraph footer = new Paragraph("Documento gerado automaticamente pelo sistema Secured Guard")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setMarginTop(30);
            document.add(footer);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de ocorrÃªncias: {}", e.getMessage(), e);
            throw new IOException("Erro ao gerar relatÃ³rio PDF: " + e.getMessage(), e);
        }

        byte[] result = baos.toByteArray();
        log.info("PDF de ocorrÃªncias gerado com sucesso, tamanho: {} bytes", result.length);
        return result;
    }

    private String getTypeLabel(OperationalOccurrence.OccurrenceType type) {
        if (type == null) return "";
        switch (type) {
            case SEGURANCA: return "SeguranÃ§a";
            case DISCIPLINAR: return "Disciplinar";
            case EQUIPAMENTO: return "Equipamento";
            case INCIDENTE: return "Incidente";
            case MANUTENCAO: return "ManutenÃ§Ã£o";
            default: return type.name();
        }
    }

    private String getStatusLabel(OperationalOccurrence.OccurrenceStatus status) {
        if (status == null) return "";
        switch (status) {
            case PENDENTE: return "Pendente";
            case EM_ANDAMENTO: return "Em Andamento";
            case RESOLVIDO: return "Resolvido";
            case CONCLUIDO: return "ConcluÃ­do";
            default: return status.name();
        }
    }

    private String getPriorityLabel(OperationalOccurrence.OccurrencePriority priority) {
        if (priority == null) return "";
        switch (priority) {
            case BAIXA: return "Baixa";
            case MEDIA: return "MÃ©dia";
            case ALTA: return "Alta";
            default: return priority.name();
        }
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5);
    }

    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setPadding(5);
    }
}

