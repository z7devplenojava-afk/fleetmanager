package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.GeneratedFiscalFile;
import com.z7design.fleet_manager.dto.fiscal.NfeEmissionDtos.NfeCreateRequest;
import com.z7design.fleet_manager.dto.fiscal.NfeEmissionDtos.NfeResponse;
import com.z7design.fleet_manager.service.ElectronicNfeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** API de emissão de NF-e modelo 55 (versão 4.00) via SEFAZ. */
@RestController
@RequestMapping("/api/fiscal")
@RequiredArgsConstructor
@Slf4j
public class NfeController {

    private static final String FINANCE_ROLES =
            "hasAnyAuthority('SUPER_ADMIN','ADMIN','FINANCEIRO','COMPANY_ADMIN','FLEX_ADMIN',"
                    + "'ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_FINANCEIRO','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')";

    private final ElectronicNfeService nfeService;

    @GetMapping("/nfe")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<List<NfeResponse>> list() {
        return ResponseEntity.ok(nfeService.list());
    }

    @PostMapping("/nfe")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfeResponse> emit(@RequestBody NfeCreateRequest request) {
        log.info("POST /api/fiscal/nfe - emitindo NF-e 4.00");
        return ResponseEntity.ok(nfeService.emit(request));
    }

    @GetMapping("/nfe/{id}")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfeResponse> get(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(nfeService.get(id));
    }

    @PostMapping("/nfe/{id}/consultar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfeResponse> consultar(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(nfeService.consultar(id));
    }

    @GetMapping("/nfe/{id}/xml")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<byte[]> xml(@PathVariable("id") UUID id) {
        return download(nfeService.xml(id), MediaType.APPLICATION_XML);
    }

    @GetMapping("/nfe/{id}/pdf")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<byte[]> pdf(@PathVariable("id") UUID id) {
        return download(nfeService.pdf(id), MediaType.APPLICATION_PDF);
    }

    @PostMapping("/nfe/{id}/cancelar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfeResponse> cancelar(@PathVariable("id") UUID id,
                                                 @RequestParam("justificativa") String justificativa) {
        return ResponseEntity.ok(nfeService.cancelar(id, justificativa));
    }

    private static ResponseEntity<byte[]> download(GeneratedFiscalFile file, MediaType fallback) {
        MediaType contentType = file.contentType() == null || file.contentType().isBlank()
                ? fallback
                : MediaType.parseMediaType(file.contentType());
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.filename() + "\"")
                .body(file.content());
    }
}
