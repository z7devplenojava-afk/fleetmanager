package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.fleetmanager.service.EmployeeCertificationService;

import br.com.fleetmanager.model.EmployeeCertification;
import br.com.fleetmanager.model.enums.CertificationStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employee-certifications")
@RequiredArgsConstructor
@Tag(name = "Certificações de Funcionários", description = "Endpoints para certificações/treinamentos concluídos.")
@SecurityRequirement(name = "bearerAuth")
public class EmployeeCertificationController {

    private final EmployeeCertificationService certificationService;

    @Operation(summary = "Lista certificações com filtros")
    @GetMapping
    public ResponseEntity<List<EmployeeCertification>> find(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "trainingId", required = false) UUID trainingId,
            @RequestParam(value = "status", required = false) CertificationStatus status,
            @RequestParam(value = "expiringBefore", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiringBefore) {
        if (employeeId != null && status != null) {
            return ResponseEntity.ok(certificationService.findByEmployeeIdAndStatus(employeeId, status));
        }
        if (employeeId != null) {
            return ResponseEntity.ok(certificationService.findByEmployeeId(employeeId));
        }
        if (trainingId != null) {
            return ResponseEntity.ok(certificationService.findByTrainingId(trainingId));
        }
        if (expiringBefore != null) {
            return ResponseEntity.ok(certificationService.findExpiringSoon(expiringBefore));
        }
        // default: retornar todos
        return ResponseEntity.ok(certificationService.findExpiringBetween(LocalDate.MIN, LocalDate.MAX));
    }

    @Operation(summary = "Cria certificação")
    @PostMapping
    public ResponseEntity<EmployeeCertification> create(@RequestBody EmployeeCertification certification) {
        return ResponseEntity.ok(certificationService.create(certification));
    }

    @Operation(summary = "Atualiza certificação")
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeCertification> update(@PathVariable UUID id, @RequestBody EmployeeCertification certification) {
        return ResponseEntity.ok(certificationService.update(id, certification));
    }

    @Operation(summary = "Renova certificação")
    @PutMapping("/{id}/renew")
    public ResponseEntity<EmployeeCertification> renew(@PathVariable UUID id,
            @RequestParam("expirationDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newExpirationDate) {
        return ResponseEntity.ok(certificationService.renew(id, newExpirationDate));
    }

    @Operation(summary = "Cancela certificação")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        certificationService.cancel(id);
        return ResponseEntity.noContent().build();
    }
}


