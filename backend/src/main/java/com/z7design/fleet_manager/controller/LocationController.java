package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.LocationDTO;
import com.z7design.fleet_manager.service.LocationService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "LocalizaÃ§Ãµes", description = "API para gerenciamento de localizaÃ§Ãµes")
public class LocationController {
    
    private final LocationService locationService;
    
    @GetMapping
    @Operation(summary = "Listar todas as localizaÃ§Ãµes", description = "Retorna uma lista de todas as localizaÃ§Ãµes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "LocalizaÃ§Ãµes listadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<LocationDTO>> getAllLocations() {
        log.debug("Buscando todas as localizaÃ§Ãµes");
        try {
            List<LocationDTO> locations = locationService.getAllLocations();
            log.debug("Retornando {} localizaÃ§Ãµes", locations.size());
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            log.error("Erro ao buscar localizaÃ§Ãµes: ", e);
            throw new RuntimeException("Erro interno do servidor. Tente novamente mais tarde.");
        }
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar localizaÃ§Ã£o por ID", description = "Retorna uma localizaÃ§Ã£o especÃ­fica pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "LocalizaÃ§Ã£o encontrada"),
            @ApiResponse(responseCode = "404", description = "LocalizaÃ§Ã£o nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<LocationDTO> getLocationById(@PathVariable("id") UUID id) {
        log.debug("Buscando localizaÃ§Ã£o por ID: {}", id);
        LocationDTO location = locationService.getLocationById(id);
        return ResponseEntity.ok(location);
    }
    
    @GetMapping("/unit/{unitId}")
    @Operation(summary = "Buscar localizaÃ§Ãµes por unidade", description = "Retorna localizaÃ§Ãµes de uma unidade especÃ­fica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "LocalizaÃ§Ãµes encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<LocationDTO>> getLocationsByUnitId(@PathVariable("unitId") UUID unitId) {
        log.debug("Buscando localizaÃ§Ãµes por unidade ID: {}", unitId);
        List<LocationDTO> locations = locationService.getLocationsByUnitId(unitId);
        return ResponseEntity.ok(locations);
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('HR_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Criar nova localizaÃ§Ã£o", description = "Cria uma nova localizaÃ§Ã£o no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "LocalizaÃ§Ã£o criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<LocationDTO> createLocation(@Valid @RequestBody LocationDTO locationDTO) {
        log.debug("Criando nova localizaÃ§Ã£o: {}", locationDTO.getName());
        LocationDTO createdLocation = locationService.createLocation(locationDTO);
        return ResponseEntity.status(201).body(createdLocation);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Atualizar localizaÃ§Ã£o", description = "Atualiza os dados de uma localizaÃ§Ã£o existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "LocalizaÃ§Ã£o atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "LocalizaÃ§Ã£o nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<LocationDTO> updateLocation(@PathVariable("id") UUID id, @Valid @RequestBody LocationDTO locationDTO) {
        log.debug("Atualizando localizaÃ§Ã£o ID: {}", id);
        LocationDTO updatedLocation = locationService.updateLocation(id, locationDTO);
        return ResponseEntity.ok(updatedLocation);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_WRITE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Excluir localizaÃ§Ã£o", description = "Exclui uma localizaÃ§Ã£o do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "LocalizaÃ§Ã£o excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "404", description = "LocalizaÃ§Ã£o nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteLocation(@PathVariable("id") UUID id) {
        log.debug("Excluindo localizaÃ§Ã£o ID: {}", id);
        locationService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }
}

