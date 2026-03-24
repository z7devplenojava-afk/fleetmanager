package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.RegularTrip;
import com.z7design.fleet_manager.service.RegularTripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/regular-trips")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Viagens Regulares", description = "Gestão de viagens para venda de passagens individuais.")
@SecurityRequirement(name = "bearerAuth")
public class RegularTripController {

    private final RegularTripService regularTripService;

    @Operation(summary = "Busca viagens por rota e data")
    @GetMapping("/search")
    public ResponseEntity<List<RegularTrip>> searchTrips(
            @RequestParam(name = "routeId") UUID routeId,
            @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date) {
        return ResponseEntity.ok(regularTripService.findTrips(routeId, date));
    }

    @Operation(summary = "Retorna assentos ocupados de uma viagem")
    @GetMapping("/{id}/occupied-seats")
    public ResponseEntity<List<String>> getOccupiedSeats(@PathVariable UUID id) {
        return ResponseEntity.ok(regularTripService.getOccupiedSeats(id));
    }

    @Operation(summary = "Cria uma nova viagem regular")
    @PostMapping
    public ResponseEntity<RegularTrip> create(@RequestBody RegularTrip trip) {
        return ResponseEntity.ok(regularTripService.createTrip(trip));
    }
}
