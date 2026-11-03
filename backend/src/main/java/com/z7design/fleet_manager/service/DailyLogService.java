package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.enums.ExtraTripReason;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyLogService {

    private final DailyLogRepository repository;
    private final VehicleRepository vehicleRepository;
    private final ClientRepository clientRepository;
    private final OdometerService odometerService;
    private final ExtraTripClassifierService extraTripClassifier;

    public List<DailyLog> findAll() {
        return repository.findAll().stream().map(this::withRelationIds).toList();
    }

    public List<DailyLog> findByDateRange(LocalDate start, LocalDate end) {
        return repository.findByDateBetween(start, end).stream().map(this::withRelationIds).toList();
    }

    public DailyLog findById(UUID id) {
        return withRelationIds(repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Daily Log not found with id: " + id)));
    }

    /**
     * Preenche os campos transientes vehicleId/clientId a partir das relações,
     * para que o frontend receba os mesmos IDs que envia.
     */
    private DailyLog withRelationIds(DailyLog dailyLog) {
        if (dailyLog == null) {
            return null;
        }
        dailyLog.setVehicleId(dailyLog.getVehicle() != null ? dailyLog.getVehicle().getId() : null);
        dailyLog.setClientId(dailyLog.getClient() != null ? dailyLog.getClient().getId() : null);
        return dailyLog;
    }

    /**
     * Resolve os IDs transientes recebidos do frontend (vehicleId/clientId) nas
     * entidades correspondentes. O formulário envia apenas os IDs, mas a coluna
     * vehicle_id é NOT NULL, então o vínculo precisa existir antes do save.
     */
    private void resolveRelations(DailyLog dailyLog) {
        if (dailyLog == null) {
            return;
        }
        if (dailyLog.getVehicle() == null && dailyLog.getVehicleId() != null) {
            vehicleRepository.findById(dailyLog.getVehicleId()).ifPresent(dailyLog::setVehicle);
        }
        if (dailyLog.getClient() == null && dailyLog.getClientId() != null) {
            clientRepository.findById(dailyLog.getClientId()).ifPresent(dailyLog::setClient);
        }
    }

    @Transactional
    public DailyLog save(DailyLog dailyLog) {
        resolveRelations(dailyLog);
        // PRD RF-05.3: classificação automática de viagens extras no apontamento
        extraTripClassifier.applyTo(dailyLog, null, null, null);
        if (Boolean.TRUE.equals(dailyLog.getExtraTrip())) {
            log.info("Parte Diária {} classificada como VIAGEM EXTRA ({}) — será enviada à tabela de Viagens Extras do BM",
                    dailyLog.getId() != null ? dailyLog.getId() : "nova",
                    dailyLog.getExtraTripReason());
        }

        DailyLog saved = repository.save(dailyLog);
        // PRD M5→M6: hodômetro do veículo atualizado pela Parte Diária + gatilho de PMP
        try {
            odometerService.updateOdometerFromDailyLog(saved);
        } catch (Exception e) {
            // Falha na integração não deve reverter o apontamento de campo
            log.error("Erro ao atualizar hodômetro a partir da Parte Diária {}: {}",
                    saved.getId(), e.getMessage(), e);
        }
        return withRelationIds(saved);
    }

    @Transactional
    public DailyLog update(UUID id, DailyLog dailyLog) {
        resolveRelations(dailyLog);
        DailyLog existing = findById(id);

        existing.setDate(dailyLog.getDate());
        if (dailyLog.getVehicle() != null) {
            existing.setVehicle(dailyLog.getVehicle());
        }
        if (dailyLog.getClient() != null) {
            existing.setClient(dailyLog.getClient());
        } else if (dailyLog.getClientId() == null) {
            existing.setClient(null);
        }
        existing.setRoute(dailyLog.getRoute());
        existing.setShift(dailyLog.getShift());
        existing.setInitialKm(dailyLog.getInitialKm());
        existing.setFinalKm(dailyLog.getFinalKm());
        existing.setDiscountedKm(dailyLog.getDiscountedKm());
        existing.setAllowance(dailyLog.getAllowance());
        existing.setNotes(dailyLog.getNotes());

        // PRD RF-05.1: campos da estrutura obrigatória da Parte Diária
        existing.setDriverName(dailyLog.getDriverName());
        existing.setStartTime(dailyLog.getStartTime());
        existing.setEndTime(dailyLog.getEndTime());
        existing.setActivityDescription(dailyLog.getActivityDescription());
        existing.setDriverSignature(dailyLog.getDriverSignature());
        if (dailyLog.getDriverSignature() != null && existing.getDriverSignedAt() == null) {
            existing.setDriverSignedAt(LocalDateTime.now());
        }

        // PRD RF-05.3: reclassifica viagem extra a cada alteração
        extraTripClassifier.applyTo(existing, null, null, null);

        DailyLog saved = repository.save(existing);
        // PRD M5→M6: hodômetro do veículo atualizado pela Parte Diária + gatilho de PMP
        try {
            odometerService.updateOdometerFromDailyLog(saved);
        } catch (Exception e) {
            log.error("Erro ao atualizar hodômetro a partir da Parte Diária {}: {}",
                    saved.getId(), e.getMessage(), e);
        }
        return withRelationIds(saved);
    }

    /**
     * RF-05.1: registra a conferência e assinatura do Fiscal da Contratante.
     * Uma Parte Diária assinada pelo fiscal é evidência incontestável para o BM.
     */
    @Transactional
    public DailyLog signByInspector(UUID id, String inspectorName, String signature) {
        DailyLog dailyLog = findById(id);
        if (inspectorName == null || inspectorName.isBlank()) {
            throw new IllegalArgumentException("Nome do fiscal da contratante é obrigatório");
        }
        dailyLog.setInspectorName(inspectorName);
        dailyLog.setInspectorSignature(signature);
        dailyLog.setInspectorSignedAt(LocalDateTime.now());
        DailyLog saved = repository.save(dailyLog);
        log.info("Parte Diária {} assinada pelo fiscal {} (contratante) — evidência válida para faturamento",
                id, inspectorName);
        return saved;
    }

    /**
     * Lista as Partes Diárias assinadas pelo fiscal no período (auditoria M7).
     */
    @Transactional(readOnly = true)
    public List<DailyLog> findSignedInPeriod(LocalDate start, LocalDate end) {
        return repository.findByDateBetween(start, end).stream()
                .filter(d -> d.getInspectorSignedAt() != null)
                .toList();
    }

    /**
     * Lista viagens extras classificadas automaticamente no período (M5 → M7).
     */
    @Transactional(readOnly = true)
    public List<DailyLog> findExtraTripsInPeriod(LocalDate start, LocalDate end) {
        return repository.findByDateBetween(start, end).stream()
                .filter(d -> Boolean.TRUE.equals(d.getExtraTrip()))
                .filter(d -> d.getExtraTripReason() != ExtraTripReason.OUTSIDE_SHIFT
                        || d.getExtraTripReason() == ExtraTripReason.OUTSIDE_SHIFT)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
