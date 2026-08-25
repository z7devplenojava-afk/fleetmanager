package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.Benefit;
import com.z7design.fleet_manager.service.BenefitService;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.dto.BenefitCreateDTO;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PositionRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/benefits")
@RequiredArgsConstructor
@Tag(name = "BenefÃ­cios", description = "Endpoints para gestÃ£o de benefÃ­cios.")
@SecurityRequirement(name = "bearerAuth")
public class BenefitController {
    
    private final BenefitService benefitService;
    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    
    @Operation(summary = "Cria um novo benefÃ­cio",
               description = "Adiciona um novo benefÃ­cio ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "BenefÃ­cio criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do benefÃ­cio para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Benefit.class),
                    examples = @ExampleObject(value = "{\"name\": \"Plano de SaÃºde\", \"description\": \"Plano Amil\", \"value\": 500.00, \"startDate\": \"2023-01-01\"}")))
    @PostMapping
    public ResponseEntity<Benefit> create(@RequestBody BenefitCreateDTO dto) {
        Benefit benefit = new Benefit();
        benefit.setName(dto.getName());
        benefit.setDescription(dto.getDescription());
        benefit.setType(dto.getType());
        benefit.setIsActive(dto.getIsActive());
        benefit.setValue(dto.getValue());
        benefit.setStartDate(dto.getStartDate());
        benefit.setEndDate(dto.getEndDate());
        if (dto.getEmployeeId() != null) {
            employeeRepository.findById(dto.getEmployeeId()).ifPresent(benefit::setEmployee);
        }
        if (dto.getPositionId() != null) {
            positionRepository.findById(dto.getPositionId()).ifPresent(benefit::setPosition);
        }
        return ResponseEntity.ok(benefitService.create(benefit));
    }
    
    @Operation(summary = "Atualiza um benefÃ­cio existente",
               description = "Atualiza as informaÃ§Ãµes de um benefÃ­cio pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "BenefÃ­cio atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "BenefÃ­cio nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do benefÃ­cio para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Benefit.class),
                    examples = @ExampleObject(value = "{\"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"name\": \"Plano de SaÃºde Atualizado\", \"description\": \"Plano Unimed\", \"value\": 600.00, \"startDate\": \"2023-01-01\", \"endDate\": \"2024-12-31\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Benefit> update(@PathVariable("id") UUID id, @RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.update(id, benefit));
    }
    
    @Operation(summary = "Exclui um benefÃ­cio",
               description = "Exclui um benefÃ­cio pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "BenefÃ­cio excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "BenefÃ­cio nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        benefitService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um benefÃ­cio pelo ID",
               description = "Retorna as informaÃ§Ãµes de um benefÃ­cio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "BenefÃ­cio encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "BenefÃ­cio nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Benefit> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(benefitService.findById(id));
    }
    
    @Operation(summary = "Busca benefÃ­cios por ID de funcionÃ¡rio",
               description = "Retorna uma lista de benefÃ­cios associados a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de benefÃ­cios do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Benefit>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(benefitService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca benefÃ­cios por ID de posiÃ§Ã£o",
               description = "Retorna uma lista de benefÃ­cios associados a uma posiÃ§Ã£o especÃ­fica. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de benefÃ­cios da posiÃ§Ã£o",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/position/{positionId}")
    public ResponseEntity<List<Benefit>> findByPositionId(@PathVariable("positionId") UUID positionId) {
        return ResponseEntity.ok(benefitService.findByPositionId(positionId));
    }
    
    @Operation(summary = "Busca benefÃ­cios ativos",
               description = "Retorna uma lista de todos os benefÃ­cios que estÃ£o atualmente ativos (sem data de tÃ©rmino). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de benefÃ­cios ativos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/active")
    public ResponseEntity<List<Benefit>> findActiveBenefits() {
        return ResponseEntity.ok(benefitService.findActiveBenefits());
    }
    
    @Operation(summary = "Retorna todos os benefÃ­cios",
               description = "Retorna uma lista de todos os benefÃ­cios cadastrados. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos os benefÃ­cios",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<Benefit>> findAll() {
        return ResponseEntity.ok(benefitService.findAll());
    }
} 
