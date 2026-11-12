package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.warehouse.TireShopServiceDTO;
import com.z7design.fleet_manager.model.TireShopServiceCatalog;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.TireShopService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tires/shop-services")
@RequiredArgsConstructor
public class TireShopController {

    private final TireShopService tireShopService;

    private UUID resolveCompanyId(User user) {
        UUID ctx = TenantContext.get();
        if (ctx != null) return ctx;
        return user != null ? user.getCompanyId() : null;
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<TireShopServiceCatalog>> getCatalog(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tireShopService.getCatalog(resolveCompanyId(user)));
    }

    @PostMapping("/catalog")
    public ResponseEntity<TireShopServiceCatalog> createCatalogItem(
            @RequestBody TireShopServiceCatalog req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tireShopService.createCatalogItem(req, resolveCompanyId(user)));
    }

    @PutMapping("/catalog/{id}")
    public ResponseEntity<TireShopServiceCatalog> updateCatalogItem(
            @PathVariable("id") UUID id,
            @RequestBody TireShopServiceCatalog req) {
        return ResponseEntity.ok(tireShopService.updateCatalogItem(id, req));
    }

    @DeleteMapping("/catalog/{id}")
    public ResponseEntity<Void> deleteCatalogItem(@PathVariable("id") UUID id) {
        tireShopService.deleteCatalogItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<TireShopServiceDTO>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tireShopService.getAllRecords(resolveCompanyId(user)));
    }

    @PostMapping
    public ResponseEntity<TireShopServiceDTO> create(
            @RequestBody TireShopServiceDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tireShopService.createRecord(dto, resolveCompanyId(user), user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TireShopServiceDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody TireShopServiceDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tireShopService.updateRecord(id, dto, resolveCompanyId(user), user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        tireShopService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }
}

