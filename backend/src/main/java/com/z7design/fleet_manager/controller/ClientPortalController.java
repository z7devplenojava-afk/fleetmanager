package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.client.*;
import com.z7design.fleet_manager.model.ClientServiceRequest;
import com.z7design.fleet_manager.model.SupportTicket;
import com.z7design.fleet_manager.model.TicketMessage;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.ClientPortalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/client-portal")
@RequiredArgsConstructor
@Tag(name = "Portal do Cliente", description = "Endpoints de autoatendimento, interação e solicitações do cliente")
@SecurityRequirement(name = "bearerAuth")
public class ClientPortalController {

    private final ClientPortalService clientPortalService;

    @GetMapping("/dashboard")
    @Operation(summary = "Obter dados gerais e KPIs do Portal do Cliente")
    public ResponseEntity<ClientPortalDashboardDTO> getDashboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.getDashboard(user));
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Listar frota e motoristas vinculados ao contrato do cliente")
    public ResponseEntity<List<ClientPortalDashboardDTO.VehicleSummaryDTO>> getVehicles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.getClientVehicles(user));
    }

    @PostMapping("/requests/reserve-vehicle")
    @Operation(summary = "Solicitar Veículo Reserva (com verificação contratual e notificação para Operacional e Manutenção)")
    public ResponseEntity<ClientServiceRequest> requestReserveVehicle(
            @Valid @RequestBody ReserveVehicleRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.requestReserveVehicle(request, user));
    }

    @PostMapping("/requests/extra-trip")
    @Operation(summary = "Solicitar Viagem Extra ou Serviço Eventual")
    public ResponseEntity<ClientServiceRequest> requestExtraTrip(
            @Valid @RequestBody ExtraTripRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.requestExtraTrip(request, user));
    }

    @GetMapping("/requests")
    @Operation(summary = "Listar histórico de solicitações de veículos reserva e viagens extras")
    public ResponseEntity<List<ClientServiceRequest>> getRequests(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.getClientRequests(user));
    }

    @GetMapping("/tickets")
    @Operation(summary = "Listar chamados de suporte abertos pelo cliente")
    public ResponseEntity<List<SupportTicket>> getTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.getClientTickets(user));
    }

    @PostMapping("/tickets")
    @Operation(summary = "Abrir novo chamado de suporte pelo cliente")
    public ResponseEntity<SupportTicket> createTicket(
            @Valid @RequestBody ClientTicketCreateDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(clientPortalService.createTicket(request, user));
    }

    @PostMapping("/tickets/{ticketId}/messages")
    @Operation(summary = "Enviar mensagem/resposta em um chamado de suporte")
    public ResponseEntity<TicketMessage> addMessage(
            @PathVariable("ticketId") UUID ticketId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String messageText = body.get("message");
        if (messageText == null || messageText.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(clientPortalService.addTicketMessage(ticketId, messageText, user));
    }
}
