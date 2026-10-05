package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.WorkScale;
import com.z7design.fleet_manager.model.enums.WorkScaleType;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.WorkScaleRepository;
import com.z7design.fleet_manager.service.UserCompanyResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/work-scales")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Escalas de Trabalho", description = "Listagem e cadastro de escalas de trabalho usadas na precificação e operação")
public class WorkScaleController {

    private final WorkScaleRepository workScaleRepository;
    private final CompanyRepository companyRepository;
    private final UserCompanyResolver userCompanyResolver;

    @GetMapping
    @Operation(summary = "Lista todas as escalas de trabalho, com filtro opcional por nome")
    public ResponseEntity<List<WorkScale>> list(@RequestParam(value = "search", required = false) String search) {
        List<WorkScale> scales;
        if (search != null && !search.isBlank()) {
            scales = workScaleRepository.findByNameContainingIgnoreCase(search.trim());
        } else {
            scales = workScaleRepository.findAll();
        }
        return ResponseEntity.ok(scales);
    }

    @PostMapping
    @Operation(summary = "Cadastra uma nova escala de trabalho")
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "O nome da escala é obrigatório."));
        }

        String nameTrimmed = name.trim();
        if (workScaleRepository.findByNameIgnoreCase(nameTrimmed).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Já existe uma escala de trabalho com este nome."));
        }

        WorkScaleType type;
        String rawType = body.get("type");
        if (rawType != null && !rawType.isBlank()) {
            try {
                type = WorkScaleType.valueOf(rawType.toUpperCase());
            } catch (IllegalArgumentException e) {
                type = WorkScaleType.CUSTOM;
            }
        } else {
            type = WorkScaleType.CUSTOM;
        }

        WorkScale scale = new WorkScale();
        scale.setName(nameTrimmed);
        scale.setType(type);
        String workDays = body.get("workDays");
        scale.setWorkDays(workDays != null && !workDays.isBlank() ? workDays.trim() : "1111100");

        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        if (companyId != null) {
            Company company = companyRepository.findById(companyId).orElse(null);
            scale.setCompany(company);
        }
        if (scale.getCompany() == null) {
            companyRepository.findAll().stream().findFirst().ifPresent(scale::setCompany);
        }
        if (scale.getCompany() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nenhuma empresa encontrada para vincular à escala."));
        }

        WorkScale saved = workScaleRepository.save(scale);
        log.info("🕒 Escala de trabalho '{}' cadastrada via precificação", saved.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
