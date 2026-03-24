package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleDTO;
import com.z7design.fleet_manager.dto.mechanic.MechanicKanbanColumnDTO;
import com.z7design.fleet_manager.dto.mechanic.MechanicTaskDTO;
import com.z7design.fleet_manager.dto.mechanic.VehicleHealthDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MechanicDashboardService {

        private final FleetWorkOrderRepository workOrderRepository;
        private final VehicleGateChecklistRepository gateChecklistRepository;
        private final OperationalOccurrenceRepository occurrenceRepository;
        private final VehicleRepository vehicleRepository;

        @Transactional(readOnly = true)
        public List<MechanicKanbanColumnDTO> getKanbanBoard() {
                List<MechanicKanbanColumnDTO> board = new ArrayList<>();

                // 1. Column: GATE ALERTS (Alerts to be triaged)
                List<MechanicTaskDTO> alerts = new ArrayList<>();

                // Gate Checklists with problems
                // In a real scenario, we should filter by "not resolved" or recent.
                // For MVP, taking last 50 checklists with problems that haven't been converted
                // to OS?
                // For now, let's just fetch recent ones with reports.
                List<VehicleGateChecklist> gateProblems = gateChecklistRepository.findAll().stream()
                                .filter(c -> c.getDriverProblemReport() != null
                                                && !c.getDriverProblemReport().isEmpty())
                                .limit(20) // Limit for performance
                                .collect(Collectors.toList());

                for (VehicleGateChecklist checklist : gateProblems) {
                        alerts.add(MechanicTaskDTO.builder()
                                        .id(checklist.getId())
                                        .type("ALERT")
                                        .title("Relato de Problema (Portaria)")
                                        .description(checklist.getDriverProblemReport())
                                        .vehiclePlate(checklist.getVehicle().getPlate())
                                        .vehicleFleetNumber(checklist.getVehicle().getFleetNumber())
                                        .vehicleBrand(checklist.getVehicle().getBrand())
                                        .vehicleModel(checklist.getVehicle().getModel())
                                        .vehicleId(checklist.getVehicle().getId())
                                        .priority("HIGH")
                                        .status("ALERT")
                                        .createdAt(checklist.getOccurredAt())
                                        .build());
                }

                // Operational Occurrences (Maintenance type, Pending)
                List<OperationalOccurrence> occurrences = occurrenceRepository.findAll().stream()
                                .filter(o -> o.getType() == OperationalOccurrence.OccurrenceType.MANUTENCAO
                                                && o.getStatus() == OperationalOccurrence.OccurrenceStatus.PENDENTE)
                                .collect(Collectors.toList());

                for (OperationalOccurrence occ : occurrences) {
                        // Occurrence might not have vehicle directly linked in this model version if it
                        // uses Employee,
                        // but usually Maintenance occurrences should link to an asset.
                        // Checking OperationalOccurrence model, it lacks direct Vehicle link in the
                        // snippet shown earlier?
                        // It links to 'Employee'. If strictly following model, we might skip vehicle
                        // info or infer from description.
                        // For safety, leaving vehicle blank if not linkable.
                        alerts.add(MechanicTaskDTO.builder()
                                        .id(occ.getId())
                                        .type("ALERT")
                                        .title(occ.getTitle())
                                        .description(occ.getDescription())
                                        .priority("HIGH")
                                        .status("ALERT")
                                        .createdAt(occ.getDate())
                                        .build());
                }

                board.add(MechanicKanbanColumnDTO.builder()
                                .id("alerts")
                                .title("🚨 Alertas & Pátio")
                                .tasks(alerts)
                                .build());

                // 2. Work Orders (Grouped by Status)
                List<FleetWorkOrder> allWorkOrders = workOrderRepository.findAll();

                // TO DO
                List<MechanicTaskDTO> todoTasks = allWorkOrders.stream()
                                .filter(wo -> wo.getStatus() == FleetWorkOrder.WorkOrderStatus.DRAFT
                                                || wo.getStatus() == FleetWorkOrder.WorkOrderStatus.PENDING_APPROVAL)
                                .map(this::mapToTaskDTO)
                                .collect(Collectors.toList());

                board.add(MechanicKanbanColumnDTO.builder().id("todo").title("📅 A Fazer").tasks(todoTasks).build());

                // IN PROGRESS
                List<MechanicTaskDTO> progressTasks = allWorkOrders.stream()
                                .filter(wo -> wo.getStatus() == FleetWorkOrder.WorkOrderStatus.IN_PROGRESS
                                                || wo.getStatus() == FleetWorkOrder.WorkOrderStatus.APPROVED)
                                .map(this::mapToTaskDTO)
                                .collect(Collectors.toList());

                board.add(MechanicKanbanColumnDTO.builder().id("doing").title("🔨 Em Andamento").tasks(progressTasks)
                                .build());

                // DONE
                List<MechanicTaskDTO> doneTasks = allWorkOrders.stream()
                                .filter(wo -> wo.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED)
                                .limit(20) // Show only recent
                                .map(this::mapToTaskDTO)
                                .collect(Collectors.toList());

                board.add(MechanicKanbanColumnDTO.builder().id("done").title("✅ Finalizado").tasks(doneTasks).build());

                return board;
        }

        @Transactional(readOnly = true)
        public VehicleHealthDTO getVehicleHealth(UUID vehicleId) {
                Vehicle vehicle = vehicleRepository.findById(vehicleId)
                                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

                // Map Vehicle to DTO (Basic)
                VehicleDTO vehicleDTO = new VehicleDTO();
                vehicleDTO.setId(vehicle.getId());
                vehicleDTO.setBrand(vehicle.getBrand());
                vehicleDTO.setModel(vehicle.getModel());
                vehicleDTO.setPlate(vehicle.getPlate());
                vehicleDTO.setFleetNumber(vehicle.getFleetNumber());

                // Alerts
                // Re-using logic filtering for this vehicle
                List<MechanicTaskDTO> activeAlerts = gateChecklistRepository.findAll().stream()
                                .filter(c -> c.getVehicle().getId().equals(vehicleId)
                                                && c.getDriverProblemReport() != null
                                                && !c.getDriverProblemReport().isEmpty())
                                .map(c -> MechanicTaskDTO.builder()
                                                .id(c.getId())
                                                .type("ALERT")
                                                .title("Problema Relatado")
                                                .description(c.getDriverProblemReport())
                                                .priority("HIGH")
                                                .createdAt(c.getOccurredAt())
                                                .build())
                                .collect(Collectors.toList());

                // Work Orders (Recent)
                List<MechanicTaskDTO> recentWO = workOrderRepository.findAll().stream()
                                .filter(wo -> wo.getVehicle().getId().equals(vehicleId))
                                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                                .limit(5)
                                .map(this::mapToTaskDTO)
                                .collect(Collectors.toList());

                return VehicleHealthDTO.builder()
                                .vehicle(vehicleDTO)
                                .activeAlerts(activeAlerts)
                                .recentWorkOrders(recentWO)
                                .healthStatus(activeAlerts.isEmpty() ? "OK" : "WARNING")
                                .lastMileage(null) // Fetch from MileageRecord if needed
                                .build();
        }

        private MechanicTaskDTO mapToTaskDTO(FleetWorkOrder wo) {
                return MechanicTaskDTO.builder()
                                .id(wo.getId())
                                .type("WORK_ORDER")
                                .title("OS #" + (wo.getId().toString().substring(0, 8))) // Ideally use a real
                                                                                         // sequential number if
                                                                                         // available
                                .description(wo.getNotes()) // Or description field if added
                                .vehiclePlate(wo.getVehicle().getPlate())
                                .vehicleFleetNumber(wo.getVehicle().getFleetNumber())
                                .vehicleBrand(wo.getVehicle().getBrand())
                                .vehicleModel(wo.getVehicle().getModel())
                                .vehicleId(wo.getVehicle().getId())
                                .priority(wo.getPriority().name())
                                .status(wo.getStatus().name())
                                .createdAt(wo.getCreatedAt())
                                .build();
        }
}
