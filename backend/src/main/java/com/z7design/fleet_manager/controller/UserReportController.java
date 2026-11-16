package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.UserReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/report")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserReportController {

    private final UserReportService userReportService;

    @GetMapping("/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN_EMPRESA','ADMIN')")
    public ResponseEntity<?> generateUserReportPDF(
            @RequestParam(value = "companyId", required = false) UUID companyId,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status) {

        try {
            log.info("Requisição para gerar relatório PDF de usuários - Empresa: {}, Período: {} a {}, Role: {}, Status: {}",
                    companyId, startDate, endDate, role, status);

            byte[] pdfBytes = userReportService.generateUserReportPDF(companyId, startDate, endDate, role, status);

            if (pdfBytes == null || pdfBytes.length == 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Relatório PDF gerado está vazio");
                error.put("message", "Nenhum dado encontrado para os filtros selecionados.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(error);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("relatorio_usuarios_%s.pdf", timestamp);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);

            log.info("Relatório PDF de usuários gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (IOException e) {
            log.error("Erro ao gerar relatório PDF de usuários", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro ao gerar relatório PDF");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatório PDF de usuários", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro inesperado ao gerar relatório PDF");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    @GetMapping("/excel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FLEX_ADMIN','COMPANY_ADMIN','ADMIN_EMPRESA','ADMIN')")
    public ResponseEntity<?> generateUserReportExcel(
            @RequestParam(value = "companyId", required = false) UUID companyId,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status) {

        try {
            log.info("Requisição para gerar relatório Excel de usuários - Empresa: {}, Período: {} a {}, Role: {}, Status: {}",
                    companyId, startDate, endDate, role, status);

            byte[] excelBytes = userReportService.generateUserReportExcel(companyId, startDate, endDate, role, status);

            if (excelBytes == null || excelBytes.length == 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Relatório Excel gerado está vazio");
                error.put("message", "Nenhum dado encontrado para os filtros selecionados.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(error);
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("relatorio_usuarios_%s.xlsx", timestamp);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelBytes.length);

            log.info("Relatório Excel de usuários gerado com sucesso. Tamanho: {} bytes", excelBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);

        } catch (IOException e) {
            log.error("Erro ao gerar relatório Excel de usuários", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro ao gerar relatório Excel");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatório Excel de usuários", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro inesperado ao gerar relatório Excel");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }
}
