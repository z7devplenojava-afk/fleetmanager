package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteCancelRequest;
import com.z7design.fleet_manager.dto.fiscal.CteEmissionDtos.CteEmissionRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.CteResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.GeneratedFiscalFile;
import com.z7design.fleet_manager.service.ElectronicCteService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * API de emissão real do CT-e (modelo 57, versão 4.00) via WebService da SEFAZ.
 */
@RestController
@RequestMapping("/api/fiscal")
@RequiredArgsConstructor
@Slf4j
public class CteController {

    private static final String FINANCE_ROLES =
            "hasAnyAuthority('SUPER_ADMIN','ADMIN','FINANCEIRO','COMPANY_ADMIN','FLEX_ADMIN',"
                    + "'ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_FINANCEIRO','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')";

    private final ElectronicCteService cteService;

    @GetMapping("/cte")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<List<CteResponse>> list() {
        return ResponseEntity.ok(cteService.list());
    }

    @PostMapping("/cte")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<CteResponse> emit(@RequestBody CteEmissionRequest request) {
        log.info("POST /api/fiscal/cte - emitindo CT-e 4.00");
        return ResponseEntity.ok(cteService.emit(request));
    }

    @GetMapping("/cte/{id}")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<CteResponse> get(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(cteService.get(id));
    }

    @PostMapping("/cte/{id}/consultar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<CteResponse> consultar(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(cteService.consultar(id));
    }

    @GetMapping("/cte/{id}/xml")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<byte[]> xml(@PathVariable("id") UUID id) {
        return download(cteService.xml(id), MediaType.APPLICATION_XML);
    }

    @GetMapping("/cte/{id}/pdf")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<byte[]> pdf(@PathVariable("id") UUID id) {
        return download(cteService.pdf(id), MediaType.APPLICATION_PDF);
    }

    @PostMapping("/cte/{id}/cancelar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<CteResponse> cancelar(@PathVariable("id") UUID id,
                                                @RequestBody CteCancelRequest request) {
        return ResponseEntity.ok(cteService.cancelar(id, request == null ? null : request.motivo()));
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
