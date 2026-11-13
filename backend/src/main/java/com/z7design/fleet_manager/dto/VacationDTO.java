package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.VacationBloco;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.model.enums.VacationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class VacationDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer daysTaken;
    private Integer remainingDays;
    private VacationStatus status;
    private VacationType vacationType;
    private UUID approvedById;
    private String approvedByName;
    private LocalDate approvalDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // --- Extensao CLT (Fase 1 do modulo de ferias) ---
    private UUID periodoAquisitivoId;
    private LocalDate periodoAquisitivoInicio;
    private LocalDate periodoAquisitivoFim;
    private LocalDate limiteConcessivo;
    private UUID feriasColetivasId;
    private UUID solicitanteId;
    private List<VacationBloco> blocos;
    private Integer numeroBlocos;
    private Integer diasAbono;
    private Integer diasLicencaRemunerada;
    private LocalDate dataPagamento;
    private String motivoRejeicao;
    private String observacoes;

    public static VacationDTO fromEntity(Vacation vacation) {
        UUID empId = null;
        String empName = null;
        try {
            if (vacation.getEmployee() != null) {
                empId = vacation.getEmployee().getId();
                empName = vacation.getEmployee().getName();
            }
        } catch (Exception ignored) {}

        UUID apprId = null;
        String apprName = null;
        try {
            if (vacation.getApprovedBy() != null) {
                apprId = vacation.getApprovedBy().getId();
                apprName = vacation.getApprovedBy().getName();
            }
        } catch (Exception ignored) {}

        UUID paId = null;
        LocalDate paInicio = null;
        LocalDate paFim = null;
        LocalDate paLimite = null;
        try {
            if (vacation.getPeriodoAquisitivo() != null) {
                paId = vacation.getPeriodoAquisitivo().getId();
                paInicio = vacation.getPeriodoAquisitivo().getDataInicio();
                paFim = vacation.getPeriodoAquisitivo().getDataFim();
                paLimite = vacation.getPeriodoAquisitivo().getLimiteConcessivo();
            }
        } catch (Exception ignored) {}

        UUID fcId = null;
        try {
            if (vacation.getFeriasColetivas() != null) {
                fcId = vacation.getFeriasColetivas().getId();
            }
        } catch (Exception ignored) {}

        UUID solId = null;
        try {
            if (vacation.getSolicitante() != null) {
                solId = vacation.getSolicitante().getId();
            }
        } catch (Exception ignored) {}

        return VacationDTO.builder()
                .id(vacation.getId())
                .employeeId(empId)
                .employeeName(empName)
                .startDate(vacation.getStartDate())
                .endDate(vacation.getEndDate())
                .daysTaken(vacation.getDaysTaken())
                .remainingDays(vacation.getRemainingDays())
                .status(vacation.getStatus())
                .vacationType(vacation.getVacationType())
                .approvedById(apprId)
                .approvedByName(apprName)
                .approvalDate(vacation.getApprovalDate())
                .createdAt(vacation.getCreatedAt())
                .updatedAt(vacation.getUpdatedAt())
                .periodoAquisitivoId(paId)
                .periodoAquisitivoInicio(paInicio)
                .periodoAquisitivoFim(paFim)
                .limiteConcessivo(paLimite)
                .feriasColetivasId(fcId)
                .solicitanteId(solId)
                .blocos(vacation.getBlocos())
                .numeroBlocos(vacation.getNumeroBlocos())
                .diasAbono(vacation.getDiasAbono())
                .diasLicencaRemunerada(vacation.getDiasLicencaRemunerada())
                .dataPagamento(vacation.getDataPagamento())
                .motivoRejeicao(vacation.getMotivoRejeicao())
                .observacoes(vacation.getObservacoes())
                .build();
    }

    public Vacation toEntity() {
        return Vacation.builder()
                .id(this.id)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .daysTaken(this.daysTaken)
                .remainingDays(this.remainingDays)
                .status(this.status)
                .vacationType(this.vacationType != null ? this.vacationType : VacationType.NORMAL)
                .approvalDate(this.approvalDate)
                .blocos(this.blocos)
                .numeroBlocos(this.numeroBlocos != null ? this.numeroBlocos
                        : (this.blocos != null ? this.blocos.size() : 1))
                .diasAbono(this.diasAbono != null ? this.diasAbono : 0)
                .diasLicencaRemunerada(this.diasLicencaRemunerada != null ? this.diasLicencaRemunerada : 0)
                .dataPagamento(this.dataPagamento)
                .motivoRejeicao(this.motivoRejeicao)
                .observacoes(this.observacoes)
                .build();
    }
}
