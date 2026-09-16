package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.enums.ExtraTripReason;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PRD 1.0 - Módulo 5 (RF-05.3): classificação automática de viagens extras.
 */
class ExtraTripClassifierServiceTest {

    private final ExtraTripClassifierService service = new ExtraTripClassifierService();

    private DailyLog logAt(LocalDate date, LocalDateTime start, LocalDateTime end) {
        DailyLog log = new DailyLog();
        log.setId(UUID.randomUUID());
        log.setDate(date);
        log.setStartTime(start);
        log.setEndTime(end);
        return log;
    }

    @Test
    @DisplayName("Sábado é classificado como viagem extra (WEEKEND)")
    void testSaturday() {
        // 2026-09-12 é sábado
        DailyLog log = logAt(LocalDate.of(2026, 9, 12),
                LocalDateTime.of(2026, 9, 12, 8, 0),
                LocalDateTime.of(2026, 9, 12, 17, 0));

        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertTrue(result.extraTrip());
        assertEquals(ExtraTripReason.WEEKEND, result.reason());
    }

    @Test
    @DisplayName("Domingo é classificado como viagem extra (WEEKEND)")
    void testSunday() {
        // 2026-09-13 é domingo
        DailyLog log = logAt(LocalDate.of(2026, 9, 13),
                LocalDateTime.of(2026, 9, 13, 8, 0),
                LocalDateTime.of(2026, 9, 13, 17, 0));

        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertTrue(result.extraTrip());
        assertEquals(ExtraTripReason.WEEKEND, result.reason());
    }

    @Test
    @DisplayName("Feriado da lista é classificado como viagem extra (HOLIDAY)")
    void testHoliday() {
        // 2026-09-07 é segunda-feira (Independência antecipada no exemplo) e feriado
        DailyLog log = logAt(LocalDate.of(2026, 9, 7),
                LocalDateTime.of(2026, 9, 7, 8, 0),
                LocalDateTime.of(2026, 9, 7, 17, 0));

        List<LocalDate> holidays = List.of(LocalDate.of(2026, 9, 7));
        ExtraTripClassifierService.ClassificationResult result = service.classify(log, holidays, null, null);
        assertTrue(result.extraTrip());
        assertEquals(ExtraTripReason.HOLIDAY, result.reason());
    }

    @Test
    @DisplayName("Dia útil dentro da escala NÃO é viagem extra")
    void testBusinessDayWithinShift() {
        // 2026-09-09 é quarta-feira
        DailyLog log = logAt(LocalDate.of(2026, 9, 9),
                LocalDateTime.of(2026, 9, 9, 6, 30),
                LocalDateTime.of(2026, 9, 9, 17, 45));

        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertFalse(result.extraTrip());
        assertNull(result.reason());
    }

    @Test
    @DisplayName("Início antes da escala contratada é viagem extra (OUTSIDE_SHIFT)")
    void testStartBeforeShift() {
        DailyLog log = logAt(LocalDate.of(2026, 9, 9),
                LocalDateTime.of(2026, 9, 9, 4, 30), // antes das 06:00
                LocalDateTime.of(2026, 9, 9, 17, 0));

        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertTrue(result.extraTrip());
        assertEquals(ExtraTripReason.OUTSIDE_SHIFT, result.reason());
    }

    @Test
    @DisplayName("Término após a escala contratada é viagem extra (OUTSIDE_SHIFT)")
    void testEndAfterShift() {
        DailyLog log = logAt(LocalDate.of(2026, 9, 9),
                LocalDateTime.of(2026, 9, 9, 7, 0),
                LocalDateTime.of(2026, 9, 9, 23, 30)); // depois das 22:00

        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertTrue(result.extraTrip());
        assertEquals(ExtraTripReason.OUTSIDE_SHIFT, result.reason());
    }

    @Test
    @DisplayName("Escala personalizada por contrato é respeitada")
    void testCustomShift() {
        // Turno noturno contratado: 22:00 às 06:00 (janela passada como limite expandido)
        DailyLog log = logAt(LocalDate.of(2026, 9, 9),
                LocalDateTime.of(2026, 9, 9, 23, 0),
                LocalDateTime.of(2026, 9, 10, 5, 0));

        // Contrato com turno estendido 22:00–06:00 (simulado com limites amplos)
        LocalTime shiftStart = LocalTime.of(0, 0);
        LocalTime shiftEnd = LocalTime.of(23, 59);

        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, shiftStart, shiftEnd);
        assertFalse(result.extraTrip());
    }

    @Test
    @DisplayName("applyTo marca a Parte Diária com classificação automática")
    void testApplyTo() {
        DailyLog log = logAt(LocalDate.of(2026, 9, 12),
                LocalDateTime.of(2026, 9, 12, 8, 0),
                LocalDateTime.of(2026, 9, 12, 17, 0));

        service.applyTo(log, null, null, null);

        assertTrue(log.getExtraTrip());
        assertEquals(ExtraTripReason.WEEKEND, log.getExtraTripReason());
        assertTrue(log.getExtraTripAutoClassified());
    }

    @Test
    @DisplayName("Sem horários de início/término, dia útil não é extra")
    void testNoTimesBusinessDay() {
        DailyLog log = logAt(LocalDate.of(2026, 9, 9), null, null);
        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertFalse(result.extraTrip());
    }

    @Test
    @DisplayName("Sem data, não classifica")
    void testNoDate() {
        DailyLog log = new DailyLog();
        log.setId(UUID.randomUUID());
        ExtraTripClassifierService.ClassificationResult result = service.classify(log, null, null, null);
        assertFalse(result.extraTrip());
    }
}
