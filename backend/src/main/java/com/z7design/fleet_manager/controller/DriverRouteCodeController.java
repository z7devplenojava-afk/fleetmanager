package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DriverRouteCode;
import com.z7design.fleet_manager.repository.DriverRouteCodeRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/api/driver-route-codes", "/api/v1/driver-route-codes"})
@RequiredArgsConstructor
@Slf4j
public class DriverRouteCodeController {

    private final DriverRouteCodeRepository repository;

    private static List<DriverRouteCode> getDefaultCodes() {
        List<DriverRouteCode> defaults = new ArrayList<>();
        String[][] raw = {
                {"01", "CASA/PONTO", "false", "1"},
                {"02", "CASA/GARAGEM", "false", "2"},
                {"03", "CASA/FÁBRICA", "false", "3"},
                {"04", "PONTO/CASA", "false", "4"},
                {"05", "PONTO/GARAGEM", "false", "5"},
                {"06", "PONTO/FÁBRICA", "false", "6"},
                {"07", "GARAGEM/CASA", "false", "7"},
                {"08", "GARAGEM/PONTO", "false", "8"},
                {"09", "GARAGEM/FÁBRICA", "false", "9"},
                {"10", "FÁBRICA/CASA", "false", "10"},
                {"11", "FÁBRICA/PONTO", "false", "11"},
                {"12", "FÁBRICA/GARAGEM", "false", "12"},
                {"13", "FÁBRICA/FÁBRICA", "false", "13"},
                {"14", "FINAL/FÁBRICA", "false", "14"},
                {"15", "OUTROS", "true", "15"}
        };
        for (String[] item : raw) {
            defaults.add(DriverRouteCode.builder()
                    .code(item[0])
                    .description(item[1])
                    .requiresJustification(Boolean.parseBoolean(item[2]))
                    .displayOrder(Integer.parseInt(item[3]))
                    .active(true)
                    .build());
        }
        return defaults;
    }

    @GetMapping
    public ResponseEntity<List<DriverRouteCode>> findAll() {
        UUID companyId = TenantContext.get();
        try {
            List<DriverRouteCode> dbCodes = (companyId != null)
                    ? repository.findAllActiveForCompanyOrGlobal(companyId)
                    : repository.findAllActiveGlobal();

            if (dbCodes == null || dbCodes.isEmpty()) {
                return ResponseEntity.ok(getDefaultCodes());
            }

            // Mesclar garantindo que códigos customizados da empresa sobrescrevam códigos globais de mesmo número
            Map<String, DriverRouteCode> merged = new LinkedHashMap<>();
            for (DriverRouteCode def : getDefaultCodes()) {
                merged.put(def.getCode(), def);
            }
            for (DriverRouteCode db : dbCodes) {
                DriverRouteCode existing = merged.get(db.getCode());
                if (existing == null || existing.getId() == null || db.getCompanyId() != null) {
                    merged.put(db.getCode(), db);
                }
            }
            return ResponseEntity.ok(new ArrayList<>(merged.values()));
        } catch (Exception e) {
            log.warn("Fallback para códigos de percurso padrão: {}", e.getMessage());
            return ResponseEntity.ok(getDefaultCodes());
        }
    }

    @PostMapping
    public ResponseEntity<DriverRouteCode> create(@RequestBody DriverRouteCode payload) {
        UUID companyId = payload.getCompanyId() != null ? payload.getCompanyId() : TenantContext.get();
        DriverRouteCode entity = DriverRouteCode.builder()
                .code(payload.getCode() != null ? payload.getCode().trim().toUpperCase() : "16")
                .description(payload.getDescription() != null ? payload.getDescription().trim().toUpperCase() : "PERSONALIZADO")
                .requiresJustification(Boolean.TRUE.equals(payload.getRequiresJustification()))
                .displayOrder(payload.getDisplayOrder() != null ? payload.getDisplayOrder() : 99)
                .active(true)
                .companyId(companyId)
                .build();
        return ResponseEntity.ok(repository.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DriverRouteCode> update(@PathVariable UUID id, @RequestBody DriverRouteCode payload) {
        DriverRouteCode entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Código de percurso não encontrado: " + id));
        if (payload.getCode() != null) entity.setCode(payload.getCode().trim().toUpperCase());
        if (payload.getDescription() != null) entity.setDescription(payload.getDescription().trim().toUpperCase());
        if (payload.getRequiresJustification() != null) entity.setRequiresJustification(payload.getRequiresJustification());
        if (payload.getDisplayOrder() != null) entity.setDisplayOrder(payload.getDisplayOrder());
        if (payload.getActive() != null) entity.setActive(payload.getActive());
        return ResponseEntity.ok(repository.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        repository.findById(id).ifPresent(entity -> {
            entity.setActive(false);
            repository.save(entity);
        });
        return ResponseEntity.noContent().build();
    }
}

