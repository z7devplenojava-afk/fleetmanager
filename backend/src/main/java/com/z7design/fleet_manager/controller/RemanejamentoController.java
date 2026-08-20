package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.RemanejamentoDTO;
import com.z7design.fleet_manager.model.Remanejamento;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.RemanejamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/remanejamentos")
@Tag(name = "Remanejamentos", description = "Endpoints para gestÃ£o de remanejamentos de funcionÃ¡rios")
@Slf4j
public class RemanejamentoController {
    @Autowired
    private RemanejamentoService remanejamentoService;

    @Operation(summary = "Cria um novo remanejamento",
               description = "Cria um novo registro de remanejamento e registra no histÃ³rico de auditoria.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Remanejamento criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PostMapping
    public ResponseEntity<RemanejamentoDTO> create(@RequestBody RemanejamentoDTO dto, 
                                              HttpServletRequest request) {
        try {
            User usuarioAtual = getUsuarioAtual();
            String ipUsuario = getClientIpAddress(request);
            
            RemanejamentoDTO created = remanejamentoService.createFromDTO(dto, usuarioAtual, 
                "CriaÃ§Ã£o via API - IP: " + ipUsuario);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            log.error("Erro ao criar remanejamento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro inesperado ao criar remanejamento: {}", e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Atualiza um remanejamento existente",
               description = "Atualiza um registro de remanejamento existente e registra no histÃ³rico de auditoria.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Remanejamento atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Remanejamento nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<RemanejamentoDTO> update(@PathVariable("id") UUID id, 
                                              @RequestBody RemanejamentoDTO dto,
                                              HttpServletRequest request) {
        User usuarioAtual = getUsuarioAtual();
        String ipUsuario = getClientIpAddress(request);
        
        RemanejamentoDTO updated = remanejamentoService.updateFromDTO(id, dto, usuarioAtual, 
            "EdiÃ§Ã£o via API - IP: " + ipUsuario);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Exclui um remanejamento",
               description = "Exclui um registro de remanejamento e registra no histÃ³rico de auditoria.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Remanejamento excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Remanejamento nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id, HttpServletRequest request) {
        User usuarioAtual = getUsuarioAtual();
        String ipUsuario = getClientIpAddress(request);
        
        remanejamentoService.delete(id, usuarioAtual, "ExclusÃ£o via API - IP: " + ipUsuario);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Busca todos os remanejamentos",
               description = "Retorna uma lista de todos os remanejamentos cadastrados.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de remanejamentos",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping
    public ResponseEntity<List<RemanejamentoDTO>> findAll() {
        return ResponseEntity.ok(remanejamentoService.findAllAsDTO());
    }

    @Operation(summary = "Busca um remanejamento por ID",
               description = "Retorna um remanejamento especÃ­fico pelo seu ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Remanejamento encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "404", description = "Remanejamento nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<RemanejamentoDTO> findById(@PathVariable("id") UUID id) {
        Optional<RemanejamentoDTO> remanejamento = remanejamentoService.findByIdAsDTO(id);
        return remanejamento.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Busca remanejamentos por funcionÃ¡rio",
               description = "Retorna todos os remanejamentos de um funcionÃ¡rio especÃ­fico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de remanejamentos do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<RemanejamentoDTO>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(remanejamentoService.findByEmployeeIdAsDTO(employeeId));
    }
    
    @Operation(summary = "Gerar relatÃ³rio PDF de remanejamentos",
               description = "Gera relatÃ³rio PDF filtrado por funcionÃ¡rio, tipo, origem, destino e perÃ­odo")
    @GetMapping("/report/pdf")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "tipo", required = false) String tipo,
            @RequestParam(value = "origem", required = false) String origem,
            @RequestParam(value = "destino", required = false) String destino,
            @RequestParam(value = "DATE", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(value = "DATE", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        try {
            com.z7design.fleet_manager.model.RemanejamentoTipo tipoEnum = null;
            if (tipo != null && !tipo.isEmpty() && !"all".equals(tipo)) {
                try {
                    tipoEnum = com.z7design.fleet_manager.model.RemanejamentoTipo.valueOf(tipo);
                } catch (IllegalArgumentException e) {
                    // Tipo invÃ¡lido, ignorar
                }
            }

            byte[] pdfBytes = remanejamentoService.generatePDFReport(employeeId, tipoEnum, origem, destino, startDate, endDate);
            String fileName = "relatorio-remanejamentos-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ObtÃ©m o usuÃ¡rio atualmente autenticado
     */
    private User getUsuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null; // Retorna null se nÃ£o houver usuÃ¡rio autenticado
    }
    
    /**
     * ObtÃ©m o endereÃ§o IP do cliente
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0];
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
} 
