package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ClientChecklistRecordDTO;
import com.z7design.fleet_manager.dto.ClientChecklistTemplateDTO;
import com.z7design.fleet_manager.service.ClientChecklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client-checklists")
@RequiredArgsConstructor
@Slf4j
public class ClientChecklistController {

    private final ClientChecklistService service;

    // --- Templates ---

    @GetMapping("/templates")
    public ResponseEntity<List<ClientChecklistTemplateDTO>> findTemplates(
            @RequestParam(name = "clientId", required = false) UUID clientId) {
        if (clientId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(service.findTemplatesByClientId(clientId));
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<ClientChecklistTemplateDTO> findTemplateById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.findTemplateById(id));
    }

    @PostMapping("/templates")
    public ResponseEntity<ClientChecklistTemplateDTO> createTemplate(
            @Valid @RequestBody ClientChecklistTemplateDTO dto) {
        return ResponseEntity.ok(service.createTemplate(dto));
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<ClientChecklistTemplateDTO> updateTemplate(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ClientChecklistTemplateDTO dto) {
        return ResponseEntity.ok(service.updateTemplate(id, dto));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable("id") UUID id) {
        service.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    // --- Records ---

    @GetMapping("/records")
    public ResponseEntity<List<ClientChecklistRecordDTO>> findRecords(
            @RequestParam(name = "clientId", required = false) UUID clientId,
            @RequestParam(name = "templateId", required = false) UUID templateId,
            @RequestParam(name = "dateFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(name = "dateTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return ResponseEntity.ok(service.findRecordsByFilters(clientId, templateId, dateFrom, dateTo));
    }

    @GetMapping("/records/{id}")
    public ResponseEntity<ClientChecklistRecordDTO> findRecordById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.findRecordById(id));
    }

    @PostMapping("/records")
    public ResponseEntity<ClientChecklistRecordDTO> createRecord(
            @Valid @RequestBody ClientChecklistRecordDTO dto) {
        return ResponseEntity.ok(service.createRecord(dto));
    }

    @PutMapping("/records/{id}")
    public ResponseEntity<ClientChecklistRecordDTO> updateRecord(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ClientChecklistRecordDTO dto) {
        return ResponseEntity.ok(service.updateRecord(id, dto));
    }

    @DeleteMapping("/records/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable("id") UUID id) {
        service.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/records/{id}/odometer-photo")
    public ResponseEntity<ClientChecklistRecordDTO> uploadOdometerPhoto(
            @PathVariable("id") UUID id,
            @RequestParam("photo") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(service.uploadOdometerPhoto(id, file, description));
    }

    @PostMapping("/records/{id}/vehicle-photos")
    public ResponseEntity<ClientChecklistRecordDTO> uploadVehiclePhotos(
            @PathVariable("id") UUID id,
            @RequestParam(value = "photos", required = false) MultipartFile[] files) {
        MultipartFile[] safeFiles = (files != null) ? files : new MultipartFile[0];
        return ResponseEntity.ok(service.uploadVehiclePhotos(id, safeFiles));
    }
}
