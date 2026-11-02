package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.MedicalCertificateRequestDTO;
import com.z7design.fleet_manager.dto.MedicalCertificateResponseDTO;
import com.z7design.fleet_manager.dto.MedicalCertificateStatsDTO;
import com.z7design.fleet_manager.service.MedicalCertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/medical-certificates")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Atestados Médicos", description = "Gestão de atestados, licenças e afastamentos de funcionários")
public class MedicalCertificateController {

    private final MedicalCertificateService certificateService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Lista todos os atestados médicos cadastrados")
    public ResponseEntity<List<MedicalCertificateResponseDTO>> getAll() {
        return ResponseEntity.ok(certificateService.findAll());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Estatísticas de atestados e afastamentos")
    public ResponseEntity<MedicalCertificateStatsDTO> getStats() {
        return ResponseEntity.ok(certificateService.getStats());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Busca atestado por ID")
    public ResponseEntity<MedicalCertificateResponseDTO> getById(@PathVariable UUID id) {
        return certificateService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Lista atestados de um funcionário")
    public ResponseEntity<List<MedicalCertificateResponseDTO>> getByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(certificateService.findByEmployeeId(employeeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('HR_WRITE', 'EMPLOYEES_WRITE', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Cadastra novo atestado médico")
    public ResponseEntity<MedicalCertificateResponseDTO> create(
            @Valid @RequestBody MedicalCertificateRequestDTO dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "Sistema";
        MedicalCertificateResponseDTO created = certificateService.create(dto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_WRITE', 'EMPLOYEES_WRITE', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Atualiza atestado médico existente")
    public ResponseEntity<MedicalCertificateResponseDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody MedicalCertificateRequestDTO dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "Sistema";
        return ResponseEntity.ok(certificateService.update(id, dto, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_DELETE', 'EMPLOYEES_DELETE', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Exclui um atestado médico")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        certificateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('HR_WRITE', 'EMPLOYEES_WRITE', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Upload de comprovante do atestado (PDF ou imagem)")
    public ResponseEntity<Map<String, String>> uploadAttachment(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> uploadResult = certificateService.uploadAttachment(file);
            return ResponseEntity.ok(uploadResult);
        } catch (IOException e) {
            log.error("Erro ao realizar upload do comprovante de atestado: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Falha ao salvar arquivo no servidor: " + e.getMessage()));
        }
    }
}
