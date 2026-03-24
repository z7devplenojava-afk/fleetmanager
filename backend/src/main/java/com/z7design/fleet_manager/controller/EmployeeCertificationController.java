package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.z7design.fleet_manager.dto.CreateEmployeeCertificationRequest;
import com.z7design.fleet_manager.dto.UpdateEmployeeCertificationRequest;
import com.z7design.fleet_manager.dto.EmployeeCertificationResponse;
import com.z7design.fleet_manager.model.EmployeeCertification;
import com.z7design.fleet_manager.model.enums.CertificationStatus;
import com.z7design.fleet_manager.service.EmployeeCertificationService;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employee-certifications")
@RequiredArgsConstructor
@Tag(name = "CertificaÃ§Ãµes de FuncionÃ¡rios", description = "Endpoints para certificaÃ§Ãµes/treinamentos concluÃ­dos.")
@SecurityRequirement(name = "bearerAuth")
public class EmployeeCertificationController {

    private final EmployeeCertificationService certificationService;

    @Operation(summary = "Lista certificaÃ§Ãµes com filtros")
    @GetMapping
    // @PreAuthorize("hasAuthority('HR_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')") // Temporariamente removido para debug
    public ResponseEntity<List<EmployeeCertificationResponse>> find(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "trainingId", required = false) UUID trainingId,
            @RequestParam(value = "status", required = false) CertificationStatus status,
            @RequestParam(value = "expiringBefore", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiringBefore) {
        List<EmployeeCertification> results;
        if (employeeId != null && status != null) {
            results = certificationService.findByEmployeeIdAndStatus(employeeId, status);
        } else if (employeeId != null) {
            results = certificationService.findByEmployeeId(employeeId);
        } else if (trainingId != null) {
            results = certificationService.findByTrainingId(trainingId);
        } else if (expiringBefore != null) {
            results = certificationService.findExpiringSoon(expiringBefore);
        } else {
            results = certificationService.findAll();
        }

        System.out.println("ðŸ“‹ EmployeeCertificationController.find - Total de certificaÃ§Ãµes encontradas: " + results.size());
        results.forEach(cert -> {
            String employeeName = cert.getEmployee() != null ? cert.getEmployee().getName() : "null";
            String positionName = null;
            if (cert.getEmployee() != null && cert.getEmployee().getPosition() != null) {
                try {
                    positionName = cert.getEmployee().getPosition().getName();
                } catch (Exception e) {
                    System.err.println("âš ï¸ Erro ao acessar position.getName() para employee: " + employeeName);
                }
            }
            System.out.println("  - ID: " + cert.getId() + 
                ", Employee: " + employeeName +
                ", Position: " + (positionName != null ? positionName : "null") +
                ", Training: " + (cert.getTraining() != null ? cert.getTraining().getName() : "null"));
        });

        List<EmployeeCertificationResponse> payload = results.stream()
                .map(cert -> {
                    try {
                        return EmployeeCertificationResponse.fromEntity(cert);
                    } catch (Exception e) {
                        System.err.println("âŒ Erro ao converter certificaÃ§Ã£o " + (cert != null ? cert.getId() : "null") + " para DTO: " + e.getMessage());
                        e.printStackTrace();
                        return null;
                    }
                })
                .filter(response -> response != null)
                .toList();
        
        System.out.println("ðŸ“‹ EmployeeCertificationController.find - Total de responses criadas: " + payload.size());
        return ResponseEntity.ok(payload);
    }

    @Operation(summary = "Cria certificaÃ§Ã£o")
    @PostMapping
    @PreAuthorize("hasAuthority('HR_WRITE') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<EmployeeCertificationResponse> create(@Valid @RequestBody CreateEmployeeCertificationRequest request) {
        EmployeeCertification created = certificationService.create(request);
        EmployeeCertification loaded = certificationService.findById(created.getId());
        return ResponseEntity.ok(EmployeeCertificationResponse.fromEntity(loaded));
    }

    @Operation(summary = "Atualiza certificaÃ§Ã£o")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('HR_WRITE') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<EmployeeCertificationResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateEmployeeCertificationRequest request) {
        EmployeeCertification updated = certificationService.update(id, request);
        EmployeeCertification loaded = certificationService.findById(updated.getId());
        return ResponseEntity.ok(EmployeeCertificationResponse.fromEntity(loaded));
    }

    @Operation(summary = "Renova certificaÃ§Ã£o")
    @PutMapping("/{id}/renew")
    @PreAuthorize("hasAuthority('HR_WRITE') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<EmployeeCertificationResponse> renew(@PathVariable UUID id,
            @RequestParam("expirationDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newExpirationDate) {
        EmployeeCertification renewed = certificationService.renew(id, newExpirationDate);
        EmployeeCertification loaded = certificationService.findById(renewed.getId());
        return ResponseEntity.ok(EmployeeCertificationResponse.fromEntity(loaded));
    }

    @Operation(summary = "Cancela certificaÃ§Ã£o")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('HR_DELETE') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        certificationService.cancel(id);
        return ResponseEntity.noContent().build();
    }
}



