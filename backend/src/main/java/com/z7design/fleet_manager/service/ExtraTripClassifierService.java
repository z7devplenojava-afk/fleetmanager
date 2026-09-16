package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.enums.ExtraTripReason;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * PRD 1.0 - MÓDULO 5 (RF-05.3): Classificação Automática de Viagens Extras.
 *
 * Segrega automaticamente viagens realizadas em fins de semana, feriados ou
 * horários fora da escala contratada, para envio à tabela de Viagens Extras
 * do Boletim de Medição (M5 → M7).
 */
@Service
@Slf4j
public class ExtraTripClassifierService {

    /** Escala contratada padrão (turno): 06:00 às 22:00. */
    private static final LocalTime DEFAULT_SHIFT_START = LocalTime.of(6, 0);
    private static final LocalTime DEFAULT_SHIFT_END = LocalTime.of(22, 0);

    /**
     * Resultado da classificação.
     */
    public record ClassificationResult(boolean extraTrip, ExtraTripReason reason) {
        public static ClassificationResult notExtra() {
            return new ClassificationResult(false, null);
        }
    }

    /**
     * Classifica a Parte Diária: fins de semana, feriados e horários fora da
     * escala contratada são marcados como viagem extra.
     *
     * @param dailyLog      Parte Diária a classificar
     * @param holidays      feriados do período (lista configurável por contrato)
     * @param shiftStart    início da escala contratada (null = padrão 06:00)
     * @param shiftEnd      fim da escala contratada (null = padrão 22:00)
     */
    public ClassificationResult classify(DailyLog dailyLog, List<LocalDate> holidays,
                                         LocalTime shiftStart, LocalTime shiftEnd) {
        LocalDate date = dailyLog.getDate();
        if (date == null) {
            return ClassificationResult.notExtra();
        }

        // 1. Fim de semana
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            log.debug("Viagem extra (fim de semana): Parte Diária {}", dailyLog.getId());
            return new ClassificationResult(true, ExtraTripReason.WEEKEND);
        }

        // 2. Feriado
        if (holidays != null && holidays.contains(date)) {
            log.debug("Viagem extra (feriado): Parte Diária {}", dailyLog.getId());
            return new ClassificationResult(true, ExtraTripReason.HOLIDAY);
        }

        // 3. Horário fora da escala contratada
        LocalDateTime start = dailyLog.getStartTime();
        LocalDateTime end = dailyLog.getEndTime();
        if (start != null && end != null) {
            LocalTime sLimit = shiftStart != null ? shiftStart : DEFAULT_SHIFT_START;
            LocalTime eLimit = shiftEnd != null ? shiftEnd : DEFAULT_SHIFT_END;
            if (start.toLocalTime().isBefore(sLimit) || end.toLocalTime().isAfter(eLimit)) {
                log.debug("Viagem extra (fora da escala {}-{}): Parte Diária {}", sLimit, eLimit, dailyLog.getId());
                return new ClassificationResult(true, ExtraTripReason.OUTSIDE_SHIFT);
            }
        }

        return ClassificationResult.notExtra();
    }

    /**
     * Classifica e aplica o resultado na Parte Diária (sem persistir).
     */
    public ClassificationResult applyTo(DailyLog dailyLog, List<LocalDate> holidays,
                                        LocalTime shiftStart, LocalTime shiftEnd) {
        ClassificationResult result = classify(dailyLog, holidays, shiftStart, shiftEnd);
        dailyLog.setExtraTrip(result.extraTrip());
        dailyLog.setExtraTripReason(result.reason());
        dailyLog.setExtraTripAutoClassified(true);
        return result;
    }

    /**
     * Verifica se a data é fim de semana ou feriado (helper para o frontend
     * pré-classificar no momento do apontamento).
     */
    public static boolean isWeekendOrHoliday(LocalDate date, List<LocalDate> holidays) {
        if (date == null) {
            return false;
        }
        DayOfWeek dow = date.getDayOfWeek();
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY
                || (holidays != null && holidays.contains(date));
    }
}
