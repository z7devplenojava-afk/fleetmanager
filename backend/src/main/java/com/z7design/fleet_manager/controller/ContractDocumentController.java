package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ContractDocumentDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.ContractDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractDocumentController {

    private final ContractDocumentService service;

    @GetMapping("/{contractId}/documents")
    public ResponseEntity<List<ContractDocumentDTO>> listByContract(@PathVariable UUID contractId) {
        return ResponseEntity.ok(service.listByContract(contractId));
    }

    @PostMapping(value = "/{contractId}/documents", consumes = "multipart/form-data")
    public ResponseEntity<ContractDocumentDTO> upload(
            @PathVariable UUID contractId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.upload(contractId, file, user));
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID documentId) {
        Resource resource = service.download(documentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID documentId) {
        service.delete(documentId);
        return ResponseEntity.noContent().build();
    }
}
