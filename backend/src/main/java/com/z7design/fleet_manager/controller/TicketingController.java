package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Ticket;
import com.z7design.fleet_manager.service.TicketingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ticketing")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Venda de Passagens", description = "Endpoints para reserva e compra de passagens.")
@SecurityRequirement(name = "bearerAuth")
public class TicketingController {

    private final TicketingService ticketingService;

    @Operation(summary = "Lista todos os tickets de uma viagem (Manifesto)")
    @GetMapping("/trip/{tripId}/tickets")
    public ResponseEntity<java.util.List<Ticket>> getTickets(@PathVariable("tripId") UUID tripId) {
        return ResponseEntity.ok(ticketingService.getTicketsByTrip(tripId));
    }

    @Operation(summary = "Reserva um assento temporariamente")
    @PostMapping("/reserve")
    public ResponseEntity<Ticket> reserve(@RequestBody ReservationRequest request) {
        log.info("Reservando assento {} para viagem {}", request.getSeatNumber(), request.getTripId());
        return ResponseEntity.ok(ticketingService.reserveTicket(
                request.getTripId(),
                request.getSeatNumber(),
                request.getPassengerName(),
                request.getPassengerDoc(),
                request.getUserId()));
    }

    @Operation(summary = "Confirma a compra da passagem")
    @PostMapping("/confirm/{ticketId}")
    public ResponseEntity<Ticket> confirm(
            @PathVariable("ticketId") UUID ticketId,
            @RequestParam(name = "paymentMethod") String paymentMethod,
            @RequestParam(name = "paymentId") String paymentId) {
        return ResponseEntity.ok(ticketingService.confirmPurchase(ticketId, paymentMethod, paymentId));
    }

    @Data
    public static class ReservationRequest {
        private UUID tripId;
        private String seatNumber;
        private String passengerName;
        private String passengerDoc;
        private String userId;
    }
}
