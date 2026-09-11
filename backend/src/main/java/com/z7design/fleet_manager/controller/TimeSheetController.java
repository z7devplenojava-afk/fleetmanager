package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.TimeSheetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/time-sheets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Folha de Ponto", description = "GeraÃ§Ã£o de folha de ponto em Excel")
public class TimeSheetController {

    private final TimeSheetService timeSheetService;

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_READ', 'SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_DEPARTAMENTO_PESSOAL')")
    @Operation(summary = "Gerar folha de ponto mensal em Excel para um funcionÃ¡rio")
    public ResponseEntity<byte[]> generateTimeSheet(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) {
        try {
            LocalDate today = LocalDate.now();
            int resolvedYear = (year != null) ? year : today.getYear();
            int resolvedMonth = (month != null) ? month : today.getMonthValue();

            byte[] fileBytes = timeSheetService.generateMonthlyTimeSheet(employeeId, resolvedYear, resolvedMonth);

            String filename = String.format("folha-ponto-%s-%02d-%04d.xlsx", employeeId, resolvedMonth, resolvedYear);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(fileBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar folha de ponto: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}




