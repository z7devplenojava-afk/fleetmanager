package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.warehouse.*;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.WarehouseInventoryStatus;
import com.z7design.fleet_manager.service.WarehouseInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse/inventory")
@RequiredArgsConstructor
public class WarehouseInventoryController {

    private final WarehouseInventoryService service;

    @PostMapping
    public ResponseEntity<WarehouseInventoryAuditDTO> create(
            @RequestBody WarehouseInventoryCreateDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.createAudit(dto, user));
    }

    @GetMapping
    public ResponseEntity<Page<WarehouseInventoryAuditDTO>> list(
            @RequestParam(value = "status", required = false) WarehouseInventoryStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.list(user.getCompanyId(), status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseInventoryAuditDTO> getById(
            @PathVariable("id") UUID id,
            @RequestParam(value = "blind", defaultValue = "false") boolean blind,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user.getCompanyId(), blind));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<WarehouseInventoryAuditDTO> startCount(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.startCount(id, user));
    }

    @PostMapping("/{id}/submit-count")
    public ResponseEntity<WarehouseInventoryAuditDTO> submitCount(
            @PathVariable("id") UUID id,
            @RequestBody WarehouseInventorySubmitCountDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.submitCount(id, dto, user));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<WarehouseInventoryAuditDTO> approve(
            @PathVariable("id") UUID id,
            @RequestBody WarehouseInventoryApproveDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.approveAndApplyAdjustments(id, dto, user));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<WarehouseInventoryAuditDTO> cancel(
            @PathVariable("id") UUID id,
            @RequestParam(value = "reason", required = false) String reason,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.cancelAudit(id, reason, user));
    }
}
