package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.VisitControlReportDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.VisitControlReport;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.VisitControlReportRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitControlReportService {

    private final VisitControlReportRepository reportRepository;
    private final UserRepository userRepository;
    private final WorkPostRepository workPostRepository;
    private final ObjectMapper objectMapper;
    private static final String REPORTS_DIR = "reports/visit-controls/";

    @Transactional
    public VisitControlReportDTO saveReport(byte[] pdfBytes, UUID workPostId, VisitControlStatus status, 
                                            LocalDate startDate, LocalDate endDate, int totalVisits, UUID createdBy) {
        try {
            // Criar diretÃ³rio se nÃ£o existir
            Path reportsPath = Paths.get(REPORTS_DIR);
            if (!Files.exists(reportsPath)) {
                Files.createDirectories(reportsPath);
            }

            // Gerar nome do arquivo
            String fileName = "relatorio-visitas-" + UUID.randomUUID().toString() + ".pdf";
            Path filePath = reportsPath.resolve(fileName);

            // Salvar arquivo
            Files.write(filePath, pdfBytes);

            // Preparar filtros JSON
            Map<String, Object> filtersMap = new HashMap<>();
            if (workPostId != null) {
                filtersMap.put("workPostId", workPostId.toString());
                WorkPost workPost = workPostRepository.findById(workPostId).orElse(null);
                if (workPost != null) {
                    filtersMap.put("workPostName", workPost.getName());
                }
            }
            if (status != null) {
                filtersMap.put("status", status.name());
            }
            if (startDate != null) {
                filtersMap.put("startDate", startDate.toString());
            }
            if (endDate != null) {
                filtersMap.put("endDate", endDate.toString());
            }
            String filtersJson = objectMapper.writeValueAsString(filtersMap);

            // Criar entidade
            VisitControlReport report = new VisitControlReport();
            report.setFileName(fileName);
            report.setFilePath(filePath.toString());
            report.setFileSize((long) pdfBytes.length);
            report.setFilters(filtersJson);
            report.setWorkPostId(workPostId);
            if (workPostId != null) {
                WorkPost workPost = workPostRepository.findById(workPostId).orElse(null);
                if (workPost != null) {
                    report.setWorkPostName(workPost.getName());
                }
            }
            report.setStatus(status != null ? status.name() : null);
            report.setStartDate(startDate);
            report.setEndDate(endDate);
            report.setTotalVisits(totalVisits);
            if (createdBy != null) {
                User user = userRepository.findById(createdBy).orElse(null);
                report.setCreatedBy(user);
            }

            VisitControlReport saved = reportRepository.save(report);
            log.info("RelatÃ³rio salvo com ID: {}", saved.getId());

            return convertToDTO(saved);
        } catch (IOException e) {
            log.error("Erro ao salvar relatÃ³rio: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar relatÃ³rio", e);
        }
    }

    @Transactional(readOnly = true)
    public List<VisitControlReportDTO> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitControlReportDTO> getReportsByUser(UUID userId) {
        return reportRepository.findByCreatedByIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<VisitControlReportDTO> getReportById(UUID id) {
        return reportRepository.findById(id)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Resource getReportFile(UUID id) throws IOException {
        VisitControlReport report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RelatÃ³rio nÃ£o encontrado"));

        Path filePath = Paths.get(report.getFilePath());
        if (!Files.exists(filePath)) {
            throw new IOException("Arquivo do relatÃ³rio nÃ£o encontrado: " + report.getFilePath());
        }

        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new IOException("Arquivo nÃ£o pode ser lido: " + report.getFilePath());
        }

        return resource;
    }

    @Transactional
    public void deleteReport(UUID id) {
        VisitControlReport report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RelatÃ³rio nÃ£o encontrado"));

        try {
            // Deletar arquivo
            Path filePath = Paths.get(report.getFilePath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            log.warn("Erro ao deletar arquivo do relatÃ³rio: {}", e.getMessage());
        }

        // Deletar registro
        reportRepository.deleteById(id);
        log.info("RelatÃ³rio deletado: {}", id);
    }

    private VisitControlReportDTO convertToDTO(VisitControlReport entity) {
        VisitControlReportDTO dto = new VisitControlReportDTO();
        dto.setId(entity.getId());
        dto.setFileName(entity.getFileName());
        dto.setFilePath(entity.getFilePath());
        dto.setFileSize(entity.getFileSize());
        dto.setFilters(entity.getFilters());
        dto.setWorkPostId(entity.getWorkPostId());
        dto.setWorkPostName(entity.getWorkPostName());
        dto.setStatus(entity.getStatus());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setTotalVisits(entity.getTotalVisits());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getCreatedBy() != null) {
            dto.setCreatedBy(entity.getCreatedBy().getId());
            // Usar getName() se disponÃ­vel, senÃ£o usar username
            String userName = entity.getCreatedBy().getName();
            if (userName == null || userName.trim().isEmpty()) {
                userName = entity.getCreatedBy().getUsername();
            }
            dto.setCreatedByName(userName);
        } else {
            dto.setCreatedByName("Sistema");
        }

        return dto;
    }
}


