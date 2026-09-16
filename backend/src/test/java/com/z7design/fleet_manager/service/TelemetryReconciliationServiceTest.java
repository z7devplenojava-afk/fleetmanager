package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.enums.TelemetryReconciliationStatus;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * PRD 1.0 - Módulo 5 (RF-05.2): conciliação com rastreamento satelital,
 * apontando divergências superiores a 5%.
 */
@ExtendWith(MockitoExtension.class)
class TelemetryReconciliationServiceTest {

    @Mock
    private DailyLogRepository dailyLogRepository;

    @InjectMocks
    private TelemetryReconciliationService service;

    private DailyLog dailyLog;

    @BeforeEach
    void setUp() {
        dailyLog = new DailyLog();
        dailyLog.setId(UUID.randomUUID());
        dailyLog.setInitialKm(1000);
        dailyLog.setFinalKm(1400);
        dailyLog.calculateMetrics(); // totalKmRun = 400
    }

    @Test
    @DisplayName("Telemetria dentro de 5% de tolerância")
    void testWithinTolerance() {
        // 410 km vs 400 km = +2,5% — dentro da tolerância
        when(dailyLogRepository.findById(dailyLog.getId())).thenReturn(Optional.of(dailyLog));
        when(dailyLogRepository.save(dailyLog)).thenReturn(dailyLog);

        DailyLog result = service.importTelemetryKm(dailyLog.getId(), 410, "Sascar");

        assertEquals(TelemetryReconciliationStatus.WITHIN_TOLERANCE, result.getTelemetryStatus());
        assertEquals(10, result.getTelemetryDiffKm());
        assertEquals(0, result.getTelemetryDiffPct().compareTo(new BigDecimal("0.0250")));
        assertNotNull(result.getTelemetryImportedAt());
        assertEquals("Sascar", result.getTelemetrySource());
    }

    @Test
    @DisplayName("Divergência exatamente em 5% é tolerada (limite exclusivo)")
    void testExactlyFivePercentIsTolerated() {
        // 420 km vs 400 km = 5% exato — limite não ultrapassado
        when(dailyLogRepository.findById(dailyLog.getId())).thenReturn(Optional.of(dailyLog));
        when(dailyLogRepository.save(dailyLog)).thenReturn(dailyLog);

        DailyLog result = service.importTelemetryKm(dailyLog.getId(), 420, null);

        assertEquals(TelemetryReconciliationStatus.WITHIN_TOLERANCE, result.getTelemetryStatus());
        assertEquals(0, result.getTelemetryDiffPct().compareTo(new BigDecimal("0.0500")));
    }

    @Test
    @DisplayName("Divergência acima de 5% é apontada como DIVERGENT")
    void testDivergentAboveThreshold() {
        // 450 km vs 400 km = 12,5% — divergente
        when(dailyLogRepository.findById(dailyLog.getId())).thenReturn(Optional.of(dailyLog));
        when(dailyLogRepository.save(dailyLog)).thenReturn(dailyLog);

        DailyLog result = service.importTelemetryKm(dailyLog.getId(), 450, "Onixsat");

        assertEquals(TelemetryReconciliationStatus.DIVERGENT, result.getTelemetryStatus());
        assertEquals(50, result.getTelemetryDiffKm());
        assertEquals(0, result.getTelemetryDiffPct().compareTo(new BigDecimal("0.1250")));
    }

    @Test
    @DisplayName("Telemetria menor que o papel também detecta divergência (valor absoluto)")
    void testNegativeDivergence() {
        // 350 km vs 400 km = -12,5% — divergente (valor absoluto)
        when(dailyLogRepository.findById(dailyLog.getId())).thenReturn(Optional.of(dailyLog));
        when(dailyLogRepository.save(dailyLog)).thenReturn(dailyLog);

        DailyLog result = service.importTelemetryKm(dailyLog.getId(), 350, null);

        assertEquals(TelemetryReconciliationStatus.DIVERGENT, result.getTelemetryStatus());
        assertEquals(-50, result.getTelemetryDiffKm());
        assertEquals(0, result.getTelemetryDiffPct().compareTo(new BigDecimal("0.1250")));
    }

    @Test
    @DisplayName("KM da telemetria negativo é rejeitado")
    void testNegativeTelemetryKmRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.importTelemetryKm(dailyLog.getId(), -1, null));
    }

    @Test
    @DisplayName("Parte Diária sem KM rodado não pode ser conciliada")
    void testNoKmRunRejected() {
        DailyLog empty = new DailyLog();
        empty.setId(UUID.randomUUID());
        empty.setInitialKm(100);
        empty.setFinalKm(100);
        empty.calculateMetrics(); // totalKmRun = 0

        when(dailyLogRepository.findById(empty.getId())).thenReturn(Optional.of(empty));

        assertThrows(IllegalArgumentException.class,
                () -> service.importTelemetryKm(empty.getId(), 100, null));
    }

    @Test
    @DisplayName("Parte Diária inexistente gera ResourceNotFoundException")
    void testDailyLogNotFound() {
        UUID id = UUID.randomUUID();
        when(dailyLogRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.importTelemetryKm(id, 100, null));
    }

    @Test
    @DisplayName("Importação em lote processa itens válidos e ignora falhas")
    void testBatchImport() {
        DailyLog log2 = new DailyLog();
        log2.setId(UUID.randomUUID());
        log2.setInitialKm(2000);
        log2.setFinalKm(2400);
        log2.calculateMetrics(); // 400 km

        when(dailyLogRepository.findById(dailyLog.getId())).thenReturn(Optional.of(dailyLog));
        when(dailyLogRepository.findById(log2.getId())).thenReturn(Optional.of(log2));
        when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

        UUID invalidId = UUID.randomUUID();
        when(dailyLogRepository.findById(invalidId)).thenReturn(Optional.empty());

        int processed = service.importBatch(List.of(
                new TelemetryReconciliationService.TelemetryReading(dailyLog.getId(), 405, "Sascar"),
                new TelemetryReconciliationService.TelemetryReading(log2.getId(), 480, "Sascar"), // divergente mas válido
                new TelemetryReconciliationService.TelemetryReading(invalidId, 100, "Sascar")
        ));

        assertEquals(2, processed);
        assertEquals(TelemetryReconciliationStatus.WITHIN_TOLERANCE, dailyLog.getTelemetryStatus());
        assertEquals(TelemetryReconciliationStatus.DIVERGENT, log2.getTelemetryStatus());
    }

    @Test
    @DisplayName("findDivergent retorna apenas Partes Diárias divergentes")
    void testFindDivergent() {
        DailyLog ok = new DailyLog();
        ok.setTelemetryStatus(TelemetryReconciliationStatus.WITHIN_TOLERANCE);
        DailyLog bad = new DailyLog();
        bad.setTelemetryStatus(TelemetryReconciliationStatus.DIVERGENT);
        DailyLog notReconciled = new DailyLog();
        notReconciled.setTelemetryStatus(TelemetryReconciliationStatus.NOT_RECONCILED);

        when(dailyLogRepository.findAll()).thenReturn(List.of(ok, bad, notReconciled));

        List<DailyLog> divergent = service.findDivergent();
        assertEquals(1, divergent.size());
        assertEquals(TelemetryReconciliationStatus.DIVERGENT, divergent.get(0).getTelemetryStatus());
    }
}
