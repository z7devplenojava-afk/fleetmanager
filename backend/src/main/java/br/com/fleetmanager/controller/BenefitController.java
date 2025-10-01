package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.BenefitService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Benefit;
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
@Tag(name = "Benefícios", description = "Endpoints para gestão de benefícios.")
@SecurityRequirement(name = "bearerAuth")
public class BenefitController {
    
    private final BenefitService benefitService;
    
    @Operation(summary = "Cria um novo benefício",
               description = "Adiciona um novo benefício ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Benefício criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do benefício para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Benefit.class),
                    examples = @ExampleObject(value = "{\"name\": \"Plano de Saúde\", \"description\": \"Plano Amil\", \"value\": 500.00, \"startDate\": \"2023-01-01\"}")))
    @PostMapping
    public ResponseEntity<Benefit> create(@RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.create(benefit));
    }
    
    @Operation(summary = "Atualiza um benefício existente",
               description = "Atualiza as informações de um benefício pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Benefício atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Benefício não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do benefício para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Benefit.class),
                    examples = @ExampleObject(value = "{\"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"name\": \"Plano de Saúde Atualizado\", \"description\": \"Plano Unimed\", \"value\": 600.00, \"startDate\": \"2023-01-01\", \"endDate\": \"2024-12-31\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Benefit> update(@PathVariable UUID id, @RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.update(id, benefit));
    }
    
    @Operation(summary = "Exclui um benefício",
               description = "Exclui um benefício pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Benefício excluído com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Benefício não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        benefitService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um benefício pelo ID",
               description = "Retorna as informações de um benefício específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Benefício encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Benefício não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Benefit> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(benefitService.findById(id));
    }
    
    @Operation(summary = "Busca benefícios por ID de funcionário",
               description = "Retorna uma lista de benefícios associados a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de benefícios do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Benefit>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(benefitService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca benefícios por ID de posição",
               description = "Retorna uma lista de benefícios associados a uma posição específica. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de benefícios da posição",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/position/{positionId}")
    public ResponseEntity<List<Benefit>> findByPositionId(@PathVariable UUID positionId) {
        return ResponseEntity.ok(benefitService.findByPositionId(positionId));
    }
    
    @Operation(summary = "Busca benefícios ativos",
               description = "Retorna uma lista de todos os benefícios que estão atualmente ativos (sem data de término). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de benefícios ativos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/active")
    public ResponseEntity<List<Benefit>> findActiveBenefits() {
        return ResponseEntity.ok(benefitService.findActiveBenefits());
    }
    
    @Operation(summary = "Retorna todos os benefícios",
               description = "Retorna uma lista de todos os benefícios cadastrados. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos os benefícios",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Benefit.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<Benefit>> findAll() {
        return ResponseEntity.ok(benefitService.findAll());
    }
} 