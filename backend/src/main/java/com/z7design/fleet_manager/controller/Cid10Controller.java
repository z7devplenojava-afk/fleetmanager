package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.Cid10DTO;
import com.z7design.fleet_manager.service.Cid10Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cid10")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "CID-10", description = "Catálogo oficial do CID-10 para atestados médicos")
public class Cid10Controller {

    private final Cid10Service cid10Service;

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Busca CIDs por código ou descrição", description = "Retorna lista de CIDs para autocompletar na digitação")
    public ResponseEntity<List<Cid10DTO>> search(
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit) {
        return ResponseEntity.ok(cid10Service.search(query, limit));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    @Operation(summary = "Busca CID por código exato")
    public ResponseEntity<Cid10DTO> getByCode(@PathVariable String code) {
        return cid10Service.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
