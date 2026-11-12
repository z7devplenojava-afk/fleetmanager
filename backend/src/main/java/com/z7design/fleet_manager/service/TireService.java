package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MessageRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireDismountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireMountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireRecapActionDTO;
import com.z7design.fleet_manager.dto.warehouse.VehicleTireChassisDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.TireMovementType;
import com.z7design.fleet_manager.model.enums.TireStatus;
import com.z7design.fleet_manager.model.enums.WarehouseMovementType;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TireService {

    private static final DateTimeFormatter BR_DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy - HH:mm");

    private final TireRepository tireRepository;
    private final TireMovementRepository movementRepository;
    private final VehicleRepository vehicleRepository;
    private final WarehouseMovementRepository warehouseMovementRepository;
    private final TireLifecycleConfigRepository lifecycleConfigRepository;
    private final TireFrontAxleExceptionRepository frontAxleExceptionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageService messageService;
    private final EmailService emailService;

    public List<Tire> findAll() {
        return enrichTires(tireRepository.findAll());
    }

    public List<Tire> findByCompanyId(UUID companyId) {
        List<Tire> list = (companyId == null)
                ? tireRepository.findAll()
                : tireRepository.findByCompanyId(companyId);
        return enrichTires(list);
    }

    public List<Tire> findAvailable(UUID companyId) {
        List<Tire> list = (companyId == null)
                ? tireRepository.findAll().stream().filter(t -> t.getStatus() == TireStatus.AVAILABLE).toList()
                : tireRepository.findByCompanyIdAndStatus(companyId, TireStatus.AVAILABLE);
        return enrichTires(list);
    }

    public Tire findById(UUID id) {
        Tire tire = tireRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + id));
        enrichTires(List.of(tire));
        return tire;
    }

    @Transactional
    public Tire save(Tire tire) {
        if (tire.getId() != null) {
            Tire existing = tireRepository.findById(tire.getId()).orElse(null);
            if (existing != null) {
                if (tire.getCreatedAt() == null) tire.setCreatedAt(existing.getCreatedAt());
                if (tire.getCompanyId() == null) tire.setCompanyId(existing.getCompanyId());
                if (tire.getVehicleId() == null && existing.getVehicleId() != null && tire.getStatus() == TireStatus.IN_USE) {
                    tire.setVehicleId(existing.getVehicleId());
                    tire.setAxleNumber(existing.getAxleNumber());
                    tire.setPositionIndex(existing.getPositionIndex());
                    tire.setInstallKm(existing.getInstallKm());
                    tire.setInstallDate(existing.getInstallDate());
                }
                if (tire.getInstallDate() == null && existing.getInstallDate() != null && tire.getStatus() == TireStatus.IN_USE) {
                    tire.setInstallDate(existing.getInstallDate());
                }
                if (tire.getCurrentLifeMileage() == null) {
                    tire.setCurrentLifeMileage(existing.getCurrentLifeMileage() != null ? existing.getCurrentLifeMileage() : 0);
                }
            }
        }
        if (tire.getStatus() == TireStatus.IN_USE && tire.getInstallDate() == null) {
            tire.setInstallDate(LocalDateTime.now());
        }
        if (tire.getStatus() == TireStatus.IN_USE && tire.getVehicleId() != null && tire.getInstallKm() == null) {
            vehicleRepository.findAllRawByIdIn(List.of(tire.getVehicleId())).stream().findFirst().ifPresent(v -> {
                if (v.getCurrentMileage() != null) {
                    tire.setInstallKm(v.getCurrentMileage());
                }
            });
        }
        if (tire.getRecapCount() == null) tire.setRecapCount(0);
        if (tire.getCurrentMileage() == null) tire.setCurrentMileage(0);
        if (tire.getCurrentLifeMileage() == null) tire.setCurrentLifeMileage(0);
        if (tire.getLineType() == null || tire.getLineType().isBlank()) tire.setLineType("URBANA");
        if (tire.getStatus() == null) tire.setStatus(TireStatus.AVAILABLE);

        Tire saved = tireRepository.save(tire);
        enrichTires(List.of(saved));
        return saved;
    }

    public TireLifecycleConfig getLifecycleConfig(UUID companyId) {
        if (companyId == null) {
            return TireLifecycleConfig.builder().build();
        }
        return lifecycleConfigRepository.findByCompanyId(companyId)
                .orElseGet(() -> lifecycleConfigRepository.save(
                        TireLifecycleConfig.builder().companyId(companyId).build()
                ));
    }

    @Transactional
    public TireLifecycleConfig updateLifecycleConfig(UUID companyId, TireLifecycleConfig req) {
        TireLifecycleConfig cfg = (companyId != null)
                ? lifecycleConfigRepository.findByCompanyId(companyId).orElse(TireLifecycleConfig.builder().companyId(companyId).build())
                : TireLifecycleConfig.builder().build();

        if (req.getFirstLifeMinKm() != null) cfg.setFirstLifeMinKm(req.getFirstLifeMinKm());
        if (req.getFirstLifeMaxKm() != null) cfg.setFirstLifeMaxKm(req.getFirstLifeMaxKm());
        if (req.getSecondLifeMinKm() != null) cfg.setSecondLifeMinKm(req.getSecondLifeMinKm());
        if (req.getSecondLifeMaxKm() != null) cfg.setSecondLifeMaxKm(req.getSecondLifeMaxKm());
        if (req.getThirdLifeMinKm() != null) cfg.setThirdLifeMinKm(req.getThirdLifeMinKm());
        if (req.getThirdLifeMaxKm() != null) cfg.setThirdLifeMaxKm(req.getThirdLifeMaxKm());
        if (req.getMaxRecapCount() != null) cfg.setMaxRecapCount(Math.max(1, Math.min(3, req.getMaxRecapCount())));
        if (req.getMinTreadDepthTwi() != null) cfg.setMinTreadDepthTwi(req.getMinTreadDepthTwi());
        if (req.getAlertTreadDepthMm() != null) cfg.setAlertTreadDepthMm(req.getAlertTreadDepthMm());
        if (req.getDotMaxAgeYears() != null) cfg.setDotMaxAgeYears(req.getDotMaxAgeYears());
        if (req.getUrbanCalibrationFactor() != null) cfg.setUrbanCalibrationFactor(req.getUrbanCalibrationFactor());
        if (req.getMetropolitanCalibrationFactor() != null) cfg.setMetropolitanCalibrationFactor(req.getMetropolitanCalibrationFactor());
        if (req.getRoadCalibrationFactor() != null) cfg.setRoadCalibrationFactor(req.getRoadCalibrationFactor());

        return lifecycleConfigRepository.save(cfg);
    }

    public List<TireFrontAxleException> getFrontAxleExceptions(UUID companyId, boolean activeOnly) {
        if (companyId == null) {
            List<TireFrontAxleException> all = frontAxleExceptionRepository.findAllByOrderByApprovedAtDesc();
            return activeOnly ? all.stream().filter(e -> Boolean.TRUE.equals(e.getActive())).toList() : all;
        }
        return activeOnly
                ? frontAxleExceptionRepository.findByCompanyIdAndActiveTrueOrderByApprovedAtDesc(companyId)
                : frontAxleExceptionRepository.findByCompanyIdOrderByApprovedAtDesc(companyId);
    }

    public List<TireMovement> getAllMovements(UUID companyId) {
        List<Tire> companyTires = (companyId == null) ? tireRepository.findAll() : tireRepository.findByCompanyId(companyId);
        List<TireMovement> movements;
        if (companyId == null) {
            movements = movementRepository.findTop200ByOrderByMovementDateDesc();
        } else {
            List<UUID> tireIds = companyTires.stream().map(Tire::getId).toList();
            if (tireIds.isEmpty()) return List.of();
            movements = movementRepository.findByTireIdInOrderByMovementDateDesc(tireIds);
        }
        return enrichMovements(movements, companyTires);
    }

    /**
     * Monta o pneu no eixo e posição do veículo da frota, aplicando regra crítica de segurança no eixo dianteiro.
     */
    @Transactional
    public Tire mountTire(TireMountRequestDTO req, UUID companyId, UUID userId) {
        Tire tire = tireRepository.findById(req.getTireId())
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + req.getTireId()));
        if (tire.getStatus() == TireStatus.SCRAPPED) {
            throw new BusinessException("Este pneu está SUCATEADO e não pode ser montado em veículos.");
        }
        if (tire.getStatus() == TireStatus.RECAP) {
            throw new BusinessException("Este pneu está em RECAPAGEM. Registre o retorno da recapagem antes de montar.");
        }

        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new NoSuchElementException("Veículo não encontrado com ID: " + req.getVehicleId()));

        UUID effectiveCompanyId = companyId != null ? companyId
                : (tire.getCompanyId() != null ? tire.getCompanyId() : vehicle.getCompanyId());

        // Verifica se a posição já está ocupada por outro pneu
        Optional<Tire> existingTire = tireRepository.findByVehicleIdAndAxleNumberAndPositionIndex(
                vehicle.getId(), req.getAxleNumber(), req.getPositionIndex());
        if (existingTire.isPresent() && !existingTire.get().getId().equals(tire.getId())) {
            throw new BusinessException("A posição " + req.getPositionCode() + " já está ocupada pelo pneu " +
                    existingTire.get().getSerialNumber() + ". Desmonte o pneu atual primeiro.");
        }

        // Regra Crítica de Segurança: Pneus recapados no Eixo Dianteiro (Eixo 1 - Direcional)
        User approver = null;
        int recapCount = tire.getRecapCount() != null ? tire.getRecapCount() : 0;
        boolean isFrontAxle = req.getAxleNumber() != null && req.getAxleNumber() == 1;
        boolean isRecapped = recapCount > 0;
        TireFrontAxleException pendingException = null;

        if (isFrontAxle && isRecapped) {
            approver = validateFrontAxleRecapApproval(req, userId);
            pendingException = buildFrontAxleException(effectiveCompanyId, tire, vehicle, req, approver);
        }

        int vehicleKm = req.getCurrentVehicleKm() != null && req.getCurrentVehicleKm() > 0
                ? req.getCurrentVehicleKm()
                : (vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0);

        tire.setStatus(TireStatus.IN_USE);
        tire.setVehicleId(vehicle.getId());
        tire.setAxleNumber(req.getAxleNumber());
        tire.setPositionIndex(req.getPositionIndex());
        tire.setInstallKm(vehicleKm);
        tire.setInstallDate(LocalDateTime.now());
        if (req.getTreadDepthMm() != null) {
            tire.setCurrentTreadDepth(req.getTreadDepthMm());
        }
        if (req.getLineType() != null && !req.getLineType().isBlank()) {
            tire.setLineType(req.getLineType().trim().toUpperCase());
        } else if (tire.getLineType() == null || tire.getLineType().isBlank()) {
            tire.setLineType(inferLineTypeFromVehicle(vehicle));
        }

        Tire savedTire = tireRepository.save(tire);

        // Desativa exceções anteriores desta posição ou pneu e registra a nova exceção (se aplicável)
        if (pendingException != null) {
            deactivateFrontAxleExceptions(tire.getId(), vehicle.getId(), req.getPositionCode());
            TireFrontAxleException savedException = frontAxleExceptionRepository.save(pendingException);
            dispatchFrontAxleExceptionAlert(savedException, savedTire, vehicle, approver);
            frontAxleExceptionRepository.save(savedException);
        }

        // Movimento de auditoria de Pneus
        TireMovement movement = new TireMovement();
        movement.setTireId(tire.getId());
        movement.setVehicleId(vehicle.getId());
        movement.setType(TireMovementType.INSTALLATION);
        movement.setAxleNumber(req.getAxleNumber());
        movement.setPositionIndex(req.getPositionIndex());
        movement.setPositionCode(req.getPositionCode());
        movement.setMileage(vehicleKm);
        movement.setTreadDepthMm(req.getTreadDepthMm() != null ? req.getTreadDepthMm() : tire.getCurrentTreadDepth());
        movement.setRecapCountSnapshot(recapCount);
        if (approver != null) {
            movement.setAuthorizedByUserId(approver.getId());
            movement.setAuthorizedByName(approver.getName());
        }
        movement.setNotes(req.getNotes() != null && !req.getNotes().isBlank()
                ? req.getNotes()
                : "Montagem no veículo " + formatVehicleLabel(vehicle) + " - Posição " + req.getPositionCode()
                + (approver != null ? " [EXCEÇÃO DIANTEIRO AUTORIZADA POR: " + approver.getName() + "]" : ""));
        movement.setMovementDate(LocalDateTime.now());
        movementRepository.save(movement);

        // Movimento no Almoxarifado Operacional
        if (tire.getProduct() != null) {
            WarehouseMovement whMov = WarehouseMovement.builder()
                    .companyId(effectiveCompanyId)
                    .product(tire.getProduct())
                    .movementType(WarehouseMovementType.INSTALACAO_VEICULO)
                    .quantity(BigDecimal.ONE)
                    .vehicle(vehicle)
                    .tireId(tire.getId())
                    .performedByUserId(userId)
                    .notes("Pneu " + resolveTireIdentifier(tire) + " montado no veículo " + vehicle.getPlate() + " (" + req.getPositionCode() + ")")
                    .build();
            warehouseMovementRepository.save(whMov);
        }

        enrichTires(List.of(savedTire));
        return savedTire;
    }

    /**
     * Desmonta/remove o pneu calculando o KM rodado na etapa e recalculando o CPK.
     */
    @Transactional
    public Tire dismountTire(TireDismountRequestDTO req, UUID companyId, UUID userId) {
        Tire tire = tireRepository.findById(req.getTireId())
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + req.getTireId()));
        if (tire.getStatus() != TireStatus.IN_USE) {
            throw new BusinessException("O pneu precisa estar em uso para ser desmontado. Status atual: " + tire.getStatus());
        }

        UUID effectiveCompanyId = companyId != null ? companyId : tire.getCompanyId();
        String reason = req.getRemovalReason() != null ? req.getRemovalReason() : "ESTOQUE";

        if ("ENVIAR_REFORMA".equalsIgnoreCase(reason)) {
            validateCanSendToRecap(tire, effectiveCompanyId);
        }

        UUID prevVehicleId = tire.getVehicleId();
        String prevPosCode = resolvePositionCode(tire.getAxleNumber(), tire.getPositionIndex());
        Vehicle vehicle = prevVehicleId != null ? vehicleRepository.findById(prevVehicleId).orElse(null) : null;

        int kmInstalled = tire.getInstallKm() != null ? tire.getInstallKm() : 0;
        int currentKm = req.getCurrentVehicleKm() != null ? req.getCurrentVehicleKm() : kmInstalled;
        int kmCycle = Math.max(0, currentKm - kmInstalled);

        int totalKm = (tire.getCurrentMileage() != null ? tire.getCurrentMileage() : 0) + kmCycle;
        int lifeKm = (tire.getCurrentLifeMileage() != null ? tire.getCurrentLifeMileage() : 0) + kmCycle;
        tire.setCurrentMileage(totalKm);
        tire.setCurrentLifeMileage(lifeKm);

        if (req.getTreadDepthMm() != null) {
            tire.setCurrentTreadDepth(req.getTreadDepthMm());
        }

        // Recálculo do CPK = (Custo Aquisição + Custos de Reforma) / Total KM
        recalculateCpk(tire, totalKm);

        // Define novo status
        WarehouseMovementType whType = WarehouseMovementType.REMOCAO_VEICULO;
        if ("ENVIAR_REFORMA".equalsIgnoreCase(reason)) {
            tire.setStatus(TireStatus.RECAP);
            tire.setLocationNotes("Em Oficina de Recapagem");
            whType = WarehouseMovementType.ENVIO_REFORMA;
        } else if ("DESCARTE_SUCATA".equalsIgnoreCase(reason)) {
            tire.setStatus(TireStatus.SCRAPPED);
            tire.setLocationNotes("Descartado / Sucata");
            tire.setScrapReason(req.getNotes());
            whType = WarehouseMovementType.SUCATA_DESCARTE;
        } else {
            tire.setStatus(TireStatus.AVAILABLE);
            tire.setLocationNotes("Almoxarifado Principal");
        }

        Integer prevAxle = tire.getAxleNumber();
        Integer prevIndex = tire.getPositionIndex();
        tire.setVehicleId(null);
        tire.setAxleNumber(null);
        tire.setPositionIndex(null);

        deactivateFrontAxleExceptions(tire.getId(), null, null);
        Tire savedTire = tireRepository.save(tire);

        // Registro de movimentação no histórico do pneu
        TireMovement movement = new TireMovement();
        movement.setTireId(tire.getId());
        movement.setVehicleId(prevVehicleId);
        movement.setType("ENVIAR_REFORMA".equalsIgnoreCase(reason) ? TireMovementType.RECAP_SEND
                : ("DESCARTE_SUCATA".equalsIgnoreCase(reason) ? TireMovementType.SCRAP : TireMovementType.REMOVAL));
        movement.setAxleNumber(prevAxle);
        movement.setPositionIndex(prevIndex);
        movement.setPositionCode(prevPosCode);
        movement.setMileage(currentKm);
        movement.setKmDrivenCycle(kmCycle);
        movement.setTreadDepthMm(req.getTreadDepthMm() != null ? req.getTreadDepthMm() : tire.getCurrentTreadDepth());
        movement.setRecapCountSnapshot(tire.getRecapCount() != null ? tire.getRecapCount() : 0);
        movement.setNotes(req.getNotes() != null && !req.getNotes().isBlank()
                ? req.getNotes()
                : "Removido por motivo: " + reason + " (Rodou " + kmCycle + " km)");
        movement.setMovementDate(LocalDateTime.now());
        movementRepository.save(movement);

        if (tire.getProduct() != null) {
            WarehouseMovement whMov = WarehouseMovement.builder()
                    .companyId(effectiveCompanyId)
                    .product(tire.getProduct())
                    .movementType(whType)
                    .quantity(BigDecimal.ONE)
                    .vehicle(vehicle)
                    .tireId(tire.getId())
                    .performedByUserId(userId)
                    .notes("Pneu " + resolveTireIdentifier(tire) + " removido. " + kmCycle + " km rodados. Motivo: " + reason)
                    .build();
            warehouseMovementRepository.save(whMov);
        }

        enrichTires(List.of(savedTire));
        return savedTire;
    }

    @Transactional
    public Tire sendToRecap(UUID tireId, TireRecapActionDTO req, UUID companyId) {
        Tire tire = tireRepository.findById(tireId)
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + tireId));
        if (tire.getStatus() == TireStatus.SCRAPPED) {
            throw new BusinessException("Pneu já está sucateado e não pode ser enviado para recapagem.");
        }
        if (tire.getStatus() == TireStatus.IN_USE) {
            throw new BusinessException("Desmonte o pneu do veículo antes de enviar para recapagem.");
        }
        UUID effectiveCompanyId = companyId != null ? companyId : tire.getCompanyId();
        validateCanSendToRecap(tire, effectiveCompanyId);

        tire.setStatus(TireStatus.RECAP);
        if (req != null && req.getRecapVendor() != null && !req.getRecapVendor().isBlank()) {
            tire.setRecapVendor(req.getRecapVendor().trim());
        }
        tire.setLocationNotes("Em Recapagem" + (tire.getRecapVendor() != null ? " (" + tire.getRecapVendor() + ")" : ""));
        Tire saved = tireRepository.save(tire);

        TireMovement mov = new TireMovement();
        mov.setTireId(tire.getId());
        mov.setType(TireMovementType.RECAP_SEND);
        mov.setMileage(req != null && req.getMileage() != null ? req.getMileage() : tire.getCurrentMileage());
        mov.setTreadDepthMm(req != null && req.getTreadDepthMm() != null ? req.getTreadDepthMm() : tire.getCurrentTreadDepth());
        mov.setRecapCountSnapshot(tire.getRecapCount() != null ? tire.getRecapCount() : 0);
        mov.setNotes(req != null && req.getNotes() != null && !req.getNotes().isBlank()
                ? req.getNotes()
                : "Enviado para recapagem (" + ((tire.getRecapCount() != null ? tire.getRecapCount() : 0) + 1) + "ª reforma)");
        mov.setMovementDate(LocalDateTime.now());
        movementRepository.save(mov);

        enrichTires(List.of(saved));
        return saved;
    }

    @Transactional
    public Tire returnFromRecap(UUID tireId, TireRecapActionDTO req, UUID companyId) {
        Tire tire = tireRepository.findById(tireId)
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + tireId));
        if (tire.getStatus() == TireStatus.SCRAPPED) {
            throw new BusinessException("Pneu sucateado não pode retornar de recapagem.");
        }
        UUID effectiveCompanyId = companyId != null ? companyId : tire.getCompanyId();
        validateCanSendToRecap(tire, effectiveCompanyId);

        int nextRecap = (tire.getRecapCount() != null ? tire.getRecapCount() : 0) + 1;
        tire.setRecapCount(nextRecap);
        tire.setStatus(TireStatus.AVAILABLE);
        tire.setCurrentLifeMileage(0); // Reinicia contador desta nova vida mantendo currentMileage acumulado
        tire.setLastRecapDate(LocalDateTime.now());

        if (req != null) {
            if (req.getTreadDepthMm() != null) {
                tire.setCurrentTreadDepth(req.getTreadDepthMm());
            } else {
                tire.setCurrentTreadDepth(new BigDecimal("15.00"));
            }
            if (req.getRecapVendor() != null && !req.getRecapVendor().isBlank()) {
                tire.setRecapVendor(req.getRecapVendor().trim());
            }
            if (req.getRecapCost() != null && req.getRecapCost().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentRepairs = tire.getTotalRepairCost() != null ? tire.getTotalRepairCost() : BigDecimal.ZERO;
                tire.setTotalRepairCost(currentRepairs.add(req.getRecapCost()));
                recalculateCpk(tire, tire.getCurrentMileage() != null ? tire.getCurrentMileage() : 0);
            }
            tire.setLocationNotes(req.getLocationNotes() != null && !req.getLocationNotes().isBlank()
                    ? req.getLocationNotes().trim()
                    : "Almoxarifado Principal");
        } else {
            tire.setLocationNotes("Almoxarifado Principal");
        }

        Tire saved = tireRepository.save(tire);

        TireMovement mov = new TireMovement();
        mov.setTireId(tire.getId());
        mov.setType(TireMovementType.RECAP_RETURN);
        mov.setMileage(tire.getCurrentMileage() != null ? tire.getCurrentMileage() : 0);
        mov.setTreadDepthMm(tire.getCurrentTreadDepth());
        mov.setRecapCountSnapshot(nextRecap);
        mov.setNotes(req != null && req.getNotes() != null && !req.getNotes().isBlank()
                ? req.getNotes()
                : "Retorno da " + nextRecap + "ª Recapagem (Contador de vida reiniciado; KM total preservado)");
        mov.setMovementDate(LocalDateTime.now());
        movementRepository.save(mov);

        enrichTires(List.of(saved));
        return saved;
    }

    @Transactional
    public Tire scrapTire(UUID tireId, TireRecapActionDTO req) {
        Tire tire = tireRepository.findById(tireId)
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + tireId));

        UUID prevVehicleId = tire.getVehicleId();
        tire.setStatus(TireStatus.SCRAPPED);
        tire.setVehicleId(null);
        tire.setAxleNumber(null);
        tire.setPositionIndex(null);
        tire.setLocationNotes("Sucata / Descartado");
        if (req != null && req.getScrapReason() != null && !req.getScrapReason().isBlank()) {
            tire.setScrapReason(req.getScrapReason().trim());
        } else if (req != null && req.getNotes() != null && !req.getNotes().isBlank()) {
            tire.setScrapReason(req.getNotes().trim());
        }

        deactivateFrontAxleExceptions(tire.getId(), null, null);
        Tire saved = tireRepository.save(tire);

        TireMovement mov = new TireMovement();
        mov.setTireId(tire.getId());
        mov.setVehicleId(prevVehicleId);
        mov.setType(TireMovementType.SCRAP);
        mov.setMileage(tire.getCurrentMileage() != null ? tire.getCurrentMileage() : 0);
        mov.setTreadDepthMm(tire.getCurrentTreadDepth());
        mov.setRecapCountSnapshot(tire.getRecapCount() != null ? tire.getRecapCount() : 0);
        mov.setNotes(tire.getScrapReason() != null ? "Sucateamento: " + tire.getScrapReason() : "Pneu sucateado por fim de vida útil");
        mov.setMovementDate(LocalDateTime.now());
        movementRepository.save(mov);

        enrichTires(List.of(saved));
        return saved;
    }

    /**
     * Mapeia o chassi do veículo com todos os pneus montados em cada posição.
     *
     * <p>A configuração é inferida a partir do tipo de veículo e da quantidade de
     * eixos ({@code axleCount}), mas sempre respeita os pneus já montados — assim
     * um veículo com rodado duplo ou com terceiro eixo nunca perde posições.</p>
     */
    public VehicleTireChassisDTO getVehicleChassis(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NoSuchElementException("Veículo não encontrado com ID: " + vehicleId));

        List<Tire> mountedTires = enrichTires(tireRepository.findByVehicleId(vehicleId));
        Map<String, Tire> tireByPos = new HashMap<>();
        int highestMountedAxle = 0;
        boolean mountedDualRear = false;
        for (Tire t : mountedTires) {
            String key = t.getAxleNumber() + "-" + t.getPositionIndex();
            tireByPos.put(key, t);
            if (t.getAxleNumber() != null && t.getAxleNumber() > highestMountedAxle) {
                highestMountedAxle = t.getAxleNumber();
            }
            if (t.getAxleNumber() != null && t.getAxleNumber() >= 2
                    && t.getPositionIndex() != null && t.getPositionIndex() >= 2) {
                mountedDualRear = true;
            }
        }

        ChassisLayout layout = resolveChassisLayout(vehicle, highestMountedAxle, mountedDualRear);
        List<VehicleTireChassisDTO.MountedPositionDTO> positions = new ArrayList<>();

        // Eixo 1 — direcional (sempre rodado simples)
        positions.add(position("DE", 1, 0, "Dianteiro Esquerdo", tireByPos));
        positions.add(position("DD", 1, 1, "Dianteiro Direito", tireByPos));

        if (layout.dualRear()) {
            for (int axle = 2; axle <= layout.axleCount(); axle++) {
                boolean driven = axle == 2 || ("6x4".equals(layout.type()) && axle == 3);
                addDualAxle(positions, axle, driven, tireByPos);
            }
        } else {
            positions.add(position("TSE", 2, 0, "Traseiro Esquerdo", tireByPos));
            positions.add(position("TSD", 2, 1, "Traseiro Direito", tireByPos));
            for (int axle = 3; axle <= layout.axleCount(); axle++) {
                positions.add(position("T" + axle + "SE", axle, 0, axle + "º Traseiro Esquerdo", tireByPos));
                positions.add(position("T" + axle + "SD", axle, 1, axle + "º Traseiro Direito", tireByPos));
            }
        }

        positions.add(position("ESTEPE", 0, 0, "Estepe", tireByPos));

        int tireCount = (int) positions.stream()
                .filter(p -> p.getAxleNumber() != null && p.getAxleNumber() > 0)
                .count();

        return VehicleTireChassisDTO.builder()
                .vehicleId(vehicle.getId())
                .plate(vehicle.getPlate())
                .model(vehicle.getModel())
                .chassiType(layout.type())
                .vehicleType(vehicle.getVehicleType() != null ? vehicle.getVehicleType().name() : null)
                .axleCount(layout.axleCount())
                .dualRear(layout.dualRear())
                .layoutLabel(layout.label())
                .tireCount(tireCount)
                .currentKm(vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0)
                .positions(positions)
                .build();
    }

    private VehicleTireChassisDTO.MountedPositionDTO position(String code, int axle, int index, String name,
                                                               Map<String, Tire> tireByPos) {
        return VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode(code)
                .axleNumber(axle)
                .positionIndex(index)
                .positionName(name)
                .tire(tireByPos.get(axle + "-" + index))
                .build();
    }

    private void addDualAxle(List<VehicleTireChassisDTO.MountedPositionDTO> positions, int axle,
                             boolean driven, Map<String, Tire> tireByPos) {
        String prefix = axle == 2 ? "T" : axle == 3 ? "A" : "B";
        String label = axle == 2 ? "Tração" : (driven ? "2ª Tração" : "Eixo Auxiliar");
        positions.add(position(prefix + "OE", axle, 0, label + " Externo Esquerdo", tireByPos));
        positions.add(position(prefix + "IE", axle, 1, label + " Interno Esquerdo", tireByPos));
        positions.add(position(prefix + "ID", axle, 2, label + " Interno Direito", tireByPos));
        positions.add(position(prefix + "OD", axle, 3, label + " Externo Direito", tireByPos));
    }

    private ChassisLayout resolveChassisLayout(Vehicle vehicle, int highestMountedAxle, boolean mountedDualRear) {
        int declaredAxles = vehicle.getAxleCount() != null && vehicle.getAxleCount() > 0
                ? vehicle.getAxleCount() : 0;
        int axleCount = declaredAxles > 0 ? declaredAxles : inferAxleCount(vehicle);
        if (highestMountedAxle > axleCount) {
            axleCount = highestMountedAxle;
        }
        axleCount = Math.min(Math.max(axleCount, 2), 4);

        boolean dualRear = mountedDualRear || inferDualRear(vehicle);
        boolean tagAxle = axleCount >= 3 && isTagAxle(vehicle);

        String type;
        String label;
        if (axleCount >= 4) {
            type = "8x2";
            label = "8x2 — " + axleCount + " eixos, rodado duplo";
        } else if (axleCount == 3) {
            type = tagAxle ? "6x2" : "6x4";
            label = tagAxle
                    ? "6x2 — 3 eixos, rodado duplo com eixo auxiliar"
                    : "6x4 — 3 eixos, tração dupla";
        } else {
            type = "4x2";
            label = dualRear
                    ? "4x2 — rodado duplo no eixo traseiro"
                    : "4x2 — rodado simples";
        }
        return new ChassisLayout(axleCount, dualRear, tagAxle, type, label);
    }

    private int inferAxleCount(Vehicle vehicle) {
        Vehicle.BusType busType = vehicle.getBusType();
        if (busType == Vehicle.BusType.BIARTICULADO) {
            // Biarticulado: 4 eixos (dianteiro + tração + 2 auxiliares).
            return 4;
        }
        if (busType == Vehicle.BusType.DOUBLE_DECKER || busType == Vehicle.BusType.ARTICULADO) {
            return 3;
        }
        Vehicle.VehicleType type = vehicle.getVehicleType();
        if (type == Vehicle.VehicleType.BUS_ROAD || type == Vehicle.VehicleType.BUS_LUXURY_TOURISM) {
            return 3;
        }
        if (type == Vehicle.VehicleType.TRUCK && vehicle.getTotalWeightKg() != null
                && vehicle.getTotalWeightKg() >= 16000) {
            return 3;
        }
        return 2;
    }

    private boolean inferDualRear(Vehicle vehicle) {
        Vehicle.VehicleType type = vehicle.getVehicleType();
        if (type == null) {
            return vehicle.getBusType() != null || vehicle.getTotalWeightKg() != null;
        }
        return switch (type) {
            case VAN, CAR, CAR_UTILITY, PICKUP, SUV, MOTORCYCLE -> false;
            default -> true;
        };
    }

    private boolean isTagAxle(Vehicle vehicle) {
        if (vehicle.getVehicleType() == Vehicle.VehicleType.TRUCK) {
            Integer totalWeight = vehicle.getTotalWeightKg();
            return totalWeight == null || totalWeight < 23000;
        }
        if (vehicle.getBusType() != null) {
            return true;
        }
        Vehicle.VehicleType type = vehicle.getVehicleType();
        if (type == null) {
            return false;
        }
        // Ônibus, micro-ônibus e articulados usam eixo auxiliar (tag) na traseira.
        return switch (type) {
            case BUS_ROAD, BUS_URBAN, BUS, BUS_INTERCITY, BUS_LUXURY_TOURISM,
                 MINIBUS, MICROBUS, MICRO_ONIBUS -> true;
            default -> false;
        };
    }

    private record ChassisLayout(int axleCount, boolean dualRear, boolean tagAxle, String type, String label) {
    }


    @Transactional
    public TireMovement registerMovement(TireMovement movement) {
        Tire tire = tireRepository.findById(movement.getTireId())
                .orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + movement.getTireId()));

        if (movement.getType() == TireMovementType.RECAP_SEND) {
            validateCanSendToRecap(tire, tire.getCompanyId());
            tire.setStatus(TireStatus.RECAP);
        } else if (movement.getType() == TireMovementType.RECAP_RETURN) {
            validateCanSendToRecap(tire, tire.getCompanyId());
            tire.setStatus(TireStatus.AVAILABLE);
            tire.setRecapCount((tire.getRecapCount() != null ? tire.getRecapCount() : 0) + 1);
            tire.setCurrentLifeMileage(0);
            tire.setLastRecapDate(LocalDateTime.now());
        } else if (movement.getType() == TireMovementType.INSTALLATION) {
            if (movement.getAxleNumber() != null && movement.getAxleNumber() == 1
                    && tire.getRecapCount() != null && tire.getRecapCount() > 0) {
                throw new BusinessException("Alocação de pneu recapado no eixo dianteiro deve usar o fluxo de liberação com senha do Gestor e Termo de Ciência.");
            }
            tire.setStatus(TireStatus.IN_USE);
            tire.setVehicleId(movement.getVehicleId());
            tire.setAxleNumber(movement.getAxleNumber());
            tire.setPositionIndex(movement.getPositionIndex());
        } else if (movement.getType() == TireMovementType.REMOVAL) {
            tire.setStatus(TireStatus.AVAILABLE);
            tire.setVehicleId(null);
            tire.setAxleNumber(null);
            tire.setPositionIndex(null);
            deactivateFrontAxleExceptions(tire.getId(), null, null);
        } else if (movement.getType() == TireMovementType.SCRAP) {
            tire.setStatus(TireStatus.SCRAPPED);
            tire.setVehicleId(null);
            tire.setAxleNumber(null);
            tire.setPositionIndex(null);
            deactivateFrontAxleExceptions(tire.getId(), null, null);
        }

        movement.setRecapCountSnapshot(tire.getRecapCount());
        tireRepository.save(tire);
        return movementRepository.save(movement);
    }

    public List<TireMovement> getHistory(UUID tireId) {
        List<TireMovement> list = movementRepository.findByTireIdOrderByMovementDateDesc(tireId);
        Optional<Tire> tireOpt = tireRepository.findById(tireId);
        return enrichMovements(list, tireOpt.map(List::of).orElse(List.of()));
    }

    @Transactional
    public void delete(UUID id) {
        tireRepository.deleteById(id);
    }

    // ==================== HELPERS PRIVADOS ====================

    private void validateCanSendToRecap(Tire tire, UUID companyId) {
        TireLifecycleConfig cfg = getLifecycleConfig(companyId);
        int maxRecap = cfg.getMaxRecapCount() != null ? cfg.getMaxRecapCount() : 2;
        int currentRecaps = tire.getRecapCount() != null ? tire.getRecapCount() : 0;
        if (currentRecaps >= maxRecap) {
            throw new BusinessException(String.format(
                    "BLOQUEIO DE 3ª RECAPAGEM: O pneu %s já passou por %d recapagem(ns) (limite padrão: %d recapagens). " +
                    "Por segurança da carcaça, não é permitido enviar para uma nova reforma — realize o sucateamento.",
                    resolveTireIdentifier(tire), currentRecaps, maxRecap));
        }
    }

    private User validateFrontAxleRecapApproval(TireMountRequestDTO req, UUID currentUserId) {
        if (!Boolean.TRUE.equals(req.getRiskTermAccepted())) {
            throw new BusinessException("Termo de Ciência de Risco obrigatório: marque a declaração assumindo ciência dos riscos operacionais e de dirigibilidade no eixo dianteiro.");
        }
        if (req.getApproverPassword() == null || req.getApproverPassword().isBlank()) {
            throw new BusinessException("Alçada de Aprovação obrigatória: informe a senha do Gestor de Manutenção ou Administrador para liberar pneu recapado no eixo dianteiro.");
        }

        User approver = null;
        if (req.getApproverUsernameOrEmail() != null && !req.getApproverUsernameOrEmail().isBlank()) {
            String ident = req.getApproverUsernameOrEmail().trim();
            String digits = ident.replaceAll("\\D", "");
            approver = userRepository.findByIdentifierNative(ident, digits).orElse(null);
        } else if (currentUserId != null) {
            approver = userRepository.findByIdNative(currentUserId).orElse(null);
        }

        if (approver == null) {
            throw new BusinessException("Usuário autorizador não encontrado para validação de alçada.");
        }
        if (!approver.isActive()) {
            throw new BusinessException("Usuário autorizador está inativo no sistema.");
        }
        if (!passwordEncoder.matches(req.getApproverPassword(), approver.getPassword())) {
            throw new BusinessException("Senha de autorização incorreta para o usuário " + approver.getName() + ".");
        }
        if (!hasFrontAxleApprovalAuthority(approver)) {
            throw new BusinessException("O usuário " + approver.getName() + " não possui alçada (Gestor de Manutenção, Encarregado, Diretoria ou Administrador) para autorizar pneu recapado no eixo dianteiro.");
        }
        return approver;
    }

    private boolean hasFrontAxleApprovalAuthority(User user) {
        if (user.getRoles() == null) return false;
        for (Role r : user.getRoles()) {
            String rn = r.getName() != null ? r.getName().toUpperCase() : "";
            if (rn.contains("ADMIN")
                    || rn.contains("MANUTENCAO")
                    || rn.contains("TRANSPORTE")
                    || rn.contains("OPERAC")
                    || rn.contains("DIRETOR")
                    || rn.contains("GEREN")
                    || rn.equals("GESTOR")) {
                return true;
            }
        }
        return false;
    }

    private TireFrontAxleException buildFrontAxleException(
            UUID companyId, Tire tire, Vehicle vehicle, TireMountRequestDTO req, User approver) {
        String approverRoles = approver.getRoles() != null
                ? approver.getRoles().stream().map(Role::getName).collect(Collectors.joining(", "))
                : "GESTOR";
        int km = req.getCurrentVehicleKm() != null && req.getCurrentVehicleKm() > 0
                ? req.getCurrentVehicleKm()
                : (vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0);

        return TireFrontAxleException.builder()
                .companyId(companyId)
                .tireId(tire.getId())
                .vehicleId(vehicle.getId())
                .vehiclePlate(vehicle.getPlate())
                .vehicleFleetNumber(vehicle.getFleetNumber())
                .axleNumber(req.getAxleNumber() != null ? req.getAxleNumber() : 1)
                .positionCode(req.getPositionCode() != null ? req.getPositionCode() : resolvePositionCode(1, req.getPositionIndex()))
                .tireFireNumber(tire.getFireNumber())
                .tireSerialNumber(tire.getSerialNumber())
                .recapCount(tire.getRecapCount() != null ? tire.getRecapCount() : 1)
                .vehicleKmAtMount(km)
                .authorizedByUserId(approver.getId())
                .authorizedByName(approver.getName())
                .authorizedByRole(approverRoles)
                .riskAcknowledged(Boolean.TRUE)
                .notes(req.getNotes())
                .active(Boolean.TRUE)
                .approvedAt(LocalDateTime.now())
                .build();
    }

    private void deactivateFrontAxleExceptions(UUID tireId, UUID vehicleId, String positionCode) {
        if (tireId != null) {
            List<TireFrontAxleException> byTire = frontAxleExceptionRepository.findByTireIdAndActiveTrue(tireId);
            for (TireFrontAxleException ex : byTire) {
                ex.setActive(Boolean.FALSE);
                ex.setClearedAt(LocalDateTime.now());
            }
            if (!byTire.isEmpty()) frontAxleExceptionRepository.saveAll(byTire);
        }
        if (vehicleId != null && positionCode != null) {
            List<TireFrontAxleException> byPos = frontAxleExceptionRepository
                    .findByVehicleIdAndPositionCodeAndActiveTrue(vehicleId, positionCode);
            for (TireFrontAxleException ex : byPos) {
                ex.setActive(Boolean.FALSE);
                ex.setClearedAt(LocalDateTime.now());
            }
            if (!byPos.isEmpty()) frontAxleExceptionRepository.saveAll(byPos);
        }
    }

    private void dispatchFrontAxleExceptionAlert(
            TireFrontAxleException ex, Tire tire, Vehicle vehicle, User approver) {
        String vehiclePrefix = formatVehicleLabel(vehicle);
        String tireLabel = resolveTireIdentifier(tire);
        String recapLabel = ex.getRecapCount() + "ª Recapagem";
        String posLabel = ex.getPositionCode() != null ? "Dianteiro (Direcional - " + ex.getPositionCode() + ")" : "Dianteiro (Direcional)";
        String formattedKm = String.format("%,d", ex.getVehicleKmAtMount() != null ? ex.getVehicleKmAtMount() : 0).replace(',', '.');
        String approvedAtStr = ex.getApprovedAt().format(BR_DATE_TIME_FORMAT);

        String subject = "[ALERTA DE SEGURANÇA] Alocação de Pneu Recapado no Eixo Dianteiro – Veículo " + vehiclePrefix;

        String plainText = String.format(
                "Prezada Diretoria e Gerência de Operações,\n\n" +
                "Este é um alerta automático gerado pelo módulo de Controle de Pneus.\n" +
                "Foi registrada no sistema uma exceção operacional de alto risco envolvendo a montagem de um pneu que viola as recomendações padrão de segurança.\n\n" +
                "Detalhes da Operação:\n" +
                "• Veículo/Ônibus: %s\n" +
                "• Eixo de Destino: %s\n" +
                "• Pneu Instalado: ID %s\n" +
                "• Status do Pneu: Recapado (%s)\n" +
                "• Quilometragem Atual do Veículo: %s km\n\n" +
                "Responsável pela Liberação:\n" +
                "• Gestor que autorizou: %s (%s)\n" +
                "• Data e Hora: %s\n\n" +
                "O gestor responsável marcou digitalmente o Termo de Ciência de Risco exigido pelo sistema, assumindo a responsabilidade pela dirigibilidade e segurança do veículo nesta condição excepcional.\n" +
                "Esta operação já se encontra registrada no painel de Relatório de Exceções para futuras auditorias.\n\n" +
                "Atenciosamente,\nMódulo de Gestão de Frotas",
                vehiclePrefix, posLabel, tireLabel, recapLabel, formattedKm,
                ex.getAuthorizedByName(), ex.getAuthorizedByRole(), approvedAtStr);

        String htmlBody = String.format(
                "<div style='font-family:Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #dc2626;border-radius:8px;overflow:hidden'>" +
                "<div style='background:#991b1b;color:#fff;padding:16px 20px'><strong>⚠️ ALERTA DE SEGURANÇA — EIXO DIANTEIRO (DIRECIONAL)</strong></div>" +
                "<div style='padding:20px;background:#ffffff;color:#1f2937;font-size:14px;line-height:1.5'>" +
                "<p>Prezada Diretoria e Gerência de Operações,</p>" +
                "<p>Este é um alerta automático gerado pelo módulo de Controle de Pneus. Foi registrada no sistema uma <strong>exceção operacional de alto risco</strong> envolvendo a montagem de um pneu recapado no eixo dianteiro.</p>" +
                "<div style='background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0'>" +
                "<p style='margin:0 0 6px'><strong>Detalhes da Operação:</strong></p>" +
                "<ul style='margin:0;padding-left:18px'>" +
                "<li><strong>Veículo/Ônibus:</strong> %s</li>" +
                "<li><strong>Eixo de Destino:</strong> %s</li>" +
                "<li><strong>Pneu Instalado:</strong> ID %s</li>" +
                "<li><strong>Status do Pneu:</strong> Recapado (%s)</li>" +
                "<li><strong>Quilometragem Atual do Veículo:</strong> %s km</li>" +
                "</ul></div>" +
                "<div style='background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;margin:16px 0;border-radius:6px'>" +
                "<p style='margin:0 0 6px'><strong>Responsável pela Liberação:</strong></p>" +
                "<ul style='margin:0;padding-left:18px'>" +
                "<li><strong>Gestor que autorizou:</strong> %s (%s)</li>" +
                "<li><strong>Data e Hora:</strong> %s</li>" +
                "</ul></div>" +
                "<p>O gestor responsável marcou digitalmente o <strong>Termo de Ciência de Risco</strong> exigido pelo sistema, assumindo a responsabilidade pela dirigibilidade e segurança do veículo nesta condição excepcional.</p>" +
                "<p style='color:#6b7280;font-size:12px'>Esta operação já se encontra registrada no painel de Relatório de Exceções para futuras auditorias.</p>" +
                "</div></div>",
                vehiclePrefix, posLabel, tireLabel, recapLabel, formattedKm,
                ex.getAuthorizedByName(), ex.getAuthorizedByRole(), approvedAtStr);

        try {
            List<User> recipients = userRepository.findTireSafetyNotificationRecipients(ex.getCompanyId());
            if (!recipients.isEmpty()) {
                Set<UUID> recipientIds = recipients.stream().map(User::getId).collect(Collectors.toSet());
                User sender = approver;
                if (sender == null) {
                    sender = userRepository.findSystemMessageSenderCandidates().stream().findFirst().orElse(recipients.get(0));
                }

                MessageRequestDTO msgDto = new MessageRequestDTO();
                msgDto.setTitle(subject);
                msgDto.setContent(plainText);
                msgDto.setType(MessageType.INDIVIDUAL);
                msgDto.setPriority(MessagePriority.URGENT);
                msgDto.setRecipientIds(recipientIds);
                msgDto.setSendNotification(true);
                msgDto.setSendEmail(false);
                messageService.createMessage(msgDto, sender);
                ex.setMessageSent(Boolean.TRUE);

                Set<String> sentEmails = new HashSet<>();
                boolean anyEmailSent = false;
                for (User r : recipients) {
                    if (r.getEmail() != null && !r.getEmail().isBlank() && sentEmails.add(r.getEmail().trim().toLowerCase())) {
                        try {
                            if (emailService.sendEmailWithAttachment(r.getEmail().trim(), subject, htmlBody, null, null)) {
                                anyEmailSent = true;
                            }
                        } catch (Exception emailEx) {
                            log.warn("Falha ao enviar e-mail de alerta do eixo dianteiro para {}: {}", r.getEmail(), emailEx.getMessage());
                        }
                    }
                }
                ex.setEmailSent(anyEmailSent);
            }
        } catch (Exception e) {
            log.error("Erro ao disparar notificação/mensagem de exceção do eixo dianteiro: {}", e.getMessage(), e);
        }
    }

    private List<Tire> enrichTires(List<Tire> tires) {
        if (tires == null || tires.isEmpty()) return List.of();
        Set<UUID> vehicleIds = tires.stream()
                .map(Tire::getVehicleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, Vehicle> vehicleMap = vehicleIds.isEmpty()
                ? Map.of()
                : vehicleRepository.findAllRawByIdIn(vehicleIds).stream().collect(Collectors.toMap(Vehicle::getId, v -> v));

        for (Tire t : tires) {
            t.setVehicle(null);
            if (t.getVehicleId() != null && vehicleMap.containsKey(t.getVehicleId())) {
                Vehicle v = vehicleMap.get(t.getVehicleId());
                t.setVehiclePlate(v.getPlate());
                t.setVehicleFleetNumber(v.getFleetNumber());
                t.setVehicleCurrentMileage(v.getCurrentMileage());
                t.setVehicleModel(v.getModel());
                t.setVehicleRouteName(v.getRouteName());
            }
        }
        return tires;
    }

    private List<TireMovement> enrichMovements(List<TireMovement> movements, List<Tire> knownTires) {
        if (movements == null || movements.isEmpty()) return List.of();
        Map<UUID, Tire> tireMap = knownTires.stream().collect(Collectors.toMap(Tire::getId, t -> t, (a, b) -> a));

        Set<UUID> missingTireIds = movements.stream()
                .map(TireMovement::getTireId)
                .filter(id -> id != null && !tireMap.containsKey(id))
                .collect(Collectors.toSet());
        if (!missingTireIds.isEmpty()) {
            tireRepository.findAllById(missingTireIds).forEach(t -> tireMap.put(t.getId(), t));
        }

        Set<UUID> vehicleIds = movements.stream().map(TireMovement::getVehicleId).filter(Objects::nonNull).collect(Collectors.toSet());
        tireMap.values().stream().map(Tire::getVehicleId).filter(Objects::nonNull).forEach(vehicleIds::add);

        Map<UUID, Vehicle> vehicleMap = vehicleIds.isEmpty()
                ? Map.of()
                : vehicleRepository.findAllRawByIdIn(vehicleIds).stream().collect(Collectors.toMap(Vehicle::getId, v -> v));

        for (TireMovement m : movements) {
            Tire t = tireMap.get(m.getTireId());
            if (t != null) {
                m.setTireSerialNumber(t.getSerialNumber());
                m.setTireFireNumber(t.getFireNumber());
                m.setTireBrand(t.getBrand());
                m.setTireModel(t.getModel());
                m.setTireSize(t.getSize());
                m.setTireRecapCount(t.getRecapCount());
                m.setTireCurrentMileage(t.getCurrentMileage());
                m.setTireCurrentLifeMileage(t.getCurrentLifeMileage());
                m.setTireCurrentTreadDepth(t.getCurrentTreadDepth());
            }
            UUID vId = m.getVehicleId() != null ? m.getVehicleId() : (t != null ? t.getVehicleId() : null);
            if (vId != null && vehicleMap.containsKey(vId)) {
                Vehicle v = vehicleMap.get(vId);
                m.setVehiclePlate(v.getPlate());
                m.setVehicleFleetNumber(v.getFleetNumber());
                m.setVehicleCurrentMileage(v.getCurrentMileage());
            }
            if ((m.getPositionCode() == null || m.getPositionCode().isBlank()) && m.getAxleNumber() != null) {
                m.setPositionCode(resolvePositionCode(m.getAxleNumber(), m.getPositionIndex()));
            }
        }
        return movements;
    }

    private void recalculateCpk(Tire tire, int totalKm) {
        if (totalKm <= 0) return;
        BigDecimal acquisition = tire.getAcquisitionCost() != null ? tire.getAcquisitionCost() : BigDecimal.ZERO;
        BigDecimal repairs = tire.getTotalRepairCost() != null ? tire.getTotalRepairCost() : BigDecimal.ZERO;
        BigDecimal totalCost = acquisition.add(repairs);
        tire.setCpk(totalCost.divide(BigDecimal.valueOf(totalKm), 4, RoundingMode.HALF_UP));
    }

    private String resolveTireIdentifier(Tire t) {
        if (t.getFireNumber() != null && !t.getFireNumber().isBlank()) {
            return "Fogo " + t.getFireNumber() + " (" + t.getSerialNumber() + ")";
        }
        return t.getSerialNumber();
    }

    private String formatVehicleLabel(Vehicle v) {
        if (v.getFleetNumber() != null && !v.getFleetNumber().isBlank()) {
            return "Frota " + v.getFleetNumber() + " (" + v.getPlate() + ")";
        }
        return v.getPlate();
    }

    private String inferLineTypeFromVehicle(Vehicle v) {
        if (v.getBusType() != null) {
            String bt = v.getBusType().name().toUpperCase();
            if (bt.contains("RODOVIARIO") || bt.contains("FRETAMENTO")) return "RODOVIARIA";
            if (bt.contains("METROPOLIT")) return "METROPOLITANA";
        }
        return "URBANA";
    }

    private String resolvePositionCode(Integer axle, Integer posIndex) {
        if (axle == null) return null;
        int p = posIndex != null ? posIndex : 0;
        if (axle == 0) return "ESTEPE";
        if (axle == 1) return p == 0 ? "DE" : "DD";
        if (axle == 2) {
            return switch (p) {
                case 0 -> "TOE";
                case 1 -> "TIE";
                case 2 -> "TID";
                case 3 -> "TOD";
                default -> "E2-" + p;
            };
        }
        if (axle == 3) {
            return switch (p) {
                case 0 -> "AOE";
                case 1 -> "AIE";
                case 2 -> "AID";
                case 3 -> "AOD";
                default -> "E3-" + p;
            };
        }
        if (axle == 4) {
            return switch (p) {
                case 0 -> "BOE";
                case 1 -> "BIE";
                case 2 -> "BID";
                case 3 -> "BOD";
                default -> "E4-" + p;
            };
        }
        return "E" + axle + "-" + p;
    }
}
