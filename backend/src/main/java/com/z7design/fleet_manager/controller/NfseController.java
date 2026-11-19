package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.FiscalCertificateResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.GeneratedFiscalFile;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseConfigRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseConfigResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseCreateRequest;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfsePreviewResponse;
import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.NfseResponse;
import com.z7design.fleet_manager.dto.fiscal.NfseEventDtos.NfseCancelRequest;
import com.z7design.fleet_manager.dto.fiscal.NfseEventDtos.NfseEventResponse;
import com.z7design.fleet_manager.service.FiscalCertificateService;
import com.z7design.fleet_manager.service.NfseEmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * API de emissão da NFS-e Nacional (SEFIN) e do certificado digital A1.
 */
@RestController
@RequestMapping("/api/fiscal")
@RequiredArgsConstructor
@Slf4j
public class NfseController {

    private static final String FINANCE_ROLES =
            "hasAnyAuthority('SUPER_ADMIN','ADMIN','FINANCEIRO','COMPANY_ADMIN','FLEX_ADMIN',"
                    + "'ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_FINANCEIRO','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')";

    private final NfseEmissionService nfseService;
    private final FiscalCertificateService certificateService;

    // ===================== NFS-e =====================

    @GetMapping("/nfse")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<List<NfseResponse>> list() {
        return ResponseEntity.ok(nfseService.list());
    }

    @GetMapping("/nfse/config")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfseConfigResponse> config() {
        return ResponseEntity.ok(nfseService.config());
    }

    @PutMapping("/nfse/config")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfseConfigResponse> updateConfig(@RequestBody NfseConfigRequest request) {
        return ResponseEntity.ok(nfseService.updateConfig(request));
    }

    @PostMapping("/nfse/preview")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfsePreviewResponse> preview(@RequestBody NfseCreateRequest request) {
        return ResponseEntity.ok(nfseService.preview(request));
    }

    @PostMapping("/nfse")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfseResponse> emit(@RequestBody NfseCreateRequest request) {
        log.info("POST /api/fiscal/nfse - emitindo DPS/NFS-e");
        return ResponseEntity.ok(nfseService.emit(request));
    }

    @GetMapping("/nfse/{id}")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfseResponse> get(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(nfseService.get(id));
    }

    @PostMapping("/nfse/{id}/consultar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfseResponse> consultar(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(nfseService.consultar(id));
    }

    @PostMapping("/nfse/{id}/cancelar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<NfseEventResponse> cancelar(@PathVariable("id") UUID id,
                                                       @RequestBody NfseCancelRequest request) {
        log.info("POST /api/fiscal/nfse/{}/cancelar", id);
        return ResponseEntity.ok(nfseService.cancelar(id, request));
    }

    @GetMapping("/nfse/{id}/xml")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<byte[]> xml(@PathVariable("id") UUID id) {
        GeneratedFiscalFile file = nfseService.xml(id);
        return download(file, MediaType.APPLICATION_XML);
    }

    @GetMapping("/nfse/{id}/pdf")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<byte[]> pdf(@PathVariable("id") UUID id) {
        GeneratedFiscalFile file = nfseService.pdf(id);
        return download(file, MediaType.APPLICATION_PDF);
    }

    // ===================== Certificado digital A1 =====================

    @GetMapping("/certificados")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<List<FiscalCertificateResponse>> certificates() {
        return ResponseEntity.ok(certificateService.list());
    }

    @PostMapping(value = "/certificados", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<FiscalCertificateResponse> uploadCertificate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("password") String password) {
        return ResponseEntity.ok(certificateService.upload(file, password));
    }

    @PostMapping("/certificados/{id}/ativar")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<FiscalCertificateResponse> activateCertificate(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(certificateService.activate(id));
    }

    @DeleteMapping("/certificados/{id}")
    @PreAuthorize(FINANCE_ROLES)
    public ResponseEntity<Void> deleteCertificate(@PathVariable("id") UUID id) {
        certificateService.delete(id);
        return ResponseEntity.noContent().build();
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
