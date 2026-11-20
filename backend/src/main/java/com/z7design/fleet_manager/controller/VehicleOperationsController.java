package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleHistoryEvent;
import com.z7design.fleet_manager.repository.VehicleHistoryEventRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicle-operations")
@RequiredArgsConstructor
public class VehicleOperationsController {
    private final VehicleRepository vehicles;
    private final VehicleHistoryEventRepository events;

    @GetMapping("/{vehicleId}/history")
    public List<VehicleHistoryEvent> history(@PathVariable UUID vehicleId) {
        return events.findByVehicleIdOrderByEventDateDesc(vehicleId);
    }

    @PostMapping("/{vehicleId}/events")
    public ResponseEntity<?> addEvent(@PathVariable UUID vehicleId, @RequestBody EventRequest request) {
        Vehicle vehicle = vehicles.findById(vehicleId).orElse(null);
        if (vehicle == null) return ResponseEntity.notFound().build();
        VehicleHistoryEvent event = new VehicleHistoryEvent();
        event.setVehicleId(vehicleId);
        event.setVehiclePlate(vehicle.getPlate());
        event.setEventDate(LocalDateTime.now());
        event.setEventType(request.eventType());
        event.setDescription(request.description());
        event.setResponsibleName(request.responsibleName());
        events.save(event);
        return ResponseEntity.ok(Map.of("recorded", true));
    }

    @PostMapping("/{vehicleId}/movements")
    @Transactional
    public ResponseEntity<?> move(@PathVariable UUID vehicleId, @RequestBody MovementRequest request) {
        Vehicle vehicle = vehicles.findById(vehicleId).orElse(null);
        if (vehicle == null) return ResponseEntity.notFound().build();
        String oldClient = vehicle.getClientName();
        String oldLocation = vehicle.getLocation();
        String oldDriver = vehicle.getAssignedDriver();
        vehicle.setClientId(request.destinationClientId());
        vehicle.setClientName(request.destinationClientName());
        vehicle.setLocation(request.destinationLocation());
        if (request.destinationProjectName() != null && !request.destinationProjectName().isBlank()) {
            vehicle.setProjectName(request.destinationProjectName().trim());
        }
        if (request.status() != null && !request.status().isBlank()) {
            vehicle.setStatus(Vehicle.VehicleStatus.valueOf(request.status()));
        }
        if (request.driverName() != null && !request.driverName().isBlank()) vehicle.setAssignedDriver(request.driverName());
        vehicles.save(vehicle);
        VehicleHistoryEvent event = new VehicleHistoryEvent();
        event.setVehicleId(vehicleId);
        event.setVehiclePlate(vehicle.getPlate());
        event.setEventDate(LocalDateTime.now());
        boolean clientChanged = !java.util.Objects.equals(oldClient, request.destinationClientName());
        boolean driverChanged = request.driverName() != null && !request.driverName().isBlank()
                && !java.util.Objects.equals(oldDriver, request.driverName());
        event.setEventType(driverChanged && !clientChanged ? "ALTERACAO_MOTORISTA" : "TRANSFERENCIA");
        StringBuilder description = new StringBuilder("Movimentação operacional");
        if (clientChanged) description.append(": Cliente ").append(oldClient == null ? "Sem cliente" : oldClient)
                .append(" → ").append(request.destinationClientName());
        if (request.destinationProjectName() != null && !request.destinationProjectName().isBlank()) {
            description.append("; Obra/Setor: ").append(request.destinationProjectName().trim());
        }
        if (!java.util.Objects.equals(oldLocation, request.destinationLocation())) {
            description.append("; Local ").append(oldLocation == null ? "não informado" : oldLocation)
                    .append(" → ").append(request.destinationLocation());
        }
        if (driverChanged) description.append("; Motorista ").append(oldDriver == null || oldDriver.isBlank() ? "não atribuído" : oldDriver)
                .append(" → ").append(request.driverName());
        if (request.reason() != null && !request.reason().isBlank()) description.append(". ").append(request.reason());
        event.setDescription(description.toString());
        event.setResponsibleName(request.responsibleName());
        event.setRelatedEntityType(driverChanged && !clientChanged ? "DRIVER_ASSIGNMENT" : "VEHICLE_MOVEMENT");
        events.save(event);
        return ResponseEntity.ok(Map.of("recorded", true));
    }

    @PostMapping("/driver-assignments")
    @Transactional
    public ResponseEntity<?> assignDriver(@RequestBody DriverAssignmentRequest request) {
        if (request.driverName() == null || request.driverName().isBlank() || request.targetVehicleId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Motorista e veículo de destino são obrigatórios."));
        }
        Vehicle target = vehicles.findById(request.targetVehicleId()).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        Vehicle source = request.sourceVehicleId() == null || request.sourceVehicleId().equals(request.targetVehicleId())
                ? null : vehicles.findById(request.sourceVehicleId()).orElse(null);
        if (request.sourceVehicleId() != null && !request.sourceVehicleId().equals(request.targetVehicleId()) && source == null) {
            return ResponseEntity.notFound().build();
        }

        String replacedDriver = target.getAssignedDriver();
        if (source != null && request.driverName().equalsIgnoreCase(source.getAssignedDriver() == null ? "" : source.getAssignedDriver().trim())) {
            source.setAssignedDriver(null);
            vehicles.save(source);
            saveDriverEvent(source, "Motorista " + request.driverName() + " transferido para o veículo " + target.getPlate() + ".", request.responsibleName());
        }

        target.setAssignedDriver(request.driverName().trim());
        vehicles.save(target);
        String description = "Motorista " + request.driverName().trim() + " atribuído ao veículo " + target.getPlate() + ".";
        if (replacedDriver != null && !replacedDriver.isBlank() && !replacedDriver.equalsIgnoreCase(request.driverName().trim())) {
            description += " Motorista substituído: " + replacedDriver + ".";
        }
        saveDriverEvent(target, description, request.responsibleName());
        return ResponseEntity.ok(Map.of("recorded", true));
    }

    private void saveDriverEvent(Vehicle vehicle, String description, String responsibleName) {
        VehicleHistoryEvent event = new VehicleHistoryEvent();
        event.setVehicleId(vehicle.getId());
        event.setVehiclePlate(vehicle.getPlate());
        event.setEventDate(LocalDateTime.now());
        event.setEventType("ALTERACAO_MOTORISTA");
        event.setDescription(description);
        event.setResponsibleName(responsibleName);
        event.setRelatedEntityType("DRIVER_ASSIGNMENT");
        events.save(event);
    }

    public record MovementRequest(UUID destinationClientId, String destinationClientName, String destinationLocation,
                                  String destinationProjectName,
                                  String status, String driverName, String reason, String responsibleName) {}
    public record DriverAssignmentRequest(UUID sourceVehicleId, UUID targetVehicleId, String driverName, String responsibleName) {}
    public record EventRequest(String eventType, String description, String responsibleName) {}
}
