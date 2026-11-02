package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverMonthlyClosingDTO {
    private UUID employeeId;
    private String employeeName;
    private String employeeDocument;
    private String registrationNumber;
    private String positionName;
    private int year;
    private int month;

    // Horas em Minutos (para precisão absoluta)
    private Integer contractMonthlyMinutes; // Carga contratual (ex: 220h = 13.200 min)
    private Integer totalWorkedMinutes;     // Total efetivo trabalhado
    private Integer totalOvertimeMinutes;   // Total de horas extras
    private Integer totalNightMinutes;      // Adicional Noturno Relógio (22h às 05h)
    private Integer totalNightReducedMinutes; // Hora Noturna Reduzida CLT (fator 52m30s)
    private Integer totalWaitMinutes;       // Tempo de espera
    private Integer balanceMinutes;         // Saldo do Mês (Trabalhado - Contrato)

    private int daysWorked;                 // Dias trabalhados
    private int daysClosed;                 // Dias com jornada já fechada
    private boolean isMonthFullyClosed;     // Mês 100% fechado?

    @Builder.Default
    private List<DriverWorkHourDTO> dailyRecords = new ArrayList<>();
}
