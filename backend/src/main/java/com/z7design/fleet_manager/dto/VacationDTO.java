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
        return VacationDTO.builder()
                .id(vacation.getId())
                .employeeId(vacation.getEmployee().getId())
                .employeeName(vacation.getEmployee().getName())
                .startDate(vacation.getStartDate())
                .endDate(vacation.getEndDate())
                .daysTaken(vacation.getDaysTaken())
                .remainingDays(vacation.getRemainingDays())
                .status(vacation.getStatus())
                .vacationType(vacation.getVacationType())
                .approvedById(vacation.getApprovedBy() != null ? vacation.getApprovedBy().getId() : null)
                .approvedByName(vacation.getApprovedBy() != null ? vacation.getApprovedBy().getName() : null)
                .approvalDate(vacation.getApprovalDate())
                .createdAt(vacation.getCreatedAt())
                .updatedAt(vacation.getUpdatedAt())
                .periodoAquisitivoId(vacation.getPeriodoAquisitivo() != null
                        ? vacation.getPeriodoAquisitivo().getId() : null)
                .periodoAquisitivoInicio(vacation.getPeriodoAquisitivo() != null
                        ? vacation.getPeriodoAquisitivo().getDataInicio() : null)
                .periodoAquisitivoFim(vacation.getPeriodoAquisitivo() != null
                        ? vacation.getPeriodoAquisitivo().getDataFim() : null)
                .limiteConcessivo(vacation.getPeriodoAquisitivo() != null
                        ? vacation.getPeriodoAquisitivo().getLimiteConcessivo() : null)
                .feriasColetivasId(vacation.getFeriasColetivas() != null
                        ? vacation.getFeriasColetivas().getId() : null)
                .solicitanteId(vacation.getSolicitante() != null
                        ? vacation.getSolicitante().getId() : null)
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
