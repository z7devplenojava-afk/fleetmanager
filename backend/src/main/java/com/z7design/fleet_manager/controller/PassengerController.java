package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.PassengerDTO;
import com.z7design.fleet_manager.model.DriverShift;
import com.z7design.fleet_manager.model.Passenger;
import com.z7design.fleet_manager.model.Route;
import com.z7design.fleet_manager.model.RouteExecution;
import com.z7design.fleet_manager.model.RouteExecutionStatus;
import com.z7design.fleet_manager.model.RoutePoint;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.DriverShiftRepository;
import com.z7design.fleet_manager.repository.PassengerRepository;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.PassengerService;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.UUID;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.Collections;

@RestController
@RequestMapping("/api/passengers")
@RequiredArgsConstructor
@Tag(name = "Passageiros", description = "Endpoints para gestão de passageiros")
public class PassengerController {

    private final PassengerService passengerService;
    private final PassengerRepository passengerRepository;
    private final DriverShiftRepository driverShiftRepository;
    private final AuthenticationService authenticationService;

    @GetMapping("/me/route-tracking")
    @Transactional(readOnly = true)
    @Operation(summary = "Acompanhar rota autorizada", description = "Retorna somente a rota do passageiro autenticado e a posição do veículo em execução")
    public ResponseEntity<?> getMyRouteTracking(
            Authentication authentication,
            @RequestParam(value = "direction", defaultValue = "IDA") String direction) {
        User user;
        try {
            user = authenticationService.getCurrentUser(authentication);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
        if (user == null) return ResponseEntity.status(401).build();

        Passenger passenger = passengerRepository.findByUserId(user.getId()).orElse(null);
        if (passenger == null || !Boolean.TRUE.equals(passenger.getActive())) {
            return ResponseEntity.ok(PassengerRouteTracking.unassigned(direction));
        }

        boolean returning = "RETORNO".equalsIgnoreCase(direction);
        Route route = returning && passenger.getReturnRoute() != null
                ? passenger.getReturnRoute() : passenger.getRoute();
        RoutePoint boardingPoint = returning && passenger.getReturnBoardingPoint() != null
                ? passenger.getReturnBoardingPoint() : passenger.getBoardingPoint();
        if (route == null) return ResponseEntity.ok(PassengerRouteTracking.unassigned(direction));

        List<RouteTrackingPoint> points = route.getPoints() == null ? Collections.emptyList()
                : route.getPoints().stream()
                        .sorted(Comparator.comparing(RoutePoint::getOrder, Comparator.nullsLast(Integer::compareTo)))
                        .map(point -> new RouteTrackingPoint(point.getId(), point.getName(), point.getLatitude(),
                                point.getLongitude(), point.getType() != null ? point.getType().name() : "BOARDING",
                                point.getOrder()))
                        .toList();

        DriverShift activeShift = driverShiftRepository.findByShiftDate(LocalDate.now(ZoneId.of("America/Sao_Paulo"))).stream()
                .filter(shift -> shift.getStatus() == DriverShift.DriverShiftStatus.IN_PROGRESS)
                .filter(shift -> shift.getRouteExecutions() != null && shift.getRouteExecutions().stream().anyMatch(execution ->
                        execution.getRoute() != null && route.getId().equals(execution.getRoute().getId())
                                && (execution.getStatus() == RouteExecutionStatus.IN_PROGRESS
                                    || execution.getStatus() == RouteExecutionStatus.DELAYED)))
                .max(Comparator.comparing(DriverShift::getUpdatedAt, Comparator.nullsFirst(LocalDateTime::compareTo)))
                .orElse(null);

        RouteExecution activeExecution = activeShift == null ? null : activeShift.getRouteExecutions().stream()
                .filter(execution -> execution.getRoute() != null && route.getId().equals(execution.getRoute().getId()))
                .filter(execution -> execution.getStatus() == RouteExecutionStatus.IN_PROGRESS
                        || execution.getStatus() == RouteExecutionStatus.DELAYED)
                .findFirst().orElse(null);
        var vehicle = activeExecution != null && activeExecution.getVehicle() != null
                ? activeExecution.getVehicle() : activeShift != null ? activeShift.getVehicle() : null;
        var driver = activeExecution != null && activeExecution.getDriver() != null
                ? activeExecution.getDriver() : activeShift != null ? activeShift.getDriver() : null;
        LocalTime scheduledStart = activeExecution != null ? activeExecution.getPlannedStartTime() : null;

        return ResponseEntity.ok(new PassengerRouteTracking(true, direction.toUpperCase(), route.getId(), route.getName(),
                route.getColor(), points,
                boardingPoint != null ? new RouteTrackingPoint(boardingPoint.getId(), boardingPoint.getName(),
                        boardingPoint.getLatitude(), boardingPoint.getLongitude(),
                        boardingPoint.getType() != null ? boardingPoint.getType().name() : "BOARDING", boardingPoint.getOrder()) : null,
                vehicle != null ? vehicle.getPlate() : null,
                driver != null ? driver.getName() : null,
                activeShift != null ? activeShift.getCurrentLatitude() : null,
                activeShift != null ? activeShift.getCurrentLongitude() : null,
                activeShift != null ? activeShift.getUpdatedAt() : null,
                activeExecution != null ? activeExecution.getStatus().name() : "SCHEDULED",
                scheduledStart));
    }

    public record RouteTrackingPoint(UUID id, String name, Double latitude, Double longitude, String type, Integer order) {}

    public record PassengerRouteTracking(boolean assigned, String direction, UUID routeId, String routeName,
            String color, List<RouteTrackingPoint> points, RouteTrackingPoint boardingPoint,
            String vehiclePlate, String driverName, Double vehicleLatitude, Double vehicleLongitude,
            LocalDateTime locationUpdatedAt, String executionStatus, LocalTime plannedStartTime) {
        static PassengerRouteTracking unassigned(String direction) {
            return new PassengerRouteTracking(false, direction, null, null, null, Collections.emptyList(),
                    null, null, null, null, null, null, null, null);
        }
    }

    @GetMapping
    @Operation(summary = "Listar todos os passageiros", description = "Retorna todos os passageiros")
    public ResponseEntity<List<PassengerDTO>> getAll() {
        List<PassengerDTO> passengers = passengerService.getAll();
        return ResponseEntity.ok(passengers);
    }

    @PostMapping
    @Operation(summary = "Criar passageiro", description = "Cria um novo passageiro")
    public ResponseEntity<PassengerDTO> create(@RequestBody PassengerDTO dto) {
        PassengerDTO created = passengerService.create(dto);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/company/{companyId}")
    @Operation(summary = "Listar passageiros por empresa", description = "Retorna todos os passageiros de uma empresa")
    public ResponseEntity<List<PassengerDTO>> getByCompanyId(@PathVariable("companyId") UUID companyId) {
        List<PassengerDTO> passengers = passengerService.getByCompanyId(companyId);
        return ResponseEntity.ok(passengers);
    }

    @GetMapping("/company/{companyId}/active")
    @Operation(summary = "Listar passageiros ativos por empresa", description = "Retorna todos os passageiros ativos de uma empresa")
    public ResponseEntity<List<PassengerDTO>> getActiveByCompanyId(@PathVariable("companyId") UUID companyId) {
        List<PassengerDTO> passengers = passengerService.getActiveByCompanyId(companyId);
        return ResponseEntity.ok(passengers);
    }

        @GetMapping("/route/{routeId}")
    @Operation(summary = "Listar passageiros por rota", description = "Retorna todos os passageiros de uma rota")
    public ResponseEntity<List<PassengerDTO>> getByRouteId(
            @PathVariable("routeId") UUID routeId,
            @RequestParam(value = "direction", required = false) String direction) {
        List<PassengerDTO> passengers = passengerService.getByRouteIdAndDirection(routeId, direction);
        return ResponseEntity.ok(passengers);
    }

    @GetMapping("/client/{clientId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Listar passageiros por cliente", description = "Retorna todos os colaboradores/passageiros de um cliente contratante")
    public ResponseEntity<List<PassengerDTO>> getByClientId(@PathVariable("clientId") String clientIdStr) {
        try {
            UUID clientId = UUID.fromString(clientIdStr);
            List<PassengerDTO> passengers = passengerService.getByClientId(clientId);
            return ResponseEntity.ok(passengers != null ? passengers : java.util.Collections.emptyList());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @PostMapping("/assign-route")
    @Operation(summary = "Atribuir colaboradores a uma rota", description = "Vincula em lote os colaboradores selecionados à rota (ida e/ou retorno)")
    public ResponseEntity<Map<String, Object>> assignPassengersToRoute(@RequestBody Map<String, Object> payload) {
        UUID routeId = UUID.fromString((String) payload.get("routeId"));
        List<?> rawIds = (List<?>) payload.get("passengerIds");
        List<UUID> passengerIds = new ArrayList<>();
        if (rawIds != null) {
            for (Object obj : rawIds) {
                passengerIds.add(UUID.fromString(obj.toString()));
            }
        }
        String direction = (String) payload.get("direction");
        Boolean returnSame = payload.get("returnSame") != null ? Boolean.parseBoolean(payload.get("returnSame").toString()) : true;
        int count = passengerService.assignPassengersToRoute(routeId, passengerIds, direction, returnSame);
        return ResponseEntity.ok(Map.of("success", true, "assignedCount", count));
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Buscar passageiro por ID", description = "Retorna um passageiro pelo ID")
    public ResponseEntity<PassengerDTO> getById(@PathVariable("id") UUID id) {
        PassengerDTO passenger = passengerService.getById(id);
        return ResponseEntity.ok(passenger);
    }

    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Atualizar passageiro", description = "Atualiza um passageiro existente")
    public ResponseEntity<PassengerDTO> update(@PathVariable("id") UUID id, @RequestBody PassengerDTO dto) {
        PassengerDTO updated = passengerService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Excluir passageiro", description = "Exclui um passageiro")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        passengerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id:[0-9a-fA-F\\-]{36}}/toggle-multiple-routes")
    @Operation(summary = "Habilitar/Desabilitar múltiplas linhas", description = "Permite alternar entre linha fixa (1 ida e 1 volta) ou múltiplas linhas")
    public ResponseEntity<PassengerDTO> toggleMultipleRoutes(
            @PathVariable("id") UUID id,
            @RequestParam("allowed") boolean allowed) {
        PassengerDTO updated = passengerService.toggleMultipleRoutes(id, allowed);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id:[0-9a-fA-F\\-]{36}}/status")
    @Operation(summary = "Alterar status do passageiro", description = "Atualiza o status (ATIVO, BLOQUEADO, DEMITIDO). Demitido bloqueia login e embarque imediatamente.")
    public ResponseEntity<PassengerDTO> updateStatus(
            @PathVariable("id") UUID id,
            @RequestParam("status") String status) {
        PassengerDTO dto = PassengerDTO.builder().status(status).build();
        PassengerDTO updated = passengerService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id:[0-9a-fA-F\\-]{36}}/reset-password")
    @Operation(summary = "Resetar senha do passageiro", description = "Redefine a senha do colaborador/passageiro e permite notificar via WhatsApp ou E-mail")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("newPassword");
        String notifyVia = payload.getOrDefault("notifyVia", "NONE");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "A senha deve ter no mínimo 6 caracteres."));
        }
        Map<String, Object> result = passengerService.resetPassword(id, newPassword, notifyVia);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id:[0-9a-fA-F\\-]{36}}/toggle-2fa")
    @Operation(summary = "Habilitar/desabilitar 2FA do passageiro", description = "Ativa ou desativa autenticação de dois fatores e envia código de verificação")
    public ResponseEntity<Map<String, Object>> toggleTwoFactor(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, Object> payload) {
        boolean enabled = payload.get("enabled") != null ? Boolean.parseBoolean(payload.get("enabled").toString()) : true;
        String channel = (String) payload.getOrDefault("channel", "WHATSAPP");
        boolean sendCode = payload.get("sendCode") != null ? Boolean.parseBoolean(payload.get("sendCode").toString()) : false;
        Map<String, Object> result = passengerService.toggleTwoFactor(id, enabled, channel, sendCode);
        return ResponseEntity.ok(result);
    }
}
