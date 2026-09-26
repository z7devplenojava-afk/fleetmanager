package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.StockNfeParsedDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessRequestDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessResponseDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.StockNfeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/stock/nfe")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Estoque - NF-e XML", description = "Endpoints para importação de NF-e em XML para o estoque e módulo financeiro")
public class StockNfeController {

    private final StockNfeService stockNfeService;

    @PostMapping(value = "/parse-xml", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Realiza parse do arquivo XML de NF-e para conferência prévia de itens e financeiro")
    public ResponseEntity<StockNfeParsedDTO> parseXml(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        log.info("POST /api/stock/nfe/parse-xml - Arquivo: {}, Tamanho: {} bytes", 
                file.getOriginalFilename(), file.getSize());
        return ResponseEntity.ok(stockNfeService.parseXml(file, user != null ? user.getCompanyId() : null));
    }

    @PostMapping("/process")
    @Operation(summary = "Processa e grava os itens no estoque e as parcelas no Contas a Pagar")
    public ResponseEntity<StockNfeProcessResponseDTO> processNfe(
            @RequestBody StockNfeProcessRequestDTO request,
            @AuthenticationPrincipal User user) {
        log.info("POST /api/stock/nfe/process - NF-e nº: {}, Itens: {}", 
                request.getInvoiceNumber(), request.getItems() != null ? request.getItems().size() : 0);
        return ResponseEntity.ok(stockNfeService.processNfe(request, user));
    }
}
