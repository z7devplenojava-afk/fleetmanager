package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.dto.CreateAgentRequest;
import com.z7design.fleet_manager.dto.SupportAgentDTO;
import com.z7design.fleet_manager.model.enums.AgentStatus;
import com.z7design.fleet_manager.service.SupportAgentService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/support/agents")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@Slf4j
public class SupportAgentController {
    
    @Autowired
    private SupportAgentService agentService;
    
    /**
     * Listar todos os agentes
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SupportAgentDTO>> getAllAgents() {
        log.info("GET /api/v1/support/agents - Listando todos os agentes");
        List<SupportAgentDTO> agents = agentService.getAllAgents();
        return ResponseEntity.ok(agents);
    }
    
    /**
     * Listar agentes ativos
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SupportAgentDTO>> getActiveAgents() {
        log.info("GET /api/v1/support/agents/active - Listando agentes ativos");
        List<SupportAgentDTO> agents = agentService.getActiveAgents();
        return ResponseEntity.ok(agents);
    }
    
    /**
     * Buscar agente por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> getAgentById(@PathVariable("id") UUID id) {
        log.info("GET /api/v1/support/agents/{} - Buscando agente por ID", id);
        SupportAgentDTO agent = agentService.getAgentById(id);
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Buscar agente por ID do usuÃ¡rio
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> getAgentByUserId(@PathVariable("userId") UUID userId) {
        log.info("GET /api/v1/support/agents/user/{} - Buscando agente por ID do usuÃ¡rio", userId);
        SupportAgentDTO agent = agentService.getAgentByUserId(userId);
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Buscar agentes por status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SupportAgentDTO>> getAgentsByStatus(@PathVariable("status") AgentStatus status) {
        log.info("GET /api/v1/support/agents/status/{} - Buscando agentes por status", status);
        List<SupportAgentDTO> agents = agentService.getAgentsByStatus(status);
        return ResponseEntity.ok(agents);
    }
    
    /**
     * Buscar agente disponÃ­vel
     */
    @GetMapping("/available")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> getAvailableAgent() {
        log.info("GET /api/v1/support/agents/available - Buscando agente disponÃ­vel");
        SupportAgentDTO agent = agentService.getAvailableAgent();
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Criar novo agente
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPPORT_CREATE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> createAgent(@Valid @RequestBody CreateAgentRequest request) {
        log.info("POST /api/v1/support/agents - Criando novo agente");
        SupportAgentDTO agent = agentService.createAgent(request);
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Atualizar status do agente
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> updateAgentStatus(
            @PathVariable("id") UUID id, 
            @RequestParam(value = "status") AgentStatus status) {
        log.info("PUT /api/v1/support/agents/{}/status - Atualizando status para {}", id, status);
        SupportAgentDTO agent = agentService.updateAgentStatus(id, status);
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Atualizar departamento do agente
     */
    @PutMapping("/{id}/department")
    @PreAuthorize("hasAnyAuthority('SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> updateAgentDepartment(
            @PathVariable("id") UUID id, 
            @RequestParam(value = "department") String department) {
        log.info("PUT /api/v1/support/agents/{}/department - Atualizando departamento", id);
        SupportAgentDTO agent = agentService.updateAgentDepartment(id, department);
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Ativar/desativar agente
     */
    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyAuthority('SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportAgentDTO> toggleAgentActive(@PathVariable("id") UUID id) {
        log.info("PUT /api/v1/support/agents/{}/toggle-active - Alternando status ativo", id);
        SupportAgentDTO agent = agentService.toggleAgentActive(id);
        return ResponseEntity.ok(agent);
    }
    
    /**
     * Deletar agente
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_DELETE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteAgent(@PathVariable("id") UUID id) {
        log.info("DELETE /api/v1/support/agents/{} - Deletando agente", id);
        agentService.deleteAgent(id);
        return ResponseEntity.noContent().build();
    }
}


