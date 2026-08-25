package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.dto.CreateOccurrenceDTO;
import com.z7design.fleet_manager.dto.OccurrenceResponseDTO;
import com.z7design.fleet_manager.model.Occurrence;
import com.z7design.fleet_manager.model.OperationalOccurrence;
import com.z7design.fleet_manager.service.OccurrenceService;
import com.z7design.fleet_manager.service.OperationalOccurrenceService;
import com.z7design.fleet_manager.dto.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/occurrences")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "OcorrÃªncias", description = "Endpoints para gestÃ£o de ocorrÃªncias de seguranÃ§a.")
@SecurityRequirement(name = "bearerAuth")
public class OccurrenceController {
    
    private final OccurrenceService occurrenceService;
    private final OperationalOccurrenceService operationalOccurrenceService;
    
    @Operation(summary = "Cria uma nova ocorrÃªncia",
               description = "Adiciona uma nova ocorrÃªncia ao sistema. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OcorrÃªncia criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Occurrence.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da ocorrÃªncia para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Occurrence.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"occurrenceType\":\"INCIDENT\", \"description\":\"Incidente de seguranÃ§a na portaria.\", \"occurrenceDate\":\"2024-06-20T10:30:00\", \"status\":\"REPORTED\"}")))
    @PostMapping
    public ResponseEntity<OccurrenceResponseDTO> create(@RequestBody CreateOccurrenceDTO dto) {
        log.info("POST /api/occurrences - Criando nova ocorrÃªncia");
        try {
            var occurrence = operationalOccurrenceService.createFromDTO(dto);
            var responseDTO = operationalOccurrenceService.convertToResponseDTO(occurrence);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            log.error("Erro ao criar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Operation(summary = "Atualiza uma ocorrÃªncia existente",
               description = "Atualiza as informaÃ§Ãµes de uma ocorrÃªncia pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OcorrÃªncia atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Occurrence.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "OcorrÃªncia nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da ocorrÃªncia para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Occurrence.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"description\":\"Incidente de seguranÃ§a resolvido.\", \"status\":\"RESOLVED\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<OccurrenceResponseDTO> update(@PathVariable("id") UUID id, @RequestBody CreateOccurrenceDTO dto) {
        log.info("PUT /api/occurrences/{} - Atualizando ocorrÃªncia", id);
        try {
            // Buscar ocorrÃªncia existente
            OperationalOccurrence existingOccurrence = operationalOccurrenceService.getOccurrenceById(id);
            
            // Atualizar campos do DTO
            if (dto.getType() != null) {
                try {
                    existingOccurrence.setType(OperationalOccurrence.OccurrenceType.valueOf(dto.getType().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Tipo invÃ¡lido: {}", dto.getType());
                }
            }
            if (dto.getTitle() != null) {
                existingOccurrence.setTitle(dto.getTitle());
            }
            if (dto.getDescription() != null) {
                existingOccurrence.setDescription(dto.getDescription());
            }
            if (dto.getLocation() != null) {
                existingOccurrence.setLocation(dto.getLocation());
            }
            if (dto.getStatus() != null) {
                try {
                    existingOccurrence.setStatus(OperationalOccurrence.OccurrenceStatus.valueOf(dto.getStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Status invÃ¡lido: {}", dto.getStatus());
                }
            }
            if (dto.getPriority() != null) {
                try {
                    existingOccurrence.setPriority(OperationalOccurrence.OccurrencePriority.valueOf(dto.getPriority().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Prioridade invÃ¡lida: {}", dto.getPriority());
                }
            }
            if (dto.getDate() != null && !dto.getDate().isEmpty()) {
                existingOccurrence.setDate(dto.getDateAsLocalDateTime());
            }
            if (dto.getResponsible() != null) {
                existingOccurrence.setResponsible(dto.getResponsible());
            }
            if (dto.getWarningNumber() != null) {
                existingOccurrence.setWarningNumber(dto.getWarningNumber());
            }
            
            OperationalOccurrence updatedOccurrence = operationalOccurrenceService.updateOccurrence(id, existingOccurrence);
            OccurrenceResponseDTO responseDTO = operationalOccurrenceService.convertToResponseDTO(updatedOccurrence);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            log.error("Erro ao atualizar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Operation(summary = "Exclui uma ocorrÃªncia",
               description = "Exclui uma ocorrÃªncia pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "OcorrÃªncia excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "OcorrÃªncia nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        log.info("DELETE /api/occurrences/{} - Deletando ocorrÃªncia", id);
        try {
            operationalOccurrenceService.deleteOccurrence(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao deletar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Operation(summary = "Busca uma ocorrÃªncia pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma ocorrÃªncia especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for relacionado ao funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OcorrÃªncia encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Occurrence.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "OcorrÃªncia nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<OccurrenceResponseDTO> findById(@PathVariable("id") UUID id) {
        try {
            // Tentar buscar como OperationalOccurrence primeiro
            var occurrence = operationalOccurrenceService.getOccurrenceById(id);
            var responseDTO = operationalOccurrenceService.convertToResponseDTO(occurrence);
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncia: {}", e.getMessage(), e);
            // Se nÃ£o encontrar como OperationalOccurrence, tentar como Occurrence antiga
            try {
                occurrenceService.findById(id);
                // Converter Occurrence antiga para DTO (implementar se necessÃ¡rio)
                throw new RuntimeException("OcorrÃªncia encontrada mas formato antigo nÃ£o suportado");
            } catch (Exception e2) {
                throw e;
            }
        }
    }
    
    @Operation(summary = "Busca ocorrÃªncias por ID de funcionÃ¡rio",
               description = "Retorna uma lista de ocorrÃªncias associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de ocorrÃªncias do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = OccurrenceResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<OccurrenceResponseDTO>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        var occurrences = operationalOccurrenceService.getOccurrencesByEmployee(employeeId);
        var responseDTOs = occurrences.stream()
            .map(operationalOccurrenceService::convertToResponseDTO)
            .toList();
        return ResponseEntity.ok(responseDTOs);
    }
    
    @Operation(summary = "Busca ocorrÃªncias por tipo",
               description = "Retorna uma lista de ocorrÃªncias de um tipo especÃ­fico (ex: INCIDENT, ACCIDENT). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de ocorrÃªncias por tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = OccurrenceResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Tipo de ocorrÃªncia invÃ¡lido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/type/{type}")
    public ResponseEntity<List<OccurrenceResponseDTO>> findByType(@PathVariable("type") String type) {
        try {
            var occurrenceType = OperationalOccurrence.OccurrenceType.valueOf(type.toUpperCase());
            var occurrences = operationalOccurrenceService.getOccurrencesByType(occurrenceType);
            var responseDTOs = occurrences.stream()
                .map(operationalOccurrenceService::convertToResponseDTO)
                .toList();
            return ResponseEntity.ok(responseDTOs);
        } catch (IllegalArgumentException e) {
            log.error("Tipo invÃ¡lido: {}", type);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @Operation(summary = "Busca ocorrÃªncias por status",
               description = "Retorna uma lista de ocorrÃªncias com um status especÃ­fico (ex: REPORTED, IN_PROGRESS, RESOLVED). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de ocorrÃªncias por status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = OccurrenceResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Status de ocorrÃªncia invÃ¡lido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OccurrenceResponseDTO>> findByStatus(@PathVariable("status") String status) {
        try {
            var occurrenceStatus = OperationalOccurrence.OccurrenceStatus.valueOf(status.toUpperCase());
            var occurrences = operationalOccurrenceService.getOccurrencesByStatus(occurrenceStatus);
            var responseDTOs = occurrences.stream()
                .map(operationalOccurrenceService::convertToResponseDTO)
                .toList();
            return ResponseEntity.ok(responseDTOs);
        } catch (IllegalArgumentException e) {
            log.error("Status invÃ¡lido: {}", status);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @Operation(summary = "Retorna todas as ocorrÃªncias",
               description = "Retorna uma lista de todas as ocorrÃªncias cadastradas. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as ocorrÃªncias",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = OccurrenceResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<OccurrenceResponseDTO>> findAll() {
        log.info("GET /api/occurrences - Buscando todas as ocorrÃªncias");
        try {
            var occurrences = operationalOccurrenceService.getAllOccurrences();
            var responseDTOs = occurrences.stream()
                .map(operationalOccurrenceService::convertToResponseDTO)
                .toList();
            log.info("âœ… OcorrÃªncias retornadas: {} registros", responseDTOs.size());
            return ResponseEntity.ok(responseDTOs);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar ocorrÃªncias", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 
