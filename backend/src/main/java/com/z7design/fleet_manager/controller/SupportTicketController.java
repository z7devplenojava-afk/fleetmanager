package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.dto.AddTicketMessageRequest;
import com.z7design.fleet_manager.dto.CreateTicketRequest;
import com.z7design.fleet_manager.dto.SupportTicketDTO;
import com.z7design.fleet_manager.dto.TicketMessageDTO;
import com.z7design.fleet_manager.dto.UpdateTicketRequest;
import com.z7design.fleet_manager.model.enums.TicketCategory;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketStatus;
import com.z7design.fleet_manager.service.SupportTicketService;
import com.z7design.fleet_manager.service.SupportTicketService.TicketMetrics;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/support/tickets")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@Slf4j
public class SupportTicketController {
    
    @Autowired
    private SupportTicketService ticketService;
    
    /**
     * Listar todos os tickets (paginado)
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<SupportTicketDTO>> getAllTickets(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") Sort.Direction direction) {
        
        log.info("GET /api/v1/support/tickets - Listando tickets (pÃ¡gina {}, tamanho {})", page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<SupportTicketDTO> tickets = ticketService.getAllTickets(pageable);
        
        return ResponseEntity.ok(tickets);
    }
    
    /**
     * Buscar ticket por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportTicketDTO> getTicketById(@PathVariable("id") UUID id) {
        log.info("GET /api/v1/support/tickets/{} - Buscando ticket por ID", id);
        SupportTicketDTO ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }
    
    /**
     * Buscar tickets por status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<SupportTicketDTO>> getTicketsByStatus(
            @PathVariable("status") TicketStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        log.info("GET /api/v1/support/tickets/status/{} - Buscando tickets por status", status);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicketDTO> tickets = ticketService.getTicketsByStatus(status, pageable);
        
        return ResponseEntity.ok(tickets);
    }
    
    /**
     * Buscar tickets por agente
     */
    @GetMapping("/agent/{agentId}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<SupportTicketDTO>> getTicketsByAgent(
            @PathVariable("agentId") UUID agentId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        log.info("GET /api/v1/support/tickets/agent/{} - Buscando tickets por agente", agentId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicketDTO> tickets = ticketService.getTicketsByAgent(agentId, pageable);
        
        return ResponseEntity.ok(tickets);
    }
    
    /**
     * Buscar tickets com filtros
     */
    @GetMapping("/filter")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<SupportTicketDTO>> getTicketsWithFilters(
            @RequestParam(value = "status", required = false) TicketStatus status,
            @RequestParam(value = "priority", required = false) TicketPriority priority,
            @RequestParam(value = "category", required = false) TicketCategory category,
            @RequestParam(value = "agentId", required = false) UUID agentId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        log.info("GET /api/v1/support/tickets/filter - Buscando tickets com filtros");
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicketDTO> tickets = ticketService.getTicketsWithFilters(
            status, priority, category, agentId, pageable
        );
        
        return ResponseEntity.ok(tickets);
    }
    
    /**
     * Buscar tickets por texto
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Page<SupportTicketDTO>> searchTickets(
            @RequestParam(value = "q") String q,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        log.info("GET /api/v1/support/tickets/search?q={} - Buscando tickets", q);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicketDTO> tickets = ticketService.searchTickets(q, pageable);
        
        return ResponseEntity.ok(tickets);
    }
    
    /**
     * Criar novo ticket
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPPORT_CREATE', 'SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportTicketDTO> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        log.info("POST /api/v1/support/tickets - Criando novo ticket: {}", request.getTitle());
        SupportTicketDTO ticket = ticketService.createTicket(request);
        return ResponseEntity.ok(ticket);
    }
    
    /**
     * Atualizar ticket
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportTicketDTO> updateTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateTicketRequest request) {
        log.info("PUT /api/v1/support/tickets/{} - Atualizando ticket", id);
        SupportTicketDTO ticket = ticketService.updateTicket(id, request);
        return ResponseEntity.ok(ticket);
    }
    
    /**
     * Atribuir ticket a um agente
     */
    @PutMapping("/{id}/assign/{agentId}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SupportTicketDTO> assignTicketToAgent(
            @PathVariable("id") UUID id,
            @PathVariable("agentId") UUID agentId) {
        log.info("PUT /api/v1/support/tickets/{}/assign/{} - Atribuindo ticket ao agente", id, agentId);
        SupportTicketDTO ticket = ticketService.assignTicketToAgent(id, agentId);
        return ResponseEntity.ok(ticket);
    }
    
    /**
     * Adicionar mensagem ao ticket
     */
    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyAuthority('SUPPORT_WRITE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TicketMessageDTO> addMessageToTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AddTicketMessageRequest request,
            Authentication authentication) {
        
        log.info("POST /api/v1/support/tickets/{}/messages - Adicionando mensagem ao ticket", id);
        
        // TODO: Buscar agentId do usuÃ¡rio logado se for do suporte
        UUID agentId = null;
        
        TicketMessageDTO message = ticketService.addMessageToTicket(id, request, agentId);
        return ResponseEntity.ok(message);
    }
    
    /**
     * Buscar mensagens de um ticket
     */
    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TicketMessageDTO>> getTicketMessages(@PathVariable("id") UUID id) {
        log.info("GET /api/v1/support/tickets/{}/messages - Buscando mensagens do ticket", id);
        List<TicketMessageDTO> messages = ticketService.getTicketMessages(id);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Deletar ticket
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_DELETE', 'SUPPORT_MANAGE', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTicket(@PathVariable("id") UUID id) {
        log.info("DELETE /api/v1/support/tickets/{} - Deletando ticket", id);
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Obter mÃ©tricas de atendimento
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TicketMetrics> getTicketMetrics() {
        log.info("GET /api/v1/support/tickets/metrics - Obtendo mÃ©tricas de atendimento");
        TicketMetrics metrics = ticketService.getTicketMetrics();
        return ResponseEntity.ok(metrics);
    }
}


