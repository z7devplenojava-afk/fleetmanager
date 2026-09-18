package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ClientMobilizationDTO;
import com.z7design.fleet_manager.service.ClientMobilizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/clients/mobilization", "/clients/mobilization"})
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ClientMobilizationController {

    private final ClientMobilizationService clientMobilizationService;

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('COMERCIAL', 'GESTOR_COMERCIAL', 'VENDAS', 'GESTOR', 'OPERACIONAL', 'ADMIN', 'SUPER_ADMIN', 'FLEX_ADMIN', 'ROOT')")
    public ResponseEntity<?> triggerMobilization(@RequestBody ClientMobilizationDTO dto) {
        log.info("📡 Requisição de disparo de mobilização recebida para cliente: {}", dto.getClientName());
        clientMobilizationService.triggerMobilization(dto);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Mobilização multi-setorial disparada com sucesso para Operacional, Manutenção, SST, Almoxarifado e Financeiro!"
        ));
    }
}
