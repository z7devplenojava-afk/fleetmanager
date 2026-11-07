package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.z7design.fleet_manager.model.VehicleInspection.InspectionType;
import com.z7design.fleet_manager.model.VehicleInspection.VehicleReleaseStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para Laudo de Inspeção de Veículo")
public class VehicleInspectionDTO {

    private UUID id;

    @Schema(description = "Número sequencial de registro do laudo", example = "14598")
    private String registryNumber;

    @Schema(description = "Tipo de inspeção", example = "LAUDO")
    private InspectionType inspectionType;

    @Schema(description = "Data da inspeção", example = "2026-10-19")
    @NotNull(message = "Data da inspeção é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate inspectionDate;

    private UUID vehicleId;

    @Schema(description = "Placa do veículo", example = "UVG3H03")
    private String vehiclePlate;

    @Schema(description = "Cliente ou tomador do serviço", example = "MSM")
    private String clientName;

    @Schema(description = "Obra ou projeto", example = "VALE")
    private String projectName;

    @Schema(description = "Quilometragem no momento da inspeção", example = "7000")
    private Integer currentMileage;

    @Schema(description = "Horímetro / Horas de operação", example = "215HRS")
    private String horimeterHours;

    @Schema(description = "Equipe responsável pela execução", example = "VAGNER SABINO / JAIRO")
    private String executionTeam;

    private String requesterName;
    private String driverName;

    @Schema(description = "Descrição do problema (ex: 1- MANUTENÇÃO PREVENTIVA)")
    private String problemDescription;

    private String anomaliesProblem;

    @Schema(description = "Descrição do ocorrido (ex: PREVENTIVA MENSAL)")
    private String occurrenceDescription;

    @Schema(description = "Serviço realizado detalhado com itens conferidos/trocados")
    private String servicesPerformed;

    @Schema(description = "Peças utilizadas / trocadas", example = "Descritas acima.")
    private String partsUsed;

    private String partsReplaced;
    private String technicalParameters;

    @Schema(description = "URLs ou Base64 das 8 fotos de evidências (JSON array ou separadas por vírgula)")
    private String evidencesUrls;

    private String resultNotes;

    @Schema(description = "Status de liberação do veículo")
    private VehicleReleaseStatus releaseStatus;

    @Schema(description = "Descrição da restrição, caso haja (ex: Sem restrição.)")
    private String restrictionDescription;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate restrictionDeadline;

    private String restrictionResponsible;
    private String definitiveReleaseCondition;

    @Schema(description = "Nome do Gerente de Manutenção", example = "Gerente Manutenção")
    private String managerName;

    @Schema(description = "Nome do Engenheiro Mecânico", example = "Engenheiro Mecânico")
    private String engineerName;

    private String inspectorName;
    private String supervisorName;

    private String inspectorSignature;
    private String supervisorSignature;
    private String releaseSignature;

    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

