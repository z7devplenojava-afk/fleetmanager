package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.FleetWorkOrderHistoryDTO;
import com.z7design.fleet_manager.dto.PurchaseRequestDTO;
import com.z7design.fleet_manager.dto.PurchaseRequestItemDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceRankingDTO;
import com.z7design.fleet_manager.dto.WorkOrderItemDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.FleetWorkOrderHistory;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkOrderItem;
import com.z7design.fleet_manager.model.FleetWorkOrderChecklist;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.repository.FleetWorkOrderHistoryRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderExecutionHistoryRepository;
import com.z7design.fleet_manager.model.FleetWorkOrderExecutionHistory;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.ChecklistItemRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderChecklistRepository;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FleetWorkOrderService {

    private final FleetWorkOrderRepository repository;
    private final FleetWorkOrderHistoryRepository historyRepository;
    private final VehicleRepository vehicleRepository;
    private final MaintenancePlanRepository planRepository;
    private final MaintenancePlanService planService;
    private final ProductService productService;
    private final PurchaseRequestService purchaseRequestService;
    private final ChecklistItemRepository checklistItemRepository;
    private final FleetWorkOrderChecklistRepository checklistRepository;
    private final WorkPostRepository workPostRepository;
    private final GarageService garageService;
    private final com.z7design.fleet_manager.repository.GarageRepository garageRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final MaterialRequisitionService materialRequisitionService;
    private final com.z7design.fleet_manager.repository.ServiceRepository serviceRepository;
    private final com.z7design.fleet_manager.repository.StockItemRepository stockItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final FleetWorkOrderExecutionHistoryRepository executionHistoryRepository;

    private FleetWorkOrderDTO toDTO(FleetWorkOrder entity) {
        FleetWorkOrderDTO dto = FleetWorkOrderDTO.fromEntity(entity);
        if (dto == null) return null;

        // Completa clientName se ainda estiver nulo
        if ((dto.getClientName() == null || dto.getClientName().isBlank()) && dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId())
                    .ifPresent(c -> dto.setClientName(c.getName()));
        }

        // Completa garageName se ainda estiver nulo
        if (dto.getGarageId() != null && (dto.getGarageName() == null || dto.getGarageName().isBlank())) {
            garageRepository.findById(dto.getGarageId())
                    .ifPresent(g -> dto.setGarageName(g.getName()));
        }

        // Completa workPostName se ainda estiver nulo
        if ((dto.getWorkPostName() == null || dto.getWorkPostName().isBlank()) && dto.getWorkPostId() != null) {
            workPostRepository.findById(dto.getWorkPostId())
                    .ifPresent(wp -> dto.setWorkPostName(wp.getName()));
        }

        // Completa mechanicName se ainda estiver nulo
        if (dto.getMechanicName() == null || dto.getMechanicName().isBlank()) {
            if (dto.getMechanicId() != null) {
                employeeRepository.findById(dto.getMechanicId())
                        .ifPresent(emp -> dto.setMechanicName(emp.getName()));
            } else if (dto.getResponsibleId() != null) {
                employeeRepository.findById(dto.getResponsibleId())
                        .ifPresent(emp -> dto.setMechanicName(emp.getName()));
            } else if (dto.getRequesterId() != null) {
                employeeRepository.findById(dto.getRequesterId())
                        .ifPresent(emp -> dto.setMechanicName(emp.getName()));
            }
        }

        // Completa responsibleName se ainda estiver nulo
        if ((dto.getResponsibleName() == null || dto.getResponsibleName().isBlank()) && dto.getResponsibleId() != null) {
            employeeRepository.findById(dto.getResponsibleId())
                    .ifPresent(emp -> dto.setResponsibleName(emp.getName()));
        }
        if (dto.getResponsibleName() == null || dto.getResponsibleName().isBlank()) {
            dto.setResponsibleName(dto.getMechanicName());
        }

        // Completa requesterName se ainda estiver nulo
        if ((dto.getRequesterName() == null || dto.getRequesterName().isBlank()) && dto.getRequesterId() != null) {
            employeeRepository.findById(dto.getRequesterId())
                    .ifPresent(emp -> dto.setRequesterName(emp.getName()));
        }
        if (dto.getRequesterName() == null || dto.getRequesterName().isBlank()) {
            dto.setRequesterName(dto.getMechanicName());
        }

        // Completa stopDate se nulo
        if (dto.getStopDate() == null) {
            if (entity.getStartDate() != null) {
                dto.setStopDate(entity.getStartDate().toLocalDate());
            } else if (entity.getPlannedDate() != null) {
                dto.setStopDate(entity.getPlannedDate());
            } else if (entity.getCreatedAt() != null) {
                dto.setStopDate(entity.getCreatedAt().toLocalDate());
            }
        }

        // Completa odometerIn se nulo
        if (dto.getOdometerIn() == null && entity.getVehicle() != null) {
            dto.setOdometerIn(entity.getVehicle().getCurrentMileage());
        }

        return dto;
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FleetWorkOrderDTO> getAll() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /** Lista as OSs filtrando por garagem executora (garageId) quando informada. */
    @Transactional(readOnly = true)
    public List<FleetWorkOrderDTO> getAllByGarage(UUID garageId) {
        if (garageId == null) {
            return getAll();
        }
        return repository.findAll().stream()
                .filter(o -> o.getGarage() != null && garageId.equals(o.getGarage().getId()))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FleetWorkOrderDTO getById(UUID id) {
        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<FleetWorkOrderHistoryDTO> getHistory(UUID workOrderId) {
        return historyRepository.findByWorkOrderIdOrderByCreatedAtAsc(workOrderId)
                .stream()
                .map(FleetWorkOrderHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.z7design.fleet_manager.dto.ChecklistItemDTO> getChecklistMasterItems() {
        return getChecklistMasterItems(null, null);
    }

    @Transactional(readOnly = true)
    public List<com.z7design.fleet_manager.dto.ChecklistItemDTO> getChecklistMasterItems(String vehicleType) {
        return getChecklistMasterItems(vehicleType, null);
    }

    @Transactional(readOnly = true)
    public List<com.z7design.fleet_manager.dto.ChecklistItemDTO> getChecklistMasterItems(String vehicleType, String model) {
        UUID currentCompanyId = TenantContext.get();
        List<com.z7design.fleet_manager.model.ChecklistItem> allItems = (currentCompanyId != null)
                ? checklistItemRepository.findAllActiveForCompanyOrGlobal(currentCompanyId)
                : checklistItemRepository.findByAtivoTrueOrderByOrdemAsc();

        // Se houver itens customizados da empresa atual, priorizá-los
        List<com.z7design.fleet_manager.model.ChecklistItem> companySpecific = (currentCompanyId != null)
                ? allItems.stream().filter(i -> currentCompanyId.equals(i.getCompanyId())).toList()
                : List.of();

        List<com.z7design.fleet_manager.model.ChecklistItem> sourceList = !companySpecific.isEmpty() ? companySpecific : allItems;

        String vUpper = vehicleType != null ? vehicleType.toUpperCase().trim() : "";
        String mUpper = model != null ? model.toUpperCase().trim() : "";

        // Detectar se é VAN, MICRO ou ÔNIBUS
        boolean isVan = vUpper.contains("VAN") || mUpper.contains("SPRINTER") || mUpper.contains("DUCATO") || mUpper.contains("MASTER") || mUpper.contains("TRANSIT");
        boolean isMicro = vUpper.contains("MINIBUS") || vUpper.contains("MICRO") || mUpper.contains("VOLARE") || mUpper.contains("SENIOR") || mUpper.contains("FLY");

        // 1. Filtragem por modelo específico se cadastrado
        if (!mUpper.isBlank()) {
            List<com.z7design.fleet_manager.model.ChecklistItem> modelMatches = sourceList.stream()
                    .filter(i -> i.getVehicleModelApplicable() != null && mUpper.contains(i.getVehicleModelApplicable().toUpperCase().trim()))
                    .toList();
            if (!modelMatches.isEmpty()) {
                return modelMatches.stream()
                        .map(com.z7design.fleet_manager.dto.ChecklistItemDTO::fromEntity)
                        .collect(Collectors.toList());
            }
        }

        // 2. Filtragem por tipo de veículo:
        // VAN: grupo de itens específicos de VAN + ALL (suspensão leve, sem freio a ar/motor)
        // MICRO: itens específicos de MICRO-ÔNIBUS / BUS + ALL
        // BUS: ônibus pesado completo (freio pneumático, eixos S, cuícas, compressor, 13 pontos lubrificação)
        if (!vUpper.isBlank() || isVan || isMicro) {
            List<String> validTypes;
            if (isVan) {
                validTypes = List.of("VAN", "ALL");
            } else if (isMicro) {
                validTypes = List.of("MINIBUS", "MICRO", "BUS", "ALL");
            } else {
                validTypes = List.of("BUS", "ALL");
            }

            List<com.z7design.fleet_manager.model.ChecklistItem> typeMatches = sourceList.stream()
                    .filter(i -> i.getVehicleTypeApplicable() == null || validTypes.contains(i.getVehicleTypeApplicable().toUpperCase().trim()))
                    .toList();

            if (!typeMatches.isEmpty()) {
                return typeMatches.stream()
                        .map(com.z7design.fleet_manager.dto.ChecklistItemDTO::fromEntity)
                        .collect(Collectors.toList());
            }
        }

        return sourceList.stream()
                .map(com.z7design.fleet_manager.dto.ChecklistItemDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Catálogo de Serviços de Manutenção ───────────────────────────────────

    @Transactional(readOnly = true)
    public List<com.z7design.fleet_manager.dto.ServiceDTO> getServicesCatalog() {
        return serviceRepository.findAllOrderByName().stream()
                .map(com.z7design.fleet_manager.dto.ServiceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public com.z7design.fleet_manager.dto.ServiceDTO createQuickService(Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome do serviço é obrigatório.");
        }

        String description = (String) body.get("description");
        String category = (String) body.getOrDefault("category", "MANUTENCAO");
        BigDecimal unitPrice = BigDecimal.ZERO;
        if (body.get("unitPrice") != null) {
            try {
                unitPrice = new BigDecimal(body.get("unitPrice").toString());
            } catch (Exception ignored) {}
        }

        // Gerar código sequencial do serviço (ex: SRV-0012)
        long count = serviceRepository.count();
        String generatedCode = String.format("SRV-%04d", count + 1);
        int attempts = 1;
        while (serviceRepository.existsByCode(generatedCode)) {
            attempts++;
            generatedCode = String.format("SRV-%04d", count + attempts);
        }

        com.z7design.fleet_manager.model.Service service = com.z7design.fleet_manager.model.Service.builder()
                .name(name.trim())
                .description(description != null ? description.trim() : null)
                .category(category)
                .code(generatedCode)
                .unitPrice(unitPrice)
                .unit("UN")
                .status(com.z7design.fleet_manager.model.Service.ServiceStatus.ACTIVE)
                .isBillable(true)
                .build();

        com.z7design.fleet_manager.model.Service saved = serviceRepository.save(service);
        return com.z7design.fleet_manager.dto.ServiceDTO.fromEntity(saved);
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO create(FleetWorkOrderDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));

        MaintenancePlan plan = null;
        if (dto.getPlanId() != null) {
            plan = planRepository.findById(dto.getPlanId()).orElse(null);
        }

        UUID companyId = TenantContext.get();
        if (companyId == null && vehicle.getCompanyId() != null) {
            companyId = vehicle.getCompanyId();
        }

        // RN08 — Validação de Odômetro (KM)
        if (dto.getOdometerIn() != null && dto.getOdometerIn() < 0) {
            throw new IllegalArgumentException("O KM de parada não pode ser menor que zero.");
        }
        if (dto.getOdometerOut() != null && dto.getOdometerOut() < 0) {
            throw new IllegalArgumentException("O KM de saída não pode ser menor que zero.");
        }

        // ── Alocação: Obra (Cliente) onde o veículo está alocado ─────────────
        // Se a OS não veio com Obra, resolve automaticamente pela alocação atual
        // do veículo (vehicle.workPostId) e deriva o Cliente da Obra.
        WorkPost workPost = null;
        if (dto.getWorkPostId() != null) {
            workPost = workPostRepository.findById(dto.getWorkPostId()).orElse(null);
        } else if (dto.getSectorId() != null) {
            workPost = workPostRepository.findById(dto.getSectorId()).orElse(null);
        } else if (vehicle.getWorkPostId() != null) {
            workPost = workPostRepository.findById(vehicle.getWorkPostId()).orElse(null);
        }
        UUID resolvedClientId = dto.getClientId() != null ? dto.getClientId()
                : (workPost != null && workPost.getClient() != null ? workPost.getClient().getId() : null);

        // ── Garagem: onde o serviço será executado ────────────────────────
        // Prioriza a garagem informada; fallback = garagem atual do veículo.
        com.z7design.fleet_manager.model.Garage garage = null;
        if (dto.getGarageId() != null) {
            garage = garageRepository.findById(dto.getGarageId()).orElse(null);
        }
        if (garage == null) {
            if (vehicle.getGarageId() != null) {
                garage = garageRepository.findById(vehicle.getGarageId()).orElse(null);
            } else if (vehicle.getGarageName() != null && !vehicle.getGarageName().isBlank()) {
                garage = garageService.getOrCreateByName(vehicle.getGarageName(), companyId);
            }
        }

        // RN01 — Número da OS
        String osNumber = dto.getOsNumber();
        if (osNumber == null || osNumber.isBlank() || repository.existsByOsNumber(osNumber)) {
            osNumber = generateOsNumber();
        }

        FleetWorkOrder.MaintenanceType type = dto.getMaintenanceType() != null
                ? dto.getMaintenanceType()
                : FleetWorkOrder.MaintenanceType.CORRETIVA;

        String resolvedMechanicName = dto.getMechanicName();
        if (resolvedMechanicName == null || resolvedMechanicName.isBlank()) {
            if (dto.getResponsibleName() != null && !dto.getResponsibleName().isBlank()) {
                resolvedMechanicName = dto.getResponsibleName();
            } else if (dto.getRequesterName() != null && !dto.getRequesterName().isBlank()) {
                resolvedMechanicName = dto.getRequesterName();
            } else if (dto.getNotes() != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern
                        .compile("(?i)Motorista:\\s*([^\\n,]+?)(?:\\s+via|$)")
                        .matcher(dto.getNotes());
                if (m.find() && !m.group(1).trim().isEmpty()) {
                    resolvedMechanicName = m.group(1).trim() + " (Motorista)";
                }
            } else if (dto.getAnomaliesDescription() != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern
                        .compile("(?i)\\[Checklist Diário\\s*-\\s*([^\\]]+)\\]")
                        .matcher(dto.getAnomaliesDescription());
                if (m.find() && !m.group(1).trim().isEmpty()) {
                    resolvedMechanicName = m.group(1).trim() + " (Motorista)";
                }
            } else if (vehicle.getAssignedDriver() != null && !vehicle.getAssignedDriver().isBlank()) {
                resolvedMechanicName = vehicle.getAssignedDriver() + " (Motorista)";
            }
        }

        FleetWorkOrder entity = FleetWorkOrder.builder()
                .osNumber(osNumber)
                .maintenanceType(type)
                .vehicle(vehicle)
                .plan(plan)
                .status(dto.getStatus() != null ? dto.getStatus() : FleetWorkOrder.WorkOrderStatus.OPEN)
                .priority(dto.getPriority() != null ? dto.getPriority() : FleetWorkOrder.WorkOrderPriority.MEDIUM)
                .mechanicId(dto.getMechanicId())
                .mechanicName(resolvedMechanicName)
                .laborType(dto.getLaborType())
                .plannedDate(dto.getPlannedDate())
                .actualDate(dto.getActualDate())
                .stopDate(dto.getStopDate() != null ? dto.getStopDate() : java.time.LocalDate.now())
                .stopTime(dto.getStopTime() != null ? dto.getStopTime() : java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")))
                .exitDate(dto.getExitDate())
                .exitTime(dto.getExitTime())
                .aggregateInfo(dto.getAggregateInfo())
                .anomaliesDescription(dto.getAnomaliesDescription())
                .otherDescription(dto.getOtherDescription())
                .maintenancePerformed(dto.getMaintenancePerformed())
                .workPost(workPost)
                .garage(garage)
                .clientId(resolvedClientId)
                .sectorId(dto.getSectorId())
                .requesterId(dto.getRequesterId())
                .responsibleId(dto.getResponsibleId())
                .supervisorId(dto.getSupervisorId())
                .responsibleSignature(dto.getResponsibleSignature())
                .responsibleSignatureDate(dto.getResponsibleSignatureDate())
                .supervisorSignature(dto.getSupervisorSignature())
                .supervisorSignatureDate(dto.getSupervisorSignatureDate())
                .odometerIn(dto.getOdometerIn())
                .odometerOut(dto.getOdometerOut())
                .stopReason(dto.getStopReason())
                .laborCost(nullSafe(dto.getLaborCost()))
                .partsCost(BigDecimal.ZERO)
                .totalCost(BigDecimal.ZERO)
                .executionStartDate(dto.getExecutionStartDate())
                .executionEndDate(dto.getExecutionEndDate())
                .executionStartJustification(dto.getExecutionStartJustification())
                .notes(dto.getNotes())
                .photoAttachments(dto.getPhotoAttachments() != null ? dto.getPhotoAttachments() : new ArrayList<>())
                .companyId(companyId)
                .build();

        if (entity.getExecutionStartDate() != null || entity.getExecutionEndDate() != null) {
            entity.recalculateExecutionDuration();
        }

        if (dto.getItems() != null) {
            for (WorkOrderItemDTO itemDto : dto.getItems()) {
                addItemToEntity(entity, itemDto);
            }
        }

        // RN05 — Auto-carregar Checklist Preventivo se for PREVENTIVA e não informado
        if (type == FleetWorkOrder.MaintenanceType.PREVENTIVA) {
            if (dto.getChecklistItems() != null && !dto.getChecklistItems().isEmpty()) {
                for (com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO cDto : dto.getChecklistItems()) {
                    addChecklistItemToEntity(entity, cDto);
                }
            } else {
                List<com.z7design.fleet_manager.model.ChecklistItem> masterItems = checklistItemRepository.findByAtivoTrueOrderByOrdemAsc();
                for (com.z7design.fleet_manager.model.ChecklistItem master : masterItems) {
                    com.z7design.fleet_manager.model.FleetWorkOrderChecklist item = com.z7design.fleet_manager.model.FleetWorkOrderChecklist.builder()
                            .workOrder(entity)
                            .checklistItem(master)
                            .situacao(com.z7design.fleet_manager.model.FleetWorkOrderChecklist.ChecklistStatus.OK)
                            .build();
                    entity.getChecklistItems().add(item);
                }
            }
        }

        // Soma custo de mão de obra ao total
        entity.setTotalCost(entity.getPartsCost().add(entity.getLaborCost()));

        FleetWorkOrder saved = repository.save(entity);

        // Registra histórico de criação
        addHistory(saved.getId(), "CREATED", "Ordem de Serviço (" + saved.getMaintenanceType() + ") criada com status: "
                + saved.getStatus().name(), dto.getMechanicName(), null, saved.getStatus().name());

        return toDTO(saved);
    }

    // ── Atualização completa ──────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO update(UUID id, FleetWorkOrderDTO dto) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        if (dto.getVehicleId() != null && !dto.getVehicleId().equals(
                entity.getVehicle() != null ? entity.getVehicle().getId() : null)) {
            Vehicle newVehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));
            entity.setVehicle(newVehicle);
        }

        if (dto.getMaintenanceType() != null) entity.setMaintenanceType(dto.getMaintenanceType());
        if (dto.getPriority() != null) entity.setPriority(dto.getPriority());
        if (dto.getMechanicName() != null) entity.setMechanicName(dto.getMechanicName());
        if (dto.getMechanicId() != null) entity.setMechanicId(dto.getMechanicId());
        if (dto.getLaborType() != null) entity.setLaborType(dto.getLaborType());
        if (dto.getPlannedDate() != null) entity.setPlannedDate(dto.getPlannedDate());
        if (dto.getActualDate() != null) entity.setActualDate(dto.getActualDate());

        if (dto.getStopDate() != null) entity.setStopDate(dto.getStopDate());
        if (dto.getStopTime() != null) entity.setStopTime(dto.getStopTime());
        if (dto.getExitDate() != null) entity.setExitDate(dto.getExitDate());
        if (dto.getExitTime() != null) entity.setExitTime(dto.getExitTime());
        if (dto.getAggregateInfo() != null) entity.setAggregateInfo(dto.getAggregateInfo());
        if (dto.getAnomaliesDescription() != null) entity.setAnomaliesDescription(dto.getAnomaliesDescription());
        if (dto.getOtherDescription() != null) entity.setOtherDescription(dto.getOtherDescription());
        if (dto.getMaintenancePerformed() != null) entity.setMaintenancePerformed(dto.getMaintenancePerformed());

        // Garagem: atualiza quando informada explicitamente
        if (dto.getGarageId() != null) {
            entity.setGarage(garageRepository.findById(dto.getGarageId()).orElse(null));
        }

        // Alocação: Obra (Cliente) — re-resolve a partir do veículo quando alterado
        if (dto.getWorkPostId() != null) {
            entity.setWorkPost(workPostRepository.findById(dto.getWorkPostId()).orElse(null));
            if (entity.getWorkPost() != null && entity.getWorkPost().getClient() != null) {
                entity.setClientId(entity.getWorkPost().getClient().getId());
            }
        } else if (dto.getSectorId() != null) {
            entity.setWorkPost(workPostRepository.findById(dto.getSectorId()).orElse(null));
            if (entity.getWorkPost() != null && entity.getWorkPost().getClient() != null) {
                entity.setClientId(entity.getWorkPost().getClient().getId());
            }
        } else if (dto.getClientId() != null) {
            entity.setClientId(dto.getClientId());
        } else if (entity.getVehicle() != null && entity.getVehicle().getWorkPostId() != null
                && entity.getWorkPost() == null) {
            entity.setWorkPost(workPostRepository.findById(entity.getVehicle().getWorkPostId()).orElse(null));
            if (entity.getWorkPost() != null && entity.getWorkPost().getClient() != null) {
                entity.setClientId(entity.getWorkPost().getClient().getId());
            }
        }
        if (dto.getSectorId() != null) entity.setSectorId(dto.getSectorId());
        if (dto.getRequesterId() != null) entity.setRequesterId(dto.getRequesterId());
        if (dto.getResponsibleId() != null) entity.setResponsibleId(dto.getResponsibleId());
        if (dto.getSupervisorId() != null) entity.setSupervisorId(dto.getSupervisorId());

        if (dto.getResponsibleSignature() != null) {
            entity.setResponsibleSignature(dto.getResponsibleSignature());
            entity.setResponsibleSignatureDate(java.time.LocalDateTime.now());
        }
        if (dto.getSupervisorSignature() != null) {
            entity.setSupervisorSignature(dto.getSupervisorSignature());
            entity.setSupervisorSignatureDate(java.time.LocalDateTime.now());
        }

        if (dto.getOdometerIn() != null) entity.setOdometerIn(dto.getOdometerIn());
        if (dto.getOdometerOut() != null) entity.setOdometerOut(dto.getOdometerOut());
        if (dto.getStopReason() != null) entity.setStopReason(dto.getStopReason());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());
        if (dto.getLaborCost() != null) entity.setLaborCost(dto.getLaborCost());
        if (dto.getPhotoAttachments() != null) entity.setPhotoAttachments(dto.getPhotoAttachments());

        // ── Execução: Atualiza Datas de Início/Fim e recalcula duração ──────────────────────
        if (dto.getExecutionStartDate() != null) {
            entity.setExecutionStartDate(dto.getExecutionStartDate());
        }
        if (dto.getExecutionEndDate() != null) {
            entity.setExecutionEndDate(dto.getExecutionEndDate());
        }
        if (dto.getExecutionStartJustification() != null) {
            entity.setExecutionStartJustification(dto.getExecutionStartJustification());
        }
        // Auto-calcula a duração toda vez que qualquer data de execução é fornecida
        if (dto.getExecutionStartDate() != null || dto.getExecutionEndDate() != null) {
            entity.recalculateExecutionDuration();
        }

        // Atualiza itens de peças/serviços com reconciliação in-place (evita conflito de flush/constraint e duplo consumo de estoque)
        if (dto.getItems() != null) {
            updateItems(entity, dto.getItems());
        }

        // Atualiza respostas de checklist se fornecidos com reconciliação in-place
        if (dto.getChecklistItems() != null) {
            updateChecklistItems(entity, dto.getChecklistItems());
        }

        // Se o status fornecido for COMPLETED, executa validação RN07
        if (dto.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            validateCompletion(entity);
            if (entity.getExitDate() == null) entity.setExitDate(java.time.LocalDate.now());
            if (entity.getExitTime() == null) entity.setExitTime(java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
            if (entity.getCompletionDate() == null) entity.setCompletionDate(java.time.LocalDateTime.now());
        }

        FleetWorkOrder.WorkOrderStatus oldStatus = entity.getStatus();

        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }

        // Ao concluir (1ª vez), sincroniza o veículo e marca o plano como executado
        if (dto.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED
                && oldStatus != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            syncVehicleOnCompletion(entity);
            if (entity.getPlan() != null && entity.getVehicle().getCurrentMileage() != null) {
                planService.markAsExecuted(
                        entity.getPlan().getId(),
                        entity.getVehicle().getCurrentMileage(),
                        entity.getCompletionDate().toLocalDate());
            }
        }

        entity.setTotalCost(entity.getPartsCost().add(entity.getLaborCost()));

        FleetWorkOrder saved = repository.save(entity);

        addHistory(saved.getId(), "UPDATED", "OS atualizada pelo usuário.",
                dto.getMechanicName(), null, null);

        return toDTO(saved);
    }

    // ── Mudança de status ─────────────────────────────────────────────────────

    @Transactional
    public FleetWorkOrderDTO updateStatus(UUID id, FleetWorkOrder.WorkOrderStatus newStatus) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        FleetWorkOrder.WorkOrderStatus oldStatus = entity.getStatus();

        if (newStatus == FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            validateCompletion(entity);
            if (entity.getExitDate() == null) entity.setExitDate(java.time.LocalDate.now());
            if (entity.getExitTime() == null) entity.setExitTime(java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
            if (entity.getCompletionDate() == null) entity.setCompletionDate(java.time.LocalDateTime.now());
        }

        entity.setStatus(newStatus);

        if (newStatus == FleetWorkOrder.WorkOrderStatus.IN_PROGRESS
                && oldStatus != FleetWorkOrder.WorkOrderStatus.IN_PROGRESS) {
            entity.setStartDate(LocalDateTime.now());
        }

        if (newStatus == FleetWorkOrder.WorkOrderStatus.COMPLETED
                && oldStatus != FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            // Sincroniza o veículo ANTES de marcar o plano, para que o plano
            // seja executado com a quilometragem real de saída (odômetro).
            syncVehicleOnCompletion(entity);
            if (entity.getPlan() != null && entity.getVehicle().getCurrentMileage() != null) {
                planService.markAsExecuted(
                        entity.getPlan().getId(),
                        entity.getVehicle().getCurrentMileage(),
                        entity.getCompletionDate().toLocalDate());
            }
        }

        FleetWorkOrder saved = repository.save(entity);

        addHistory(saved.getId(), "STATUS_CHANGE",
                "Status alterado de " + oldStatus.name() + " para " + newStatus.name(),
                null, oldStatus.name(), newStatus.name());

        return toDTO(saved);
    }

    // RN07 e RN06 — Validação de Conclusão da OS
    private void validateCompletion(FleetWorkOrder entity) {
        if (entity.getMaintenancePerformed() == null || entity.getMaintenancePerformed().isBlank()) {
            throw new IllegalArgumentException("Para concluir a OS, a descrição da manutenção realizada deve estar preenchida.");
        }
        if (entity.getMaintenanceType() == FleetWorkOrder.MaintenanceType.PREVENTIVA) {
            if (entity.getChecklistItems() == null || entity.getChecklistItems().isEmpty()) {
                throw new IllegalArgumentException("Para concluir uma OS Preventiva, o checklist de inspeção deve ser preenchido.");
            }
            boolean anyUnset = entity.getChecklistItems().stream()
                    .anyMatch(item -> item.getSituacao() == null);
            if (anyUnset) {
                throw new IllegalArgumentException("Para concluir uma OS Preventiva, todos os itens do checklist devem ser respondidos.");
            }
        }
    }

    private void addChecklistItemToEntity(FleetWorkOrder workOrder, com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO cDto) {
        if (cDto.getChecklistItemId() == null) return;
        com.z7design.fleet_manager.model.ChecklistItem itemMaster = checklistItemRepository.findById(cDto.getChecklistItemId())
                .orElse(null);
        if (itemMaster == null) return;

        com.z7design.fleet_manager.model.FleetWorkOrderChecklist checklist = com.z7design.fleet_manager.model.FleetWorkOrderChecklist.builder()
                .workOrder(workOrder)
                .checklistItem(itemMaster)
                .situacao(cDto.getSituacao() != null ? cDto.getSituacao() : com.z7design.fleet_manager.model.FleetWorkOrderChecklist.ChecklistStatus.OK)
                .observacao(cDto.getObservacao())
                .reparoRealizado(cDto.getReparoRealizado())
                .build();

        workOrder.getChecklistItems().add(checklist);
    }

    // ── Adicionar nota manual ao histórico ────────────────────────────────────

    @Transactional
    public FleetWorkOrderHistoryDTO addNote(UUID workOrderId, String note, String performedBy) {
        if (!repository.existsById(workOrderId)) {
            throw new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId);
        }
        FleetWorkOrderHistory h = addHistory(workOrderId, "NOTE", note, performedBy, null, null);
        return FleetWorkOrderHistoryDTO.fromEntity(h);
    }
    // ── Correção do início da execução com justificativa (auditoria) ──────────

    /**
     * Corrige a data/hora de início da execução da OS, salvando a justificativa
     * no histórico de execução para rastreabilidade.
     */
    @Transactional
    public FleetWorkOrderDTO updateExecutionStart(
            UUID workOrderId,
            LocalDateTime newStartDate,
            String justification,
            String performedBy
    ) {
        FleetWorkOrder entity = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        if (newStartDate == null) {
            throw new IllegalArgumentException("A data de início da execução não pode ser nula.");
        }
        if (justification == null || justification.isBlank()) {
            throw new IllegalArgumentException("A justificativa é obrigatória ao corrigir a data de início da execução.");
        }

        // Salva o registro de auditoria
        FleetWorkOrderExecutionHistory histEntry = FleetWorkOrderExecutionHistory.builder()
                .workOrderId(workOrderId)
                .previousStartDate(entity.getExecutionStartDate())
                .newStartDate(newStartDate)
                .justification(justification.trim())
                .performedBy(performedBy)
                .build();
        executionHistoryRepository.save(histEntry);

        // Atualiza a entidade
        entity.setExecutionStartDate(newStartDate);
        entity.setExecutionStartJustification(justification.trim());
        entity.recalculateExecutionDuration();

        FleetWorkOrder saved = repository.save(entity);

        addHistory(saved.getId(), "EXECUTION_START_CORRECTED",
                "Início de execução corrigido para " + newStartDate
                        + ". Justificativa: " + justification.trim(),
                performedBy, null, null);

        return toDTO(saved);
    }

    /**
     * Retorna o histórico de correções do início da execução de uma OS.
     */
    @Transactional(readOnly = true)
    public List<FleetWorkOrderExecutionHistory> getExecutionHistory(UUID workOrderId) {
        return executionHistoryRepository.findByWorkOrderIdOrderByCreatedAtDesc(workOrderId);
    }

    // ── Lançamento de Despesa no Financeiro (Contas a Pagar) ──────────────────

    /**
     * Lista as despesas (contas a pagar) já lançadas no financeiro para esta O.S.
     * de manutenção.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFinancialExpenses(UUID workOrderId) {
        if (!repository.existsById(workOrderId)) {
            throw new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId);
        }
        return invoiceRepository.findByWorkOrderId(workOrderId).stream()
                .map(this::toExpenseMap)
                .collect(Collectors.toList());
    }

    /**
     * Lança a despesa da O.S. de manutenção no módulo financeiro, criando uma
     * conta a pagar (Invoice) com rastreabilidade da O.S. (Categoria MANUTENCAO).
     */
    @Transactional
    public Map<String, Object> launchFinancialExpense(UUID workOrderId, String performedBy) {
        FleetWorkOrder order = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        BigDecimal totalCost = order.getTotalCost() != null ? order.getTotalCost() : BigDecimal.ZERO;
        if (totalCost.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "A O.S. não possui custo total informado. Preencha os custos de mão de obra / peças antes de lançar a despesa no financeiro.");
        }

        // Evita duplicar a conta a pagar para a mesma O.S.
        if (!invoiceRepository.findByWorkOrderId(workOrderId).isEmpty()) {
            throw new IllegalStateException(
                    "Esta O.S. já possui uma despesa lançada no financeiro (Contas a Pagar).");
        }

        String osLabel = order.getOsNumber() != null
                ? order.getOsNumber()
                : workOrderId.toString().substring(0, 8).toUpperCase();

        String vehicleLabel = "";
        if (order.getVehicle() != null) {
            vehicleLabel = order.getVehicle().getPlate() != null ? order.getVehicle().getPlate() : "";
            if (order.getVehicle().getModel() != null) {
                vehicleLabel += " - " + order.getVehicle().getModel();
            }
        }

        // Número único da conta a pagar: MNT-<OS>[-n]
        String baseNumber = "MNT-" + osLabel;
        String invoiceNumber = baseNumber;
        int suffix = 1;
        while (invoiceRepository.existsByInvoiceNumberNativeScoped(invoiceNumber, order.getCompanyId())) {
            suffix++;
            invoiceNumber = baseNumber + "-" + suffix;
        }

        LocalDate refDate = order.getActualDate() != null
                ? order.getActualDate()
                : (order.getPlannedDate() != null ? order.getPlannedDate() : LocalDate.now());

        Invoice invoice = new Invoice();
        invoice.setCompanyId(order.getCompanyId());
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setDescription("Despesa de Manutenção O.S. " + osLabel
                + (vehicleLabel.isBlank() ? "" : " - Veículo: " + vehicleLabel));
        invoice.setAmount(totalCost);
        invoice.setType(ExpenseType.VARIAVEL);
        invoice.setStatus(ExpenseStatus.PENDENTE);
        invoice.setDueDate(refDate);
        invoice.setIssueDate(refDate);
        invoice.setCategory("MANUTENCAO");
        invoice.setSupplierName(order.getLaborType() == FleetWorkOrder.LaborType.EXTERNAL
                ? (order.getMechanicName() != null ? order.getMechanicName() : "Oficina Externa")
                : (order.getMechanicName() != null ? order.getMechanicName() : "Oficina Interna"));
        invoice.setWorkOrderId(order.getId());
        invoice.setWorkOrderNumber(osLabel);
        invoice.setCentroCusto("MANUTENCAO");
        invoice.setNotes("Gerada automaticamente pela Manutenção a partir da O.S. " + osLabel + ".");

        Invoice saved = invoiceService.save(invoice);

        addHistory(workOrderId, "COST_UPDATE",
                "Despesa de manutenção lançada no Financeiro (Contas a Pagar): " + invoiceNumber
                        + " — " + String.format("R$ %s", totalCost.setScale(2, RoundingMode.HALF_UP))
                        + " (vencimento " + refDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")",
                performedBy != null && !performedBy.isBlank() ? performedBy : "Sistema",
                null, null);

        return toExpenseMap(saved);
    }

    private Map<String, Object> toExpenseMap(Invoice invoice) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", invoice.getId());
        map.put("invoiceNumber", invoice.getInvoiceNumber());
        map.put("description", invoice.getDescription());
        map.put("amount", invoice.getAmount());
        map.put("status", invoice.getStatus() != null ? invoice.getStatus().name() : "PENDENTE");
        map.put("dueDate", invoice.getDueDate());
        map.put("paymentDate", invoice.getPaymentDate());
        map.put("category", invoice.getCategory());
        map.put("workOrderNumber", invoice.getWorkOrderNumber());
        map.put("createdAt", invoice.getCreatedAt());
        return map;
    }

    // ── Solicitar compra ao almoxarifado ─────────────────────────────────────

    @Transactional
    public PurchaseRequestDTO requestPurchase(UUID workOrderId, User requester) {
        FleetWorkOrder entity = repository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + workOrderId));

        // Apenas itens do tipo PEÇA (PART) são enviados para compra
        List<WorkOrderItem> partItems = entity.getItems().stream()
                .filter(i -> i.getType() == WorkOrderItem.ItemType.PART)
                .collect(Collectors.toList());

        if (partItems.isEmpty()) {
            throw new IllegalArgumentException("A O.S. não possui itens de peça (PART) para solicitar compra.");
        }

        String vehicleLabel = entity.getVehicle() != null
                ? entity.getVehicle().getPlate() + (entity.getVehicle().getModel() != null
                        ? " - " + entity.getVehicle().getModel() : "")
                : "Não informado";

        String osLabel = entity.getOsNumber() != null ? entity.getOsNumber() : workOrderId.toString().substring(0, 8);

        List<PurchaseRequestItemDTO> requestItems = partItems.stream().map(item -> {
            PurchaseRequestItemDTO.PurchaseRequestItemDTOBuilder b = PurchaseRequestItemDTO.builder()
                    .itemName(item.getDescription() != null && !item.getDescription().isBlank()
                            ? item.getDescription() : "Peça")
                    .description("Peça da O.S. " + osLabel + " - Veículo: " + vehicleLabel)
                    .specification("O.S. " + osLabel)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .priority(entity.getPriority() != null ? entity.getPriority().name() : "MEDIUM")
                    .status("PENDING")
                    .urgency(entity.getPriority() == FleetWorkOrder.WorkOrderPriority.URGENT ? "URGENT" : "NORMAL")
                    .productId(item.getProductId());
            return b.build();
        }).collect(Collectors.toList());

        BigDecimal estimatedTotal = partItems.stream()
                .map(WorkOrderItem::getTotalPrice)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PurchaseRequestDTO dto = PurchaseRequestDTO.builder()
                .title("Compra de peças - O.S. " + osLabel)
                .description("Solicitação de compra gerada pela O.S. " + osLabel
                        + " (Veículo: " + vehicleLabel + "). Itens necessários para execução da manutenção.")
                .priority(entity.getPriority() != null ? entity.getPriority().name() : "MEDIUM")
                .status("PENDING")
                .requesterName(requester != null ? requester.getName() : "Operacional")
                .department("Operacional")
                .justification("Falta de peça para executar a Ordem de Serviço " + osLabel)
                .estimatedTotal(estimatedTotal)
                .urgency(entity.getPriority() == FleetWorkOrder.WorkOrderPriority.URGENT ? "URGENT" : "NORMAL")
                .requiredDate(LocalDateTime.now().plusDays(3))
                .requestDate(LocalDateTime.now())
                .requesterId(requester != null ? requester.getId() : null)
                .items(requestItems)
                .build();

        PurchaseRequestDTO created = purchaseRequestService.createPurchaseRequest(dto);

        // Registra no histórico da O.S.
        addHistory(workOrderId, "NOTE",
                "Solicitação de compra enviada ao almoxarifado (" + created.getRequestNumber() + ").",
                requester != null ? requester.getName() : "Operacional", null, null);

        return created;
    }

    // ── Ranking de veículos ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VehicleMaintenanceRankingDTO> getVehicleRanking() {
        List<FleetWorkOrder> orders = repository.findAll();
        java.util.Map<UUID, List<FleetWorkOrder>> byVehicle = orders.stream()
                .filter(o -> o.getVehicle() != null && o.getVehicle().getId() != null)
                .collect(Collectors.groupingBy(o -> o.getVehicle().getId()));

        List<VehicleMaintenanceRankingDTO> result = new ArrayList<>();

        for (java.util.Map.Entry<UUID, List<FleetWorkOrder>> entry : byVehicle.entrySet()) {
            List<FleetWorkOrder> vehicleOrders = entry.getValue();
            FleetWorkOrder first = vehicleOrders.get(0);
            Vehicle v = first.getVehicle();

            UUID vehicleId = v.getId();
            String plate = v.getPlate();
            String model = v.getModel();

            long totalOrders = vehicleOrders.size();
            long completedOrders = vehicleOrders.stream()
                    .filter(o -> o.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED)
                    .count();
            long cancelledOrders = vehicleOrders.stream()
                    .filter(o -> o.getStatus() == FleetWorkOrder.WorkOrderStatus.CANCELLED)
                    .count();

            BigDecimal totalCost = vehicleOrders.stream()
                    .map(o -> o.getTotalCost() != null ? o.getTotalCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long downtimeHours = vehicleOrders.stream()
                    .mapToLong(o -> {
                        Long dh = o.getDowntimeHours();
                        return dh != null ? dh : 0L;
                    })
                    .sum();

            double completionRate = totalOrders > 0
                    ? BigDecimal.valueOf(completedOrders * 100.0 / totalOrders)
                        .setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            // Recomendação baseada em custo e frequência
            String recommendation;
            if (totalOrders >= 10 || totalCost.compareTo(BigDecimal.valueOf(50_000)) > 0) {
                recommendation = "RETIRE";
            } else if (totalOrders >= 5 || totalCost.compareTo(BigDecimal.valueOf(20_000)) > 0) {
                recommendation = "REVIEW";
            } else {
                recommendation = "KEEP";
            }

            result.add(VehicleMaintenanceRankingDTO.builder()
                    .vehicleId(vehicleId)
                    .vehiclePlate(plate)
                    .vehicleModel(model)
                    .totalOrders(totalOrders)
                    .completedOrders(completedOrders)
                    .cancelledOrders(cancelledOrders)
                    .totalCost(totalCost)
                    .totalDowntimeHours(downtimeHours)
                    .completionRate(completionRate)
                    .recommendation(recommendation)
                    .build());
        }

        result.sort((a, b) -> {
            int cmp = Long.compare(b.getTotalOrders(), a.getTotalOrders());
            if (cmp != 0) return cmp;
            return b.getTotalCost().compareTo(a.getTotalCost());
        });

        return result;
    }

    // ── Exclusão (soft-delete — RN10) ────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        FleetWorkOrder entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + id));

        // RN10: OS Concluída não pode ser excluída — use Cancelar
        if (entity.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Ordem de Serviço concluída não pode ser excluída. Utilize a opção Cancelar se necessário.");
        }

        // Soft-delete: mantém o registro com timestamp de inativação
        entity.setDeletedAt(LocalDateTime.now());
        repository.save(entity);

        addHistory(id, "DELETED", "OS inativada (soft-delete).", null, null, null);
    }

    /**
     * Duplica uma OS existente gerando novo número de OS e status OPEN.
     * Copia todos os campos relevantes exceto datas de conclusão e assinaturas.
     */
    @Transactional
    public FleetWorkOrderDTO duplicate(UUID sourceId) {
        FleetWorkOrder source = repository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("FleetWorkOrder not found: " + sourceId));

        String newOsNumber = generateOsNumber();

        FleetWorkOrder copy = FleetWorkOrder.builder()
                .osNumber(newOsNumber)
                .vehicle(source.getVehicle())
                .plan(source.getPlan())
                .maintenanceType(source.getMaintenanceType() != null ? source.getMaintenanceType() : FleetWorkOrder.MaintenanceType.CORRETIVA)
                .status(FleetWorkOrder.WorkOrderStatus.OPEN)
                .priority(source.getPriority() != null ? source.getPriority() : FleetWorkOrder.WorkOrderPriority.MEDIUM)
                .mechanicId(source.getMechanicId())
                .mechanicName(source.getMechanicName())
                .laborType(source.getLaborType())
                .plannedDate(java.time.LocalDate.now())
                .workPost(source.getWorkPost())
                .garage(source.getGarage())
                .clientId(source.getClientId())
                .sectorId(source.getSectorId())
                .requesterId(source.getRequesterId())
                .responsibleId(source.getResponsibleId())
                .supervisorId(source.getSupervisorId())
                .aggregateInfo(source.getAggregateInfo())
                .anomaliesDescription(source.getAnomaliesDescription())
                .otherDescription(source.getOtherDescription())
                .stopReason(source.getStopReason())
                .reserveCovered(source.getReserveCovered() != null ? source.getReserveCovered() : false)
                .reserveVehicleId(source.getReserveVehicleId())
                .reserveResponseMinutes(source.getReserveResponseMinutes())
                .notes("Duplicado da OS " + source.getOsNumber())
                .laborCost(source.getLaborCost() != null ? source.getLaborCost() : BigDecimal.ZERO)
                .partsCost(BigDecimal.ZERO)
                .totalCost(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .checklistItems(new ArrayList<>())
                .photoAttachments(new ArrayList<>())
                .companyId(source.getCompanyId())
                .build();

        // Duplicar itens de serviço / peças
        if (source.getItems() != null && !source.getItems().isEmpty()) {
            for (WorkOrderItem srcItem : source.getItems()) {
                WorkOrderItem newItem = WorkOrderItem.builder()
                        .workOrder(copy)
                        .description(srcItem.getDescription())
                        .type(srcItem.getType())
                        .quantity(srcItem.getQuantity())
                        .unitPrice(srcItem.getUnitPrice())
                        .totalPrice(srcItem.getTotalPrice())
                        .productId(srcItem.getProductId())
                        .code(srcItem.getCode())
                        .requiresApproval(srcItem.getRequiresApproval())
                        .approvalReason(srcItem.getApprovalReason())
                        .approved(false) // Ao duplicar, reseta aprovação para que novo gestor aprove se necessário
                        .approvedBy(null)
                        .approvedAt(null)
                        .provider(srcItem.getProvider())
                        .build();
                copy.getItems().add(newItem);
                if (newItem.getTotalPrice() != null) {
                    copy.setPartsCost(copy.getPartsCost().add(newItem.getTotalPrice()));
                }
            }
        }

        // Custo total = mão de obra + peças
        copy.setTotalCost(copy.getLaborCost().add(copy.getPartsCost()));

        // Duplicar checklist
        if (source.getChecklistItems() != null && !source.getChecklistItems().isEmpty()) {
            for (FleetWorkOrderChecklist srcCheck : source.getChecklistItems()) {
                FleetWorkOrderChecklist newCheck = FleetWorkOrderChecklist.builder()
                        .workOrder(copy)
                        .checklistItem(srcCheck.getChecklistItem())
                        .situacao(FleetWorkOrderChecklist.ChecklistStatus.OK)
                        .observacao(srcCheck.getObservacao())
                        .build();
                copy.getChecklistItems().add(newCheck);
            }
        }

        FleetWorkOrder saved = repository.save(copy);

        addHistory(saved.getId(), "CREATED",
                "OS criada por duplicação da " + source.getOsNumber(), null, null, null);

        return toDTO(saved);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Sincroniza o veículo ao concluir a OS: atualiza a quilometragem com o
     * odômetro de saída (apenas se for maior que a atual, evitando retrocedo
     * por lançamento errado) e grava a data da última manutenção.
     */
    private void syncVehicleOnCompletion(FleetWorkOrder entity) {
        Vehicle vehicle = entity.getVehicle();
        if (vehicle == null) return;

        if (entity.getOdometerOut() != null
                && (vehicle.getCurrentMileage() == null
                    || entity.getOdometerOut() > vehicle.getCurrentMileage())) {
            vehicle.setCurrentMileage(entity.getOdometerOut());
        }

        java.time.LocalDate completionDate = entity.getCompletionDate() != null
                ? entity.getCompletionDate().toLocalDate()
                : entity.getExitDate();
        if (completionDate != null) {
            vehicle.setLastMaintenanceDate(completionDate);
        }

        vehicleRepository.save(vehicle);

        // Dar baixa definitiva dos itens e peças reservadas no almoxarifado para esta OS
        materialRequisitionService.completeWorkOrderStockDeduction(entity.getId());
    }

    /**
     * RN01 — Gera o número sequencial legível da OS, ex: OS-2026-000123.
     */
    private String generateOsNumber() {
        int currentYear = java.time.Year.now().getValue();
        long count = repository.count() + 1;
        String osNumber = String.format("OS-%d-%06d", currentYear, count);
        while (repository.existsByOsNumber(osNumber)) {
            count++;
            osNumber = String.format("OS-%d-%06d", currentYear, count);
        }
        return osNumber;
    }

    private void updateChecklistItems(FleetWorkOrder entity, List<com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO> dtoList) {
        if (dtoList == null) return;

        Map<UUID, com.z7design.fleet_manager.model.FleetWorkOrderChecklist> existingByMasterId = new HashMap<>();
        for (com.z7design.fleet_manager.model.FleetWorkOrderChecklist c : entity.getChecklistItems()) {
            if (c.getChecklistItem() != null && c.getChecklistItem().getId() != null) {
                existingByMasterId.put(c.getChecklistItem().getId(), c);
            }
        }

        Set<UUID> receivedMasterIds = new HashSet<>();

        for (com.z7design.fleet_manager.dto.FleetWorkOrderChecklistDTO cDto : dtoList) {
            if (cDto.getChecklistItemId() == null) continue;
            receivedMasterIds.add(cDto.getChecklistItemId());

            com.z7design.fleet_manager.model.FleetWorkOrderChecklist existing = existingByMasterId.get(cDto.getChecklistItemId());
            if (existing != null) {
                existing.setSituacao(cDto.getSituacao() != null ? cDto.getSituacao() : com.z7design.fleet_manager.model.FleetWorkOrderChecklist.ChecklistStatus.OK);
                existing.setObservacao(cDto.getObservacao());
                existing.setReparoRealizado(cDto.getReparoRealizado());
            } else {
                addChecklistItemToEntity(entity, cDto);
            }
        }

        entity.getChecklistItems().removeIf(c ->
                c.getChecklistItem() != null && !receivedMasterIds.contains(c.getChecklistItem().getId())
        );
    }

    private void updateItems(FleetWorkOrder entity, List<WorkOrderItemDTO> dtoList) {
        if (dtoList == null) return;

        Map<UUID, WorkOrderItem> existingById = new HashMap<>();
        for (WorkOrderItem item : entity.getItems()) {
            if (item.getId() != null) {
                existingById.put(item.getId(), item);
            }
        }

        Set<UUID> keptIds = new HashSet<>();
        BigDecimal totalParts = BigDecimal.ZERO;

        for (WorkOrderItemDTO itemDto : dtoList) {
            WorkOrderItem.ItemType itemType = itemDto.getType() != null
                    ? itemDto.getType()
                    : WorkOrderItem.ItemType.PART;

            BigDecimal qty   = itemDto.getQuantity() != null ? itemDto.getQuantity() : BigDecimal.ONE;
            BigDecimal price = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal total = price.multiply(qty);

            if (itemType == WorkOrderItem.ItemType.PART) {
                totalParts = totalParts.add(total);
            }

            String itemDesc = (itemDto.getDescription() != null && !itemDto.getDescription().isBlank())
                    ? itemDto.getDescription()
                    : (itemDto.getCode() != null && !itemDto.getCode().isBlank() ? "Item " + itemDto.getCode() : "Item de Manutenção");

            if (itemDto.getId() != null && existingById.containsKey(itemDto.getId())) {
                WorkOrderItem existing = existingById.get(itemDto.getId());
                keptIds.add(existing.getId());
                existing.setDescription(itemDesc);
                existing.setType(itemType);
                existing.setQuantity(qty);
                existing.setUnitPrice(price);
                existing.setTotalPrice(total);
                existing.setProductId(itemDto.getProductId());
                existing.setCode(itemDto.getCode());
                existing.setRequiresApproval(itemDto.getRequiresApproval() != null ? itemDto.getRequiresApproval() : false);
                existing.setApprovalReason(itemDto.getApprovalReason());
                existing.setApproved(itemDto.getApproved() != null ? itemDto.getApproved() : false);
                existing.setApprovedBy(itemDto.getApprovedBy());
                existing.setApprovedAt(itemDto.getApprovedAt());
                existing.setProvider(itemDto.getProvider());
            } else {
                consumeItemStock(itemDto.getProductId(), qty);
                WorkOrderItem newItem = WorkOrderItem.builder()
                        .workOrder(entity)
                        .description(itemDesc)
                        .type(itemType)
                        .quantity(qty)
                        .unitPrice(price)
                        .totalPrice(total)
                        .productId(itemDto.getProductId())
                        .code(itemDto.getCode())
                        .requiresApproval(itemDto.getRequiresApproval() != null ? itemDto.getRequiresApproval() : false)
                        .approvalReason(itemDto.getApprovalReason())
                        .approved(itemDto.getApproved() != null ? itemDto.getApproved() : false)
                        .approvedBy(itemDto.getApprovedBy())
                        .approvedAt(itemDto.getApprovedAt())
                        .provider(itemDto.getProvider())
                        .build();
                entity.getItems().add(newItem);
                if (newItem.getId() != null) {
                    keptIds.add(newItem.getId());
                }
            }
        }

        entity.getItems().removeIf(i -> i.getId() != null && !keptIds.contains(i.getId()));
        entity.setPartsCost(totalParts);
    }

    private void addItemToEntity(FleetWorkOrder workOrder, WorkOrderItemDTO itemDto) {
        WorkOrderItem.ItemType itemType = itemDto.getType() != null
                ? itemDto.getType()
                : WorkOrderItem.ItemType.PART;

        BigDecimal qty   = itemDto.getQuantity() != null ? itemDto.getQuantity() : BigDecimal.ONE;
        BigDecimal price = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal total = price.multiply(qty);

        String itemDesc = (itemDto.getDescription() != null && !itemDto.getDescription().isBlank())
                ? itemDto.getDescription()
                : (itemDto.getCode() != null && !itemDto.getCode().isBlank() ? "Item " + itemDto.getCode() : "Item de Manutenção");

        consumeItemStock(itemDto.getProductId(), qty);

        WorkOrderItem item = WorkOrderItem.builder()
                .workOrder(workOrder)
                .description(itemDesc)
                .type(itemType)
                .quantity(qty)
                .unitPrice(price)
                .totalPrice(total)
                .productId(itemDto.getProductId())
                .code(itemDto.getCode())
                .requiresApproval(itemDto.getRequiresApproval() != null ? itemDto.getRequiresApproval() : false)
                .approvalReason(itemDto.getApprovalReason())
                .approved(itemDto.getApproved() != null ? itemDto.getApproved() : false)
                .approvedBy(itemDto.getApprovedBy())
                .approvedAt(itemDto.getApprovedAt())
                .provider(itemDto.getProvider())
                .build();

        workOrder.getItems().add(item);
        workOrder.setPartsCost(workOrder.getPartsCost().add(total));
    }

    /**
     * Realiza a baixa de estoque tanto para itens do Almoxarifado (StockItem - tabela principal)
     * quanto para produtos legado (Product), evitando erros de "produto não encontrado".
     */
    private void consumeItemStock(UUID itemId, BigDecimal quantity) {
        if (itemId == null || quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) return;

        // 1. Tenta encontrar no Almoxarifado (StockItem)
        try {
            var stockItemOpt = stockItemRepository.findById(itemId);
            if (stockItemOpt.isPresent()) {
                var stockItem = stockItemOpt.get();
                int currentQty = stockItem.getCurrentQuantity() != null ? stockItem.getCurrentQuantity() : 0;
                int deduct = quantity.intValue();
                stockItem.setCurrentQuantity(currentQty - deduct);
                stockItemRepository.save(stockItem);
                return;
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FleetWorkOrderService.class)
                    .warn("Não foi possível atualizar saldo no Almoxarifado para item {}: {}", itemId, e.getMessage());
        }

        // 2. Fallback para tabela de produtos legado (Product)
        try {
            productService.consumeStock(itemId, quantity);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FleetWorkOrderService.class)
                    .warn("Item/Produto {} não encontrado para baixa de estoque: {}", itemId, e.getMessage());
        }
    }

    private FleetWorkOrderHistory addHistory(UUID workOrderId, String actionType,
            String description, String performedBy, String oldValue, String newValue) {
        FleetWorkOrderHistory h = FleetWorkOrderHistory.builder()
                .workOrderId(workOrderId)
                .actionType(actionType)
                .description(description)
                .performedBy(performedBy)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        return historyRepository.save(h);
    }

    private BigDecimal nullSafe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
