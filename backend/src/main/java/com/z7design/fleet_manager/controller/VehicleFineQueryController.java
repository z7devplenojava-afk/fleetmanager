package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleFineQueryRequestDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO.InfracaoDetalhadaDTO;
import com.z7design.fleet_manager.model.VehicleQueryCache;
import com.z7design.fleet_manager.repository.VehicleQueryCacheRepository;
import com.z7design.fleet_manager.service.VehicleFineQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/veiculos/consulta-multas")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Consulta Veicular de Multas", description = "Endpoints para consulta de multas, débitos, restrições e cruzamento com Parte Diária")
public class VehicleFineQueryController {

    private final VehicleFineQueryService vehicleFineQueryService;
    private final VehicleQueryCacheRepository cacheRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GESTOR_FROTA', 'OPERACIONAL', 'USER')")
    @Operation(summary = "Realiza consulta de multas e débitos veiculares integrando com provedores e cruzamento com Parte Diária")
    public ResponseEntity<VehicleFineQueryResponseDTO> queryVehicleFines(
            @Valid @RequestBody VehicleFineQueryRequestDTO request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : "sistema";
        VehicleFineQueryResponseDTO response = vehicleFineQueryService.queryVehicleFines(request, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/importar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GESTOR_FROTA')")
    @Operation(summary = "Importa manualmente infrações selecionadas para o módulo de multas do sistema")
    public ResponseEntity<Map<String, Object>> importFines(
            @RequestParam String placa,
            @RequestBody List<InfracaoDetalhadaDTO> infractions
    ) {
        int imported = vehicleFineQueryService.importSelectedFines(placa, infractions);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", imported + " multa(s) importada(s) com sucesso.",
                "total_importadas", imported
        ));
    }

    @PostMapping("/extrato-pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GESTOR_FROTA', 'OPERACIONAL', 'USER')")
    @Operation(summary = "Gera extrato oficial em PDF das multas e restrições consultadas com identificação de condutor")
    public ResponseEntity<byte[]> generateExtratoPdf(@RequestBody VehicleFineQueryResponseDTO data) {
        byte[] pdfBytes = vehicleFineQueryService.generateExtratoPdf(data);
        String plate = data.getDadosVeiculo() != null && data.getDadosVeiculo().getPlaca() != null ? 
                data.getDadosVeiculo().getPlaca() : "veiculo";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=extrato-multas-" + plate + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/historico/{placa}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GESTOR_FROTA', 'OPERACIONAL', 'USER')")
    @Operation(summary = "Lista o histórico de consultas de um veículo por placa")
    public ResponseEntity<List<VehicleQueryCache>> getHistoryByPlate(@PathVariable String placa) {
        String cleanPlate = placa.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        List<VehicleQueryCache> history = cacheRepository.findByPlateOrderByCreatedAtDesc(cleanPlate);
        return ResponseEntity.ok(history);
    }
}
