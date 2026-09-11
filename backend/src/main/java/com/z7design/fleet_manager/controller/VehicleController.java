package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleDTO;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.service.VehicleExcelImportService;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Veículos", description = "API para gerenciamento de veículos da frota")
public class VehicleController {

    private final VehicleService vehicleService;
    private final VehicleExcelImportService vehicleExcelImportService;

    @GetMapping
    @Operation(summary = "Listar todos os veÃ­culos", description = "Retorna uma lista de todos os veÃ­culos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VeÃ­culos listados com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        log.debug("Buscando todos os veÃ­culos");
        try {
            List<VehicleDTO> vehicles = vehicleService.getAllVehicles();
            log.debug("Retornando {} veÃ­culos", vehicles.size());
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            log.error("Erro ao buscar veÃ­culos: ", e);
            throw new RuntimeException("Erro interno do servidor. Tente novamente mais tarde.");
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar veÃ­culo por ID", description = "Retorna um veÃ­culo especÃ­fico pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VeÃ­culo encontrado"),
            @ApiResponse(responseCode = "404", description = "VeÃ­culo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<VehicleDTO> getVehicleById(@PathVariable("id") UUID id) {
        log.debug("Buscando veÃ­culo por ID: {}", id);
        VehicleDTO vehicle = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(vehicle);
    }

    @GetMapping("/plate/{plate}")
    @Operation(summary = "Buscar veÃ­culo por placa", description = "Retorna um veÃ­culo especÃ­fico pela placa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VeÃ­culo encontrado"),
            @ApiResponse(responseCode = "404", description = "VeÃ­culo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<VehicleDTO> getVehicleByPlate(@PathVariable("plate") String plate) {
        log.debug("Buscando veÃ­culo por placa: {}", plate);
        Optional<VehicleDTO> vehicle = vehicleService.getVehicleByPlate(plate);
        if (vehicle.isPresent()) {
            return ResponseEntity.ok(vehicle.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar veÃ­culos por status", description = "Retorna veÃ­culos filtrados por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VeÃ­culos encontrados"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<VehicleDTO>> getVehiclesByStatus(@PathVariable("status") Vehicle.VehicleStatus status) {
        log.debug("Buscando veÃ­culos por status: {}", status);
        List<VehicleDTO> vehicles = vehicleService.getVehiclesByStatus(status);
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar veÃ­culos", description = "Busca veÃ­culos por placa, modelo ou marca")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VeÃ­culos encontrados"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<VehicleDTO>> searchVehicles(@RequestParam(name = "searchTerm") String searchTerm) {
        log.debug("Buscando veÃ­culos com termo: {}", searchTerm);
        List<VehicleDTO> vehicles = vehicleService.searchVehicles(searchTerm);
        return ResponseEntity.ok(vehicles);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('FLEET_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Criar novo veÃ­culo", description = "Cria um novo veÃ­culo na frota")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "VeÃ­culo criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<VehicleDTO> createVehicle(@Valid @RequestBody VehicleDTO vehicleDTO) {
        log.debug("Criando novo veÃ­culo: {}", vehicleDTO.getPlate());
        VehicleDTO createdVehicle = vehicleService.createVehicle(vehicleDTO);
        return ResponseEntity.status(201).body(createdVehicle);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('FLEET_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Atualizar veÃ­culo", description = "Atualiza os dados de um veÃ­culo existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VeÃ­culo atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "VeÃ­culo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<VehicleDTO> updateVehicle(@PathVariable("id") UUID id, @Valid @RequestBody VehicleDTO vehicleDTO) {
        log.debug("Atualizando veÃ­culo ID: {}", id);
        VehicleDTO updatedVehicle = vehicleService.updateVehicle(id, vehicleDTO);
        return ResponseEntity.ok(updatedVehicle);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('FLEET_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Excluir veÃ­culo", description = "Exclui um veÃ­culo da frota")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "VeÃ­culo excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "VeÃ­culo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteVehicle(@PathVariable("id") UUID id) {
        log.debug("Excluindo veÃ­culo ID: {}", id);
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    @Operation(summary = "Contar veículos", description = "Retorna o número total de veículos")
    public ResponseEntity<Object> getCount() {
        try {
            log.debug("Contando veículos");
            long count = vehicleService.count();
            log.debug("Total de veículos: {}", count);
            return ResponseEntity.ok(java.util.Map.of("count", count, "message", "Contagem realizada com sucesso"));
        } catch (Exception e) {
            log.error("Erro ao contar veículos: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/import/excel", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('FLEET_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Importar veículos via Excel", description = "Importa uma planilha Excel analisando todas as abas e mapeando colunas Placa/Patrimônio, Chassi, Renavam, Modelo, Ano/Mod")
    public ResponseEntity<ImportResultDto> importVehiclesExcel(@RequestParam("file") MultipartFile file) {
        log.info("Recebida requisição de importação de veículos Excel: {}", file.getOriginalFilename());
        try {
            ImportResultDto result = vehicleExcelImportService.importVehiclesFromExcel(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro na importação de veículos Excel: ", e);
            ImportResultDto errorResult = ImportResultDto.empty();
            errorResult.getErrors().add("Erro ao processar importação: " + e.getMessage());
            return ResponseEntity.ok(errorResult);
        }
    }
}
