package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.ComplianceDossier;
import com.z7design.fleet_manager.model.OpacityTest;
import com.z7design.fleet_manager.service.AsoAlertScheduler;
import com.z7design.fleet_manager.service.ComplianceDossierService;
import com.z7design.fleet_manager.service.OpacityTestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 4: Gestão de RH, Departamento Pessoal & SST.
 * RF-04.2 (alertas ASO/CNH), RF-04.3 (fumaça preta) e RF-04.4 (dossiê 1-clique).
 */
@RestController
@RequestMapping("/api/sst-compliance")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SST & Conformidade", description = "Fumaça preta, ASO e dossiê de faturamento (PRD Módulo 4)")
public class SstComplianceController {

    private final OpacityTestService opacityTestService;
    private final ComplianceDossierService dossierService;
    private final AsoAlertScheduler asoAlertScheduler;
    private final com.z7design.fleet_manager.scheduler.SSTExpirationAlertScheduler sstExpirationAlertScheduler;

    // ===== RF-04.3: Fumaça preta / Opacidade =====

    @GetMapping("/opacity-tests")
    @Operation(summary = "Listar laudos de fumaça preta")
    public ResponseEntity<List<OpacityTest>> listOpacityTests(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        if (vehicleId != null) {
            return ResponseEntity.ok(opacityTestService.findByVehicle(vehicleId));
        }
        if (start != null && end != null) {
            return ResponseEntity.ok(opacityTestService.findByPeriod(start, end));
        }
        return ResponseEntity.ok(opacityTestService.findAll());
    }

    @PostMapping("/opacity-tests")
    @Operation(summary = "Registrar medição Ringelmann (0-5) — única por veículo/mês")
    public ResponseEntity<OpacityTest> createOpacityTest(@RequestBody OpacityTest test) {
        return ResponseEntity.status(HttpStatus.CREATED).body(opacityTestService.create(test));
    }

    @GetMapping("/opacity-tests/coverage/{yearMonth}")
    @Operation(summary = "Cobertura mensal de laudos (100% da frota em operação)")
    public ResponseEntity<Map<String, Object>> getCoverage(@PathVariable String yearMonth) {
        return ResponseEntity.ok(opacityTestService.getMonthlyCoverage(YearMonth.parse(yearMonth)));
    }

    @DeleteMapping("/opacity-tests/{id}")
    public ResponseEntity<Void> deleteOpacityTest(@PathVariable UUID id) {
        opacityTestService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== RF-04.4: Dossiê de conformidade =====

    @GetMapping("/dossiers")
    @Operation(summary = "Listar dossiês de conformidade")
    public ResponseEntity<List<ComplianceDossier>> listDossiers(@RequestParam(required = false) UUID clientId) {
        if (clientId != null) {
            return ResponseEntity.ok(dossierService.findByClient(clientId));
        }
        return ResponseEntity.ok(dossierService.findAll());
    }

    @PostMapping("/dossiers")
    @Operation(summary = "Criar/obter dossiê do mês (referência = mês anterior ao BM)")
    public ResponseEntity<ComplianceDossier> createOrGetDossier(
            @RequestParam String referenceMonth,
            @RequestParam UUID clientId) {
        return ResponseEntity.ok(dossierService.createOrGet(referenceMonth, clientId));
    }

    @PutMapping("/dossiers/{id}")
    @Operation(summary = "Atualizar checklist do kit (fumaça preta validada automaticamente)")
    public ResponseEntity<ComplianceDossier> updateDossier(@PathVariable UUID id, @RequestBody ComplianceDossier input) {
        input.setId(id);
        return ResponseEntity.ok(dossierService.updateChecklist(input));
    }

    @PostMapping("/dossiers/{id}/generate")
    @Operation(summary = "Gerar dossiê 1-clique (bloqueia se kit incompleto)")
    public ResponseEntity<ComplianceDossier> generateDossier(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "sistema") String generatedBy) {
        return ResponseEntity.ok(dossierService.generate(id, generatedBy));
    }

    @GetMapping("/dossiers/{id}/pdf")
    @Operation(summary = "Baixar Dossiê Mensal de Conformidade em PDF")
    public ResponseEntity<byte[]> dossierPdf(@PathVariable UUID id) {
        byte[] pdf = dossierService.generatePdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dossie-conformidade-" + id + ".pdf")
                .body(pdf);
    }

    // ===== RF-04.2: Alertas SST (execução manual do scheduler) =====

    @PostMapping("/alerts/run")
    @Operation(summary = "Executar verificação manual de vencimentos SST (ASO, CNH, treinamentos, CA de EPI e mandato CIPA)")
    public ResponseEntity<Map<String, Integer>> runSstAlerts() {
        int aso = asoAlertScheduler.notifyExpiringAso();
        int cnh = asoAlertScheduler.notifyExpiringCnh();
        int treinamentos = sstExpirationAlertScheduler.notifyExpiringTrainings();
        int casEpi = sstExpirationAlertScheduler.notifyExpiringCaEPIs();
        int cipa = sstExpirationAlertScheduler.notifyExpiringCipaMandates();
        int psico = sstExpirationAlertScheduler.notifyExpiringLaudoPsicologico();
        int asoCadastro = sstExpirationAlertScheduler.notifyExpiringAsoCadastro();
        return ResponseEntity.ok(Map.of(
                "asoAlerts", aso,
                "cnhAlerts", cnh,
                "trainingAlerts", treinamentos,
                "epiCaAlerts", casEpi,
                "cipaAlerts", cipa,
                "laudoPsicologicoAlerts", psico,
                "asoCadastroAlerts", asoCadastro));
    }
}
