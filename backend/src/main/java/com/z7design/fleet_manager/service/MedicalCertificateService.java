package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MedicalCertificateRequestDTO;
import com.z7design.fleet_manager.dto.MedicalCertificateResponseDTO;
import com.z7design.fleet_manager.dto.MedicalCertificateStatsDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.MedicalCertificate;
import com.z7design.fleet_manager.model.enums.MedicalCertificateStatus;
import com.z7design.fleet_manager.repository.Cid10Repository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.MedicalCertificateRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalCertificateService {

    private final MedicalCertificateRepository certificateRepository;
    private final EmployeeRepository employeeRepository;
    private final Cid10Repository cid10Repository;

    private static final String UPLOAD_DIR = "uploads/atestados";

    @Transactional(readOnly = true)
    public List<MedicalCertificateResponseDTO> findAll() {
        return certificateRepository.findAllWithDetails().stream()
                .map(MedicalCertificateResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<MedicalCertificateResponseDTO> findById(UUID id) {
        return certificateRepository.findById(id).map(MedicalCertificateResponseDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<MedicalCertificateResponseDTO> findByEmployeeId(UUID employeeId) {
        return certificateRepository.findByEmployeeId(employeeId).stream()
                .map(MedicalCertificateResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public MedicalCertificateResponseDTO create(MedicalCertificateRequestDTO dto, String currentUser) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Funcionário não encontrado com ID: " + dto.getEmployeeId()));

        MedicalCertificate cert = new MedicalCertificate();
        cert.setEmployee(employee);

        // Multi-tenant: herda da empresa do funcionário ou do contexto
        UUID companyId = dto.getCompanyId();
        if (companyId == null && employee.getCompany() != null) {
            companyId = employee.getCompany().getId();
        }
        if (companyId == null) {
            companyId = TenantContext.get();
        }
        cert.setCompanyId(companyId);

        populateCertificateFields(cert, dto);
        cert.setCreatedBy(currentUser != null ? currentUser : "Sistema");

        MedicalCertificate saved = certificateRepository.save(cert);
        log.info("Atestado criado com sucesso: ID={}, Funcionário={}, Tipo={}", saved.getId(), employee.getName(), saved.getType());
        return MedicalCertificateResponseDTO.fromEntity(saved);
    }

    @Transactional
    public MedicalCertificateResponseDTO update(UUID id, MedicalCertificateRequestDTO dto, String currentUser) {
        MedicalCertificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atestado não encontrado com ID: " + id));

        if (dto.getEmployeeId() != null && !dto.getEmployeeId().equals(cert.getEmployee().getId())) {
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new IllegalArgumentException("Funcionário não encontrado com ID: " + dto.getEmployeeId()));
            cert.setEmployee(employee);
        }

        populateCertificateFields(cert, dto);
        MedicalCertificate updated = certificateRepository.save(cert);
        log.info("Atestado atualizado com sucesso: ID={}", updated.getId());
        return MedicalCertificateResponseDTO.fromEntity(updated);
    }

    @Transactional
    public void delete(UUID id) {
        if (!certificateRepository.existsById(id)) {
            throw new IllegalArgumentException("Atestado não encontrado com ID: " + id);
        }
        certificateRepository.deleteById(id);
        log.info("Atestado excluído com sucesso: ID={}", id);
    }

    public Map<String, String> uploadAttachment(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio não permitido.");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        String uniqueFilename = UUID.randomUUID() + extension;
        Path targetPath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), targetPath);

        String relativeUrl = "/uploads/atestados/" + uniqueFilename;
        Map<String, String> result = new HashMap<>();
        result.put("url", relativeUrl);
        result.put("fileName", originalFilename);
        result.put("fileType", file.getContentType());
        return result;
    }

    @Transactional(readOnly = true)
    public MedicalCertificateStatsDTO getStats() {
        List<MedicalCertificate> all = certificateRepository.findAll();
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);

        long total = all.size();
        long activeToday = all.stream()
                .filter(c -> c.getStatus() == MedicalCertificateStatus.APROVADO &&
                        !today.isBefore(c.getStartDate()) && !today.isAfter(c.getEndDate()))
                .count();

        long daysThisMonth = 0;
        BigDecimal hoursThisMonth = BigDecimal.ZERO;
        long pending = 0;

        for (MedicalCertificate c : all) {
            if (c.getStatus() == MedicalCertificateStatus.PENDENTE) {
                pending++;
            }
            if (c.getStatus() == MedicalCertificateStatus.APROVADO) {
                YearMonth certMonth = YearMonth.from(c.getStartDate());
                if (certMonth.equals(currentMonth)) {
                    daysThisMonth += (c.getDaysCount() != null ? c.getDaysCount() : 1);
                    if (c.getAbsenceHours() != null) {
                        hoursThisMonth = hoursThisMonth.add(c.getAbsenceHours());
                    }
                }
            }
        }

        return MedicalCertificateStatsDTO.builder()
                .totalCertificates(total)
                .activeToday(activeToday)
                .daysThisMonth(daysThisMonth)
                .hoursThisMonth(hoursThisMonth)
                .pendingApproval(pending)
                .build();
    }

    private void populateCertificateFields(MedicalCertificate cert, MedicalCertificateRequestDTO dto) {
        cert.setType(dto.getType());
        cert.setStartDate(dto.getStartDate());
        cert.setEndDate(dto.getEndDate());

        // Cálculo de dias
        int days = 1;
        if (dto.getStartDate() != null && dto.getEndDate() != null) {
            long diff = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;
            days = Math.max(1, (int) diff);
        }
        if (dto.getDaysCount() != null && dto.getDaysCount() > 0) {
            days = dto.getDaysCount();
        }
        cert.setDaysCount(days);

        // Cálculo de horas de ausência
        boolean isPartial = Boolean.TRUE.equals(dto.getIsPartialDay());
        cert.setIsPartialDay(isPartial);

        if (isPartial && dto.getAbsenceHours() != null && dto.getAbsenceHours().compareTo(BigDecimal.ZERO) > 0) {
            cert.setAbsenceHours(dto.getAbsenceHours());
        } else {
            // Padrão: 8 horas por dia útil de ausência
            BigDecimal calculatedHours = BigDecimal.valueOf(days * 8L).setScale(2, RoundingMode.HALF_UP);
            cert.setAbsenceHours(calculatedHours);
        }

        // CID e Descrição
        cert.setCidCode(dto.getCidCode());
        if (dto.getCidDescription() != null && !dto.getCidDescription().isBlank()) {
            cert.setCidDescription(dto.getCidDescription());
        } else if (dto.getCidCode() != null && !dto.getCidCode().isBlank()) {
            cid10Repository.findByCodeIgnoreCase(dto.getCidCode().trim())
                    .ifPresent(c -> cert.setCidDescription(c.getDescription()));
        }

        cert.setDoctorName(dto.getDoctorName());
        cert.setDoctorCrm(dto.getDoctorCrm());
        cert.setDoctorSpecialty(dto.getDoctorSpecialty());

        if (dto.getDocumentUrl() != null) {
            cert.setDocumentUrl(dto.getDocumentUrl());
            cert.setDocumentName(dto.getDocumentName());
            cert.setDocumentType(dto.getDocumentType());
        }

        cert.setNotes(dto.getNotes());
        cert.setStatus(dto.getStatus() != null ? dto.getStatus() : MedicalCertificateStatus.APROVADO);
    }
}
