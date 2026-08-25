package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleDocumentDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.VehicleDocument;
import com.z7design.fleet_manager.service.VehicleDocumentService;
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
@RequestMapping("/api/frota/vehicle-documents")
@RequiredArgsConstructor
public class VehicleDocumentController {

    private final VehicleDocumentService service;

    @GetMapping
    public ResponseEntity<List<VehicleDocumentDTO>> list(
            @RequestParam(value = "vehicleId", required = false) UUID vehicleId,
            @AuthenticationPrincipal User user) {
        if (vehicleId != null) {
            return ResponseEntity.ok(service.listByVehicle(vehicleId, user.getCompanyId()));
        }
        return ResponseEntity.ok(service.listAll(user.getCompanyId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDocumentDTO> getById(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId()));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<VehicleDocumentDTO> upload(
            @RequestParam("vehicleId") UUID vehicleId,
            @RequestParam(value = "docType", required = false) VehicleDocument.DocumentType docType,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam(value = "issueDate", required = false) String issueDate,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.upload(vehicleId, docType, title, documentNumber,
                issueDate, expiryDate, file, user));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        Resource resource = service.download(id, user.getCompanyId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user.getCompanyId());
        return ResponseEntity.noContent().build();
    }
}
