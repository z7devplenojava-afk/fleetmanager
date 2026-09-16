package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.enums.TelemetryReconciliationStatus;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 5 (RF-05.2): Conciliação com Rastreamento Satelital.
 *
 * O sistema importa os dados do rastreador via satélite e confronta o KM
 * rodado anotado no papel com a telemetria do veículo, apontando divergências
 * superiores a 5%.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryReconciliationService {

    private final DailyLogRepository dailyLogRepository;

    /** Tolerância PRD: divergências superiores a 5% são apontadas. */
    private static final BigDecimal DIVERGENCE_THRESHOLD = new BigDecimal("0.05");

    /**
     * Importa o KM da telemetria para uma Parte Diária e realiza a conciliação.
     *
     * @param dailyLogId      Parte Diária
     * @param telemetryKm     KM rodado reportado pelo rastreador
     * @param telemetrySource origem do dado (ex.: "Sascar", "Onixsat", "Samsara")
     * @return Parte Diária atualizada com o resultado da conciliação
     */
    @Transactional
    public DailyLog importTelemetryKm(UUID dailyLogId, Integer telemetryKm, String telemetrySource) {
        if (telemetryKm == null || telemetryKm < 0) {
            throw new IllegalArgumentException("KM da telemetria deve ser maior ou igual a zero");
        }

        DailyLog dailyLog = dailyLogRepository.findById(dailyLogId)
                .orElseThrow(() -> new ResourceNotFoundException("Parte Diária não encontrada com ID: " + dailyLogId));

        if (dailyLog.getTotalKmRun() == null || dailyLog.getTotalKmRun() <= 0) {
            throw new IllegalArgumentException("Parte Diária sem KM rodado válido para conciliar");
        }

        int diffKm = telemetryKm - dailyLog.getTotalKmRun();
        BigDecimal diffPct = BigDecimal.valueOf(Math.abs(diffKm))
                .divide(BigDecimal.valueOf(dailyLog.getTotalKmRun()), 4, RoundingMode.HALF_UP);

        TelemetryReconciliationStatus status = diffPct.compareTo(DIVERGENCE_THRESHOLD) > 0
                ? TelemetryReconciliationStatus.DIVERGENT
                : TelemetryReconciliationStatus.WITHIN_TOLERANCE;

        dailyLog.setTelemetryKm(telemetryKm);
        dailyLog.setTelemetryDiffKm(diffKm);
        dailyLog.setTelemetryDiffPct(diffPct);
        dailyLog.setTelemetryStatus(status);
        dailyLog.setTelemetryImportedAt(LocalDateTime.now());
        dailyLog.setTelemetrySource(telemetrySource != null ? telemetrySource : "Importação manual");

        DailyLog saved = dailyLogRepository.save(dailyLog);
        if (status == TelemetryReconciliationStatus.DIVERGENT) {
            log.warn("DIVERGÊNCIA >5%: Parte Diária {} (veículo {}) — papel {} km × telemetria {} km (+/-{}%)",
                    dailyLogId, saved.getVehiclePlate(), saved.getTotalKmRun(), telemetryKm,
                    diffPct.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));
        } else {
            log.info("Conciliação OK: Parte Diária {} — divergência de {}%", dailyLogId,
                    diffPct.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP));
        }
        return saved;
    }

    /**
     * Conciliação em lote: importa uma lista de leituras (integração com
     * provedor de rastreamento). Cada item falho não interrompe os demais.
     *
     * @return quantidade de registros conciliados com sucesso
     */
    @Transactional
    public int importBatch(List<TelemetryReading> readings) {
        int success = 0;
        for (TelemetryReading reading : readings) {
            try {
                importTelemetryKm(reading.dailyLogId(), reading.telemetryKm(), reading.source());
                success++;
            } catch (Exception e) {
                log.error("Falha ao conciliar Parte Diária {}: {}",
                        reading.dailyLogId(), e.getMessage());
            }
        }
        log.info("Conciliação em lote: {}/{} registros processados", success, readings.size());
        return success;
    }

    /**
     * Lista as Partes Diárias com divergência superior a 5% pendentes de revisão.
     */
    @Transactional(readOnly = true)
    public List<DailyLog> findDivergent() {
        return dailyLogRepository.findAll().stream()
                .filter(d -> d.getTelemetryStatus() == TelemetryReconciliationStatus.DIVERGENT)
                .collect(Collectors.toList());
    }

    /**
     * Registro de leitura de telemetria para importação em lote.
     */
    public record TelemetryReading(UUID dailyLogId, Integer telemetryKm, String source) {
    }
}
