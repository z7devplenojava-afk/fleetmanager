package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.warehouse.WarehouseInboundCheckPayload;
import com.z7design.fleet_manager.dto.warehouse.WarehouseInboundParsedXmlDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.WarehouseInboundDocument;
import com.z7design.fleet_manager.service.WarehouseInboundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/warehouse/inbound")
@RequiredArgsConstructor
public class WarehouseInboundController {

    private final WarehouseInboundService inboundService;

    /**
     * Upload do arquivo XML da NF-e para parsing e preview dos dados.
     */
    @PostMapping("/upload-xml")
    public ResponseEntity<WarehouseInboundParsedXmlDTO> uploadXml(@RequestParam("file") MultipartFile file) {
        try {
            WarehouseInboundParsedXmlDTO parsedDto = inboundService.parseNfeXml(file.getInputStream());
            return ResponseEntity.ok(parsedDto);
        } catch (Exception e) {
            log.error("Erro no upload do XML da NF-e: {}", e.getMessage());
            throw new RuntimeException("Erro ao processar o arquivo XML: " + e.getMessage(), e);
        }
    }

    /**
     * Salva o Documento de Entrada após conferência prévia do XML.
     */
    @PostMapping("/create")
    public ResponseEntity<WarehouseInboundDocument> createDocument(
            @AuthenticationPrincipal User user,
            @RequestBody WarehouseInboundParsedXmlDTO dto
    ) {
        WarehouseInboundDocument doc = inboundService.createDocumentFromParsedXml(user.getCompanyId(), user.getId(), dto);
        return ResponseEntity.ok(doc);
    }

    /**
     * Lista paginada dos Documentos de Entrada do almoxarifado.
     */
    @GetMapping
    public ResponseEntity<Page<WarehouseInboundDocument>> listDocuments(
            @AuthenticationPrincipal User user,
            Pageable pageable
    ) {
        return ResponseEntity.ok(inboundService.findAll(user.getCompanyId(), pageable));
    }

    /**
     * Busca um Documento de Entrada pelo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<WarehouseInboundDocument> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(inboundService.findById(id));
    }

    /**
     * Inicia a conferência física da carga.
     */
    @PostMapping("/{id}/start-check")
    public ResponseEntity<WarehouseInboundDocument> startConference(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(inboundService.startConference(id));
    }

    /**
     * Registra os dados da conferência física dos itens.
     */
    @PostMapping("/{id}/check-items")
    public ResponseEntity<WarehouseInboundDocument> checkItems(
            @PathVariable("id") UUID id,
            @RequestBody WarehouseInboundCheckPayload payload
    ) {
        return ResponseEntity.ok(inboundService.checkConferenceItems(id, payload));
    }

    /**
     * Lança a entrada de saldo no estoque e instancia pneus/baterias.
     */
    @PostMapping("/{id}/process-stock")
    public ResponseEntity<WarehouseInboundDocument> processStock(
            @PathVariable("id") UUID id,
            @RequestParam(value = "locationId", required = false) UUID locationId
    ) {
        return ResponseEntity.ok(inboundService.processStock(id, locationId));
    }

    /**
     * Integra as duplicatas/faturas com o módulo de Contas a Pagar / DDA.
     */
    @PostMapping("/{id}/process-financial")
    public ResponseEntity<WarehouseInboundDocument> processFinancial(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(inboundService.processFinancial(id));
    }
}
