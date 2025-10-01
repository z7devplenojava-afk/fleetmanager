package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.RemanejamentoService;

import br.com.fleetmanager.model.Remanejamento;
import br.com.fleetmanager.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/remanejamentos")
@Tag(name = "Remanejamentos", description = "Endpoints para gestão de remanejamentos de funcionários")
public class RemanejamentoController {
    @Autowired
    private RemanejamentoService remanejamentoService;

    @Operation(summary = "Cria um novo remanejamento",
               description = "Cria um novo registro de remanejamento e registra no histórico de auditoria.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Remanejamento criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PostMapping
    public ResponseEntity<Remanejamento> create(@RequestBody Remanejamento remanejamento, 
                                               HttpServletRequest request) {
        User usuarioAtual = getUsuarioAtual();
        String ipUsuario = getClientIpAddress(request);
        
        Remanejamento created = remanejamentoService.create(remanejamento, usuarioAtual, 
            "Criação via API - IP: " + ipUsuario);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Atualiza um remanejamento existente",
               description = "Atualiza um registro de remanejamento existente e registra no histórico de auditoria.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Remanejamento atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Remanejamento não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Remanejamento> update(@PathVariable UUID id, 
                                               @RequestBody Remanejamento remanejamento,
                                               HttpServletRequest request) {
        User usuarioAtual = getUsuarioAtual();
        String ipUsuario = getClientIpAddress(request);
        
        Remanejamento updated = remanejamentoService.update(id, remanejamento, usuarioAtual, 
            "Edição via API - IP: " + ipUsuario);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Exclui um remanejamento",
               description = "Exclui um registro de remanejamento e registra no histórico de auditoria.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Remanejamento excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Remanejamento não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, HttpServletRequest request) {
        User usuarioAtual = getUsuarioAtual();
        String ipUsuario = getClientIpAddress(request);
        
        remanejamentoService.delete(id, usuarioAtual, "Exclusão via API - IP: " + ipUsuario);
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
    public ResponseEntity<List<Remanejamento>> findAll() {
        return ResponseEntity.ok(remanejamentoService.findAll());
    }

    @Operation(summary = "Busca um remanejamento por ID",
               description = "Retorna um remanejamento específico pelo seu ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Remanejamento encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "404", description = "Remanejamento não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Remanejamento> findById(@PathVariable UUID id) {
        Optional<Remanejamento> remanejamento = remanejamentoService.findById(id);
        return remanejamento.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Busca remanejamentos por funcionário",
               description = "Retorna todos os remanejamentos de um funcionário específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de remanejamentos do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Remanejamento.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Remanejamento>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(remanejamentoService.findByEmployeeId(employeeId));
    }
    
    /**
     * Obtém o usuário atualmente autenticado
     */
    private User getUsuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null; // Retorna null se não houver usuário autenticado
    }
    
    /**
     * Obtém o endereço IP do cliente
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