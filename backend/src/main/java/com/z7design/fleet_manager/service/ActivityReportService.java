package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.ActivityReportStatus;
import com.z7design.fleet_manager.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActivityReportService {

    private static final Logger log = LoggerFactory.getLogger(ActivityReportService.class);
    private static final String UPLOAD_DIR = "uploads/activity-reports/"; // DiretÃ³rio para uploads de relatÃ³rios

    private final ActivityReportRepository activityReportRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientRepository clientRepository;
    private final WorkPostRepository workPostRepository;
    // private final FileStorageService fileStorageService; // Adicionar se houver um serviÃ§o de armazenamento de arquivos genÃ©rico

    public ActivityReportService(
            ActivityReportRepository activityReportRepository,
            EmployeeRepository employeeRepository,
            ClientRepository clientRepository,
            WorkPostRepository workPostRepository
            // FileStorageService fileStorageService
    ) {
        this.activityReportRepository = activityReportRepository;
        this.employeeRepository = employeeRepository;
        this.clientRepository = clientRepository;
        this.workPostRepository = workPostRepository;
        // this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public List<ActivityReportDTO> getActivityReports(
            UUID employeeId, UUID clientId, UUID workPostId,
            LocalDate startDate, LocalDate endDate, ActivityReportStatus status,
            UUID supervisorId) {
        
        log.info("Buscando relatÃ³rios de atividade com filtros: employeeId={}, clientId={}, workPostId={}, startDate={}, endDate={}, status={}, supervisorId={}",
                employeeId, clientId, workPostId, startDate, endDate, status, supervisorId);

        Specification<ActivityReport> spec = Specification.where(null);

        if (employeeId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("employee").get("id"), employeeId));
        }
        if (clientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("client").get("id"), clientId));
        }
        if (workPostId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("workPost").get("id"), workPostId));
        }
        if (startDate != null && endDate != null) {
            spec = spec.and((root, query, cb) -> cb.between(root.get("date"), startDate, endDate));
        } else if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("date"), startDate));
        } else if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("date"), endDate));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (supervisorId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("supervisor").get("id"), supervisorId));
        }

        return activityReportRepository.findAll(spec).stream()
                .map(ActivityReportDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActivityReportDTO getActivityReportById(UUID id) {
        log.info("Buscando relatÃ³rio de atividade por ID: {}", id);
        return activityReportRepository.findById(id)
                .map(ActivityReportDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + id));
    }

    @Transactional
    public ActivityReportDTO createActivityReport(CreateActivityReportDTO createDTO) {
        log.info("Criando novo relatÃ³rio de atividade para funcionÃ¡rio: {}", createDTO.getEmployeeId());

        Employee employee = employeeRepository.findById(createDTO.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with ID: " + createDTO.getEmployeeId()));
        Client client = clientRepository.findById(createDTO.getClientId())
                .orElseThrow(() -> new EntityNotFoundException("Client not found with ID: " + createDTO.getClientId()));
        WorkPost workPost = workPostRepository.findById(createDTO.getWorkPostId())
                .orElseThrow(() -> new EntityNotFoundException("Work Post not found with ID: " + createDTO.getWorkPostId()));

        ActivityReport activityReport = new ActivityReport();
        activityReport.setEmployee(employee);
        activityReport.setEmployeeName(employee.getFullName()); // Using full name from Employee entity
        activityReport.setClient(client);
        activityReport.setClientName(client.getName()); // Using name from Client entity
        activityReport.setWorkPost(workPost);
        activityReport.setWorkPostName(workPost.getName()); // Using name from WorkPost entity
        activityReport.setDate(createDTO.getDate());
        activityReport.setStartTime(createDTO.getStartTime());
        activityReport.setEndTime(createDTO.getEndTime());
        activityReport.setDescription(createDTO.getDescription());
        // Garantir que as listas sejam inicializadas
        if (activityReport.getPhotos() == null) {
            activityReport.setPhotos(new java.util.ArrayList<>());
        }
        if (activityReport.getDocuments() == null) {
            activityReport.setDocuments(new java.util.ArrayList<>());
        }
        // Handle embedded objects and collections
        if (createDTO.getBallisticPlate() != null) {
            BallisticPlate bp = new BallisticPlate();
            bp.setBallisticPlateNumber(createDTO.getBallisticPlate().getBallisticPlateNumber());
            bp.setBallisticPlateValidUntil(createDTO.getBallisticPlate().getBallisticPlateValidUntil());
            activityReport.setBallisticPlate(bp);
        }
        if (createDTO.getWeaponRegistry() != null) {
            WeaponRegistry wr = new WeaponRegistry();
            wr.setWeaponRegistryNumber(createDTO.getWeaponRegistry().getWeaponRegistryNumber());
            wr.setWeaponRegistryValidUntil(createDTO.getWeaponRegistry().getWeaponRegistryValidUntil());
            activityReport.setWeaponRegistry(wr);
        }
        activityReport.setAbsenceStatus(createDTO.getAbsenceStatus());
        activityReport.setDivergences(createDTO.getDivergences());
        if (createDTO.getMedicalConsultation() != null) {
            MedicalConsultation mc = new MedicalConsultation();
            mc.setConsultationDate(createDTO.getMedicalConsultation().getConsultationDate());
            mc.setReason(createDTO.getMedicalConsultation().getReason());
            mc.setDoctor(createDTO.getMedicalConsultation().getDoctor());
            mc.setResult(createDTO.getMedicalConsultation().getResult());
            activityReport.setMedicalConsultation(mc);
        }

        // Handle photos
        if (createDTO.getPhotos() != null) {
            List<ActivityReportPhoto> photos = createDTO.getPhotos().stream().map(photoDto -> {
                ActivityReportPhoto photo = new ActivityReportPhoto();
                photo.setUrl(photoDto.getUrl());
                photo.setDescription(photoDto.getDescription());
                photo.setTimestamp(photoDto.getTimestamp());
                photo.setActivityReport(activityReport);
                return photo;
            }).collect(Collectors.toList());
            activityReport.setPhotos(photos);
        }

        // Handle documents
        if (createDTO.getDocuments() != null) {
            List<ActivityReportDocument> documents = createDTO.getDocuments().stream().map(docDto -> {
                ActivityReportDocument document = new ActivityReportDocument();
                document.setName(docDto.getName());
                document.setUrl(docDto.getUrl());
                document.setType(docDto.getType());
                document.setSize(docDto.getSize());
                document.setUploadedAt(docDto.getUploadedAt());
                document.setActivityReport(activityReport);
                return document;
            }).collect(Collectors.toList());
            activityReport.setDocuments(documents);
        }

        activityReport.setStatus(ActivityReportStatus.DRAFT); // Initial status
        // createdAt and updatedAt are handled by @PrePersist

        ActivityReport savedReport = activityReportRepository.save(activityReport);
        return ActivityReportDTO.fromEntity(savedReport);
    }

    @Transactional
    public ActivityReportDTO updateActivityReport(UUID id, UpdateActivityReportDTO updateDTO) {
        log.info("Atualizando relatÃ³rio de atividade ID: {}", id);

        ActivityReport activityReport = activityReportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + id));

        if (updateDTO.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(updateDTO.getEmployeeId())
                    .orElseThrow(() -> new EntityNotFoundException("Employee not found with ID: " + updateDTO.getEmployeeId()));
            activityReport.setEmployee(employee);
            activityReport.setEmployeeName(employee.getFullName());
        }
        if (updateDTO.getClientId() != null) {
            Client client = clientRepository.findById(updateDTO.getClientId())
                    .orElseThrow(() -> new EntityNotFoundException("Client not found with ID: " + updateDTO.getClientId()));
            activityReport.setClient(client);
            activityReport.setClientName(client.getName());
        }
        if (updateDTO.getWorkPostId() != null) {
            WorkPost workPost = workPostRepository.findById(updateDTO.getWorkPostId())
                    .orElseThrow(() -> new EntityNotFoundException("Work Post not found with ID: " + updateDTO.getWorkPostId()));
            activityReport.setWorkPost(workPost);
            activityReport.setWorkPostName(workPost.getName());
        }
        if (updateDTO.getDate() != null) activityReport.setDate(updateDTO.getDate());
        if (updateDTO.getStartTime() != null) activityReport.setStartTime(updateDTO.getStartTime());
        if (updateDTO.getEndTime() != null) activityReport.setEndTime(updateDTO.getEndTime());
        if (updateDTO.getDescription() != null) activityReport.setDescription(updateDTO.getDescription());
        if (updateDTO.getBallisticPlate() != null) {
            BallisticPlate bp = new BallisticPlate();
            bp.setBallisticPlateNumber(updateDTO.getBallisticPlate().getBallisticPlateNumber());
            bp.setBallisticPlateValidUntil(updateDTO.getBallisticPlate().getBallisticPlateValidUntil());
            activityReport.setBallisticPlate(bp);
        }
        if (updateDTO.getWeaponRegistry() != null) {
            WeaponRegistry wr = new WeaponRegistry();
            wr.setWeaponRegistryNumber(updateDTO.getWeaponRegistry().getWeaponRegistryNumber());
            wr.setWeaponRegistryValidUntil(updateDTO.getWeaponRegistry().getWeaponRegistryValidUntil());
            activityReport.setWeaponRegistry(wr);
        }
        if (updateDTO.getAbsenceStatus() != null) activityReport.setAbsenceStatus(updateDTO.getAbsenceStatus());
        if (updateDTO.getDivergences() != null) activityReport.setDivergences(updateDTO.getDivergences());
        if (updateDTO.getMedicalConsultation() != null) {
            MedicalConsultation mc = new MedicalConsultation();
            mc.setConsultationDate(updateDTO.getMedicalConsultation().getConsultationDate());
            mc.setReason(updateDTO.getMedicalConsultation().getReason());
            mc.setDoctor(updateDTO.getMedicalConsultation().getDoctor());
            mc.setResult(updateDTO.getMedicalConsultation().getResult());
            activityReport.setMedicalConsultation(mc);
        }

        // Handle photos and documents (this might require more complex logic for updates, e.g., diffing lists)
        // For simplicity, here we're replacing the whole collection if provided
        if (updateDTO.getPhotos() != null) {
            activityReport.getPhotos().clear(); // Clear existing photos
            List<ActivityReportPhoto> photos = updateDTO.getPhotos().stream().map(photoDto -> {
                ActivityReportPhoto photo = new ActivityReportPhoto();
                photo.setUrl(photoDto.getUrl());
                photo.setDescription(photoDto.getDescription());
                photo.setTimestamp(photoDto.getTimestamp());
                photo.setActivityReport(activityReport);
                return photo;
            }).collect(Collectors.toList());
            activityReport.setPhotos(photos);
        }
        if (updateDTO.getDocuments() != null) {
            activityReport.getDocuments().clear(); // Clear existing documents
            List<ActivityReportDocument> documents = updateDTO.getDocuments().stream().map(docDto -> {
                ActivityReportDocument document = new ActivityReportDocument();
                document.setName(docDto.getName());
                document.setUrl(docDto.getUrl());
                document.setType(docDto.getType());
                document.setSize(docDto.getSize());
                document.setUploadedAt(docDto.getUploadedAt());
                document.setActivityReport(activityReport);
                return document;
            }).collect(Collectors.toList());
            activityReport.setDocuments(documents);
        }

        if (updateDTO.getSupervisorId() != null) {
            Employee supervisor = employeeRepository.findById(updateDTO.getSupervisorId())
                    .orElseThrow(() -> new EntityNotFoundException("Supervisor not found with ID: " + updateDTO.getSupervisorId()));
            activityReport.setSupervisor(supervisor);
            activityReport.setSupervisorName(supervisor.getFullName());
        }
        if (updateDTO.getStatus() != null) activityReport.setStatus(updateDTO.getStatus());
        // updatedAt is handled by @PreUpdate

        ActivityReport updatedReport = activityReportRepository.save(activityReport);
        return ActivityReportDTO.fromEntity(updatedReport);
    }

    @Transactional
    public void deleteActivityReport(UUID id) {
        log.info("Deletando relatÃ³rio de atividade ID: {}", id);
        if (!activityReportRepository.existsById(id)) {
            throw new EntityNotFoundException("Activity Report not found with ID: " + id);
        }
        activityReportRepository.deleteById(id);
    }

    @Transactional
    public ActivityReportDTO uploadPhoto(UUID reportId, MultipartFile file, String description) throws IOException {
        ActivityReport report = activityReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + reportId));

        // TODO: Implement actual file storage logic (e.g., using FileStorageService or similar)
        // For now, let's mock a file URL
        String fileUrl = UPLOAD_DIR + "mock_photo_" + UUID.randomUUID() + ".jpg";

        ActivityReportPhoto photo = new ActivityReportPhoto();
        photo.setUrl(fileUrl);
        photo.setDescription(description);
        photo.setTimestamp(LocalDateTime.now());
        photo.setActivityReport(report);

        report.getPhotos().add(photo);
        ActivityReport updatedReport = activityReportRepository.save(report);
        log.info("Foto adicionada ao relatÃ³rio {}: {}", reportId, fileUrl);
        return ActivityReportDTO.fromEntity(updatedReport);
    }

    @Transactional
    public ActivityReportDTO uploadDocument(UUID reportId, MultipartFile file) throws IOException {
        ActivityReport report = activityReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + reportId));

        // TODO: Implement actual file storage logic
        String fileUrl = UPLOAD_DIR + "mock_document_" + UUID.randomUUID() + ".pdf";

        ActivityReportDocument document = new ActivityReportDocument();
        document.setName(Objects.requireNonNull(file.getOriginalFilename()));
        document.setUrl(fileUrl);
        document.setType(file.getContentType());
        document.setSize(file.getSize());
        document.setUploadedAt(LocalDateTime.now());
        document.setActivityReport(report);

        report.getDocuments().add(document);
        ActivityReport updatedReport = activityReportRepository.save(report);
        log.info("Documento adicionado ao relatÃ³rio {}: {}", reportId, file.getOriginalFilename());
        return ActivityReportDTO.fromEntity(updatedReport);
    }

    @Transactional
    public ActivityReportDTO approveReport(UUID id, UUID supervisorId) {
        ActivityReport report = activityReportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + id));
        Employee supervisor = employeeRepository.findById(supervisorId)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor not found with ID: " + supervisorId));

        report.setStatus(ActivityReportStatus.APPROVED);
        report.setSupervisor(supervisor);
        report.setSupervisorName(supervisor.getFullName());
        ActivityReport approvedReport = activityReportRepository.save(report);
        log.info("RelatÃ³rio de atividade {} aprovado pelo supervisor {}", id, supervisorId);
        return ActivityReportDTO.fromEntity(approvedReport);
    }

    @Transactional
    public ActivityReportDTO rejectReport(UUID id, UUID supervisorId, String reason) {
        ActivityReport report = activityReportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + id));
        Employee supervisor = employeeRepository.findById(supervisorId)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor not found with ID: " + supervisorId));

        report.setStatus(ActivityReportStatus.REJECTED);
        report.setSupervisor(supervisor);
        report.setSupervisorName(supervisor.getFullName());
        report.setDivergences(reason); // Store rejection reason in divergences for simplicity
        ActivityReport rejectedReport = activityReportRepository.save(report);
        log.info("RelatÃ³rio de atividade {} rejeitado pelo supervisor {}", id, supervisorId);
        return ActivityReportDTO.fromEntity(rejectedReport);
    }

    public byte[] generatePDFReport(UUID employeeId, UUID clientId, LocalDate startDate, LocalDate endDate) {
        log.info("Gerando relatÃ³rio PDF de atividades - EmployeeId: {}, ClientId: {}, StartDate: {}, EndDate: {}",
                employeeId, clientId, startDate, endDate);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = null;
        PdfDocument pdfDoc = null;
        Document document = null;
        boolean resourcesClosed = false;

        try {
            // Buscar relatÃ³rios com os filtros
            ActivityReportStatus status = null; // Buscar todos os status
            UUID workPostId = null;
            UUID supervisorId = null;
            
            List<ActivityReportDTO> reports;
            try {
                reports = getActivityReports(employeeId, clientId, workPostId, startDate, endDate, status, supervisorId);
                log.info("Total de relatÃ³rios encontrados para o PDF: {}", reports.size());
            } catch (Exception e) {
                log.error("Erro ao buscar relatÃ³rios para PDF: {}", e.getMessage(), e);
                throw new RuntimeException("Erro ao buscar relatÃ³rios: " + e.getMessage(), e);
            }
            
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
            Paragraph title = new Paragraph("RELATÃ“RIO DE ATIVIDADES")
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
            if (employeeId != null || clientId != null || startDate != null || endDate != null) {
                Paragraph filtersInfo = new Paragraph("Filtros aplicados:")
                        .setFontSize(10)
                        .setBold()
                        .setMarginBottom(5);
                document.add(filtersInfo);

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
            long totalReports = reports.size();
            long presentCount = reports.stream()
                    .filter(r -> r.getAbsenceStatus() != null && r.getAbsenceStatus().name().equals("PRESENT"))
                    .count();
            long absentCount = reports.stream()
                    .filter(r -> r.getAbsenceStatus() != null && r.getAbsenceStatus().name().equals("ABSENT"))
                    .count();

            Paragraph stats = new Paragraph(String.format(
                    "Total de relatÃ³rios: %d | Presentes: %d | Ausentes: %d",
                    totalReports, presentCount, absentCount))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(15);
            document.add(stats);

            // Tabela de relatÃ³rios
            if (reports.isEmpty()) {
                Paragraph noData = new Paragraph("Nenhum relatÃ³rio encontrado com os filtros aplicados.")
                        .setTextAlignment(TextAlignment.CENTER)
                        .setFontSize(12)
                        .setMarginTop(20);
                document.add(noData);
            } else {
                Table table = new Table(7).setWidth(UnitValue.createPercentValue(100));

                // CabeÃ§alhos
                table.addHeaderCell(createHeaderCell("Data"));
                table.addHeaderCell(createHeaderCell("FuncionÃ¡rio"));
                table.addHeaderCell(createHeaderCell("Cliente"));
                table.addHeaderCell(createHeaderCell("Posto"));
                table.addHeaderCell(createHeaderCell("HorÃ¡rio"));
                table.addHeaderCell(createHeaderCell("PresenÃ§a"));
                table.addHeaderCell(createHeaderCell("Status"));

                // Dados
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                for (ActivityReportDTO report : reports) {
                    table.addCell(createCell(report.getDate() != null ? report.getDate().format(dateFormatter) : ""));
                    table.addCell(createCell(report.getEmployeeName() != null ? report.getEmployeeName() : ""));
                    table.addCell(createCell(report.getClientName() != null ? report.getClientName() : ""));
                    table.addCell(createCell(report.getWorkPostName() != null ? report.getWorkPostName() : ""));
                    
                    String timeRange = "";
                    if (report.getStartTime() != null && report.getEndTime() != null) {
                        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                        timeRange = report.getStartTime().format(timeFormatter) + " - " + report.getEndTime().format(timeFormatter);
                    } else if (report.getStartTime() != null) {
                        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                        timeRange = report.getStartTime().format(timeFormatter);
                    } else if (report.getEndTime() != null) {
                        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                        timeRange = " - " + report.getEndTime().format(timeFormatter);
                    }
                    table.addCell(createCell(timeRange));
                    
                    String absenceStatus = report.getAbsenceStatus() != null ? 
                            getAbsenceStatusLabel(report.getAbsenceStatus().name()) : "";
                    table.addCell(createCell(absenceStatus));
                    
                    String statusLabel = report.getStatus() != null ? 
                            getStatusLabel(report.getStatus().name()) : "";
                    table.addCell(createCell(statusLabel));
                }

                document.add(table);
            }

            // Fechar documento para finalizar o PDF
            document.close();
            resourcesClosed = true;
            
            // PdfDoc e writer sÃ£o fechados automaticamente quando document Ã© fechado

            byte[] pdfBytes = baos.toByteArray();
            log.info("PDF gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de relatÃ³rios de atividade: {}", e.getMessage(), e);
            e.printStackTrace();
            
            // Fechar recursos apenas se ainda nÃ£o foram fechados
            if (!resourcesClosed) {
                try {
                    if (document != null) {
                        try {
                            document.close();
                        } catch (Exception ignored) {
                            // JÃ¡ fechado ou erro ao fechar, ignorar
                        }
                    }
                    if (pdfDoc != null) {
                        try {
                            pdfDoc.close();
                        } catch (Exception ignored) {
                            // JÃ¡ fechado ou erro ao fechar, ignorar
                        }
                    }
                    if (writer != null) {
                        try {
                            writer.close();
                        } catch (Exception ignored) {
                            // JÃ¡ fechado ou erro ao fechar, ignorar
                        }
                    }
                } catch (Exception closeException) {
                    log.error("Erro ao fechar recursos do PDF apÃ³s exceÃ§Ã£o: {}", closeException.getMessage());
                }
            }
            
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }

    private com.itextpdf.layout.element.Cell createHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold().setFontSize(10))
                .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(51, 51, 51))
                .setFontColor(com.itextpdf.kernel.colors.ColorConstants.WHITE)
                .setPadding(8);
    }

    private com.itextpdf.layout.element.Cell createCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(9))
                .setPadding(6);
    }

    private String getStatusLabel(String status) {
        if (status == null) return "";
        switch (status) {
            case "DRAFT": return "Rascunho";
            case "SUBMITTED": return "Enviado";
            case "APPROVED": return "Aprovado";
            case "REJECTED": return "Rejeitado";
            default: return status;
        }
    }

    private String getAbsenceStatusLabel(String status) {
        if (status == null) return "";
        switch (status) {
            case "PRESENT": return "Presente";
            case "ABSENT": return "Ausente";
            case "LATE": return "Atraso";
            case "MEDICAL_LEAVE": return "Atestado";
            case "JUSTIFIED": return "Justificado";
            default: return status;
        }
    }
}

