package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.SeatTemplate;
import com.z7design.fleet_manager.service.SeatTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/seat-templates")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Templates de Poltronas", description = "Gerenciamento de layouts de assentos para veículos.")
@SecurityRequirement(name = "bearerAuth")
public class SeatTemplateController {

    private final SeatTemplateService seatTemplateService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        log.info("PING received on SeatTemplateController");
        return ResponseEntity.ok("pong from SeatTemplateController");
    }

    @Operation(summary = "Lista todos os templates da empresa")
    @GetMapping
    public ResponseEntity<List<SeatTemplate>> findAll(
            @RequestParam(name = "companyId", required = false) String companyId) {
        log.info("Recebendo requisição para listar templates. companyId (raw): [{}]", companyId);

        UUID companyUuid = null;
        if (companyId != null && !companyId.trim().isEmpty() && !companyId.equals("undefined")
                && !companyId.equals("null")) {
            try {
                companyUuid = UUID.fromString(companyId);
                log.info("companyId convertido para UUID: {}", companyUuid);
            } catch (IllegalArgumentException e) {
                log.warn("companyId inválido recebido: [{}]. Prosseguindo sem filtro de empresa.", companyId);
            }
        } else {
            log.info("companyId não fornecido ou vazio/inválido. Buscando todos os templates acessíveis.");
        }

        return ResponseEntity.ok(seatTemplateService.getAllTemplates(companyUuid));
    }

    @Operation(summary = "Busca um template pelo ID")
    @GetMapping("/{id}")
    public ResponseEntity<SeatTemplate> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(seatTemplateService.getById(id));
    }

    @Operation(summary = "Cria ou atualiza um template de poltronas")
    @PostMapping
    public ResponseEntity<SeatTemplate> save(@RequestBody SeatTemplate template) {
        log.info("Salvando template de poltronas: {}", template.getName());
        return ResponseEntity.ok(seatTemplateService.saveTemplate(template));
    }
}
