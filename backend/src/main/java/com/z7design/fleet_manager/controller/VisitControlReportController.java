package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VisitControlReportDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.service.VisitControlReportService;
import com.z7design.fleet_manager.service.VisitControlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/visit-control-reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "RelatÃ³rios de Visitas", description = "Gerenciamento de relatÃ³rios de visitas salvos")
public class VisitControlReportController {

    private final VisitControlReportService reportService;
    private final VisitControlService visitControlService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Listar todos os relatÃ³rios", description = "Retorna lista de todos os relatÃ³rios gerados")
    public ResponseEntity<List<VisitControlReportDTO>> getAllReports() {
        List<VisitControlReportDTO> reports = reportService.getAllReports();
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/my-reports")
    @Operation(summary = "Listar meus relatÃ³rios", description = "Retorna lista de relatÃ³rios do usuÃ¡rio logado")
    public ResponseEntity<List<VisitControlReportDTO>> getMyReports() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = null;
        if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
            // Aqui vocÃª precisaria buscar o ID do usuÃ¡rio baseado no username
            // Por enquanto, retorna todos
        }
        List<VisitControlReportDTO> reports = reportService.getAllReports();
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar relatÃ³rio por ID", description = "Retorna detalhes de um relatÃ³rio especÃ­fico")
    public ResponseEntity<VisitControlReportDTO> getReportById(@PathVariable UUID id) {
        Optional<VisitControlReportDTO> report = reportService.getReportById(id);
        return report.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/{id}/download")
    @Operation(summary = "Download do relatÃ³rio", description = "Faz download do arquivo PDF do relatÃ³rio")
    public ResponseEntity<Resource> downloadReport(@PathVariable UUID id) {
        try {
            log.info("Tentando fazer download do relatÃ³rio: {}", id);
            Resource resource = reportService.getReportFile(id);
            VisitControlReportDTO report = reportService.getReportById(id)
                    .orElseThrow(() -> new RuntimeException("RelatÃ³rio nÃ£o encontrado"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", report.getFileName());
            // Headers para visualizaÃ§Ã£o (CORS jÃ¡ configurado no SecurityConfig)
            headers.set("X-Frame-Options", "SAMEORIGIN");
            headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
            headers.set("Pragma", "no-cache");
            headers.set("Expires", "0");

            log.info("Retornando PDF do relatÃ³rio: {}", report.getFileName());
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            log.error("Erro ao fazer download do relatÃ³rio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}/view")
    @Operation(summary = "Visualizar relatÃ³rio", description = "Visualiza o arquivo PDF do relatÃ³rio no navegador")
    public ResponseEntity<Resource> viewReport(@PathVariable UUID id) {
        try {
            log.info("Tentando visualizar relatÃ³rio: {}", id);
            Resource resource = reportService.getReportFile(id);
            VisitControlReportDTO report = reportService.getReportById(id)
                    .orElseThrow(() -> new RuntimeException("RelatÃ³rio nÃ£o encontrado"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", report.getFileName());
            // Headers para visualizaÃ§Ã£o (CORS jÃ¡ configurado no SecurityConfig)
            headers.set("X-Frame-Options", "SAMEORIGIN");
            headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
            headers.set("Pragma", "no-cache");
            headers.set("Expires", "0");

            log.info("Retornando PDF do relatÃ³rio para visualizaÃ§Ã£o: {}", report.getFileName());
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            log.error("Erro ao visualizar relatÃ³rio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/generate")
    @Operation(summary = "Gerar e salvar relatÃ³rio", description = "Gera um novo relatÃ³rio PDF e salva no sistema")
    public ResponseEntity<VisitControlReportDTO> generateAndSaveReport(
            @RequestParam(required = false) UUID workPostId,
            @RequestParam(required = false) VisitControlStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UUID createdBy = null;
            
            // Buscar o usuÃ¡rio atual pelo username
            if (auth != null && auth.isAuthenticated()) {
                String username = auth.getName();
                Optional<User> currentUser = userRepository.findByUsername(username);
                if (currentUser.isPresent()) {
                    createdBy = currentUser.get().getId();
                    log.info("RelatÃ³rio serÃ¡ criado pelo usuÃ¡rio: {} ({})", username, createdBy);
                } else {
                    log.warn("UsuÃ¡rio nÃ£o encontrado no banco de dados: {}", username);
                }
            } else {
                log.warn("Nenhum usuÃ¡rio autenticado encontrado");
            }

            VisitControlReportDTO report = visitControlService.generateAndSavePDFReport(
                    workPostId, status, startDate, endDate, createdBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            log.error("Erro ao gerar e salvar relatÃ³rio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir relatÃ³rio", description = "Exclui um relatÃ³rio e seu arquivo PDF")
    public ResponseEntity<Void> deleteReport(@PathVariable UUID id) {
        try {
            reportService.deleteReport(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao excluir relatÃ³rio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


