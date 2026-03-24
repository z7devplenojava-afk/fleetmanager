package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeriasReportDTO {
    private UUID employeeId;
    private String status;
    private String tipo;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private String periodoAquisitivo;
    private Boolean incluirDetalhes;
    private Boolean incluirEstatisticas;
    private String formato; // EXCEL, PDF
}

