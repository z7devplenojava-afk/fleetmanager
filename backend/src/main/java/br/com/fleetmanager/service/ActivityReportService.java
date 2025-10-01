package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.*;
import br.com.fleetmanager.model.enums.ActivityReportStatus;
import br.com.fleetmanager.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActivityReportService {

    private static final Logger log = LoggerFactory.getLogger(ActivityReportService.class);
    private static final String UPLOAD_DIR = "uploads/activity-reports/"; // Diretório para uploads de relatórios

    private final ActivityReportRepository activityReportRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientRepository clientRepository;
    private final WorkPostRepository workPostRepository;
    // private final FileStorageService fileStorageService; // Adicionar se houver um serviço de armazenamento de arquivos genérico

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
        
        log.info("Buscando relatórios de atividade com filtros: employeeId={}, clientId={}, workPostId={}, startDate={}, endDate={}, status={}, supervisorId={}",
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
        log.info("Buscando relatório de atividade por ID: {}", id);
        return activityReportRepository.findById(id)
                .map(ActivityReportDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Activity Report not found with ID: " + id));
    }

    @Transactional
    public ActivityReportDTO createActivityReport(CreateActivityReportDTO createDTO) {
        log.info("Criando novo relatório de atividade para funcionário: {}", createDTO.getEmployeeId());

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
        log.info("Atualizando relatório de atividade ID: {}", id);

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
        log.info("Deletando relatório de atividade ID: {}", id);
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
        log.info("Foto adicionada ao relatório {}: {}", reportId, fileUrl);
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
        log.info("Documento adicionado ao relatório {}: {}", reportId, file.getOriginalFilename());
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
        log.info("Relatório de atividade {} aprovado pelo supervisor {}", id, supervisorId);
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
        log.info("Relatório de atividade {} rejeitado pelo supervisor {}", id, supervisorId);
        return ActivityReportDTO.fromEntity(rejectedReport);
    }

    // TODO: Implement generatePDFReport logic (e.g., using a reporting library)
    public byte[] generatePDFReport(UUID employeeId, UUID clientId, LocalDate startDate, LocalDate endDate) {
        log.warn("PDF report generation is not yet implemented.");
        // For now, return a dummy byte array
        String dummyContent = "Activity Report PDF - Not Implemented Yet!";
        return dummyContent.getBytes();
    }
}
