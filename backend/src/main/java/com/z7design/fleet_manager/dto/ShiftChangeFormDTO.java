package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ShiftChangeForm;
import com.z7design.fleet_manager.model.enums.ShiftChangeStatus;
import com.z7design.fleet_manager.model.enums.ShiftTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftChangeFormDTO {

    private Long id;

    @NotNull(message = "A data da solicitaÃ§Ã£o Ã© obrigatÃ³ria")
    private LocalDate dateOfRequest;

    @NotBlank(message = "O nome completo do solicitante Ã© obrigatÃ³rio")
    private String requesterFullName;

    @NotBlank(message = "O setor do solicitante Ã© obrigatÃ³rio")
    private String requesterSector;

    private LocalDate requesterDayOffDate;

    @NotNull(message = "A data do plantÃ£o do solicitante Ã© obrigatÃ³ria")
    private LocalDate requesterShiftDate;

    @NotBlank(message = "O nome completo do colega que assumirÃ¡ o plantÃ£o Ã© obrigatÃ³rio")
    private String replacingFullName;

    @NotBlank(message = "O setor do colega que assumirÃ¡ o plantÃ£o Ã© obrigatÃ³rio")
    private String replacingSector;

    @NotNull(message = "A data do plantÃ£o do colega que assumirÃ¡ Ã© obrigatÃ³ria")
    private LocalDate replacingShiftDate;

    private LocalDate replacingDayOffDate;

    @NotNull(message = "O horÃ¡rio do plantÃ£o Ã© obrigatÃ³rio")
    private ShiftTime shiftTime;

    private ShiftChangeStatus status;

    private String approvedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ShiftChangeFormDTO(ShiftChangeForm entity) {
        this.id = entity.getId();
        this.dateOfRequest = entity.getDateOfRequest();
        this.requesterFullName = entity.getRequesterFullName();
        this.requesterSector = entity.getRequesterSector();
        this.requesterDayOffDate = entity.getRequesterDayOffDate();
        this.requesterShiftDate = entity.getRequesterShiftDate();
        this.replacingFullName = entity.getReplacingFullName();
        this.replacingSector = entity.getReplacingSector();
        this.replacingShiftDate = entity.getReplacingShiftDate();
        this.replacingDayOffDate = entity.getReplacingDayOffDate();
        this.shiftTime = entity.getShiftTime();
        this.status = entity.getStatus();
        this.approvedBy = entity.getApprovedBy();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    public ShiftChangeForm toEntity() {
        ShiftChangeForm entity = new ShiftChangeForm();
        entity.setId(this.id);
        entity.setDateOfRequest(this.dateOfRequest);
        entity.setRequesterFullName(this.requesterFullName);
        entity.setRequesterSector(this.requesterSector);
        entity.setRequesterDayOffDate(this.requesterDayOffDate);
        entity.setRequesterShiftDate(this.requesterShiftDate);
        entity.setReplacingFullName(this.replacingFullName);
        entity.setReplacingSector(this.replacingSector);
        entity.setReplacingShiftDate(this.replacingShiftDate);
        entity.setReplacingDayOffDate(this.replacingDayOffDate);
        entity.setShiftTime(this.shiftTime);
        entity.setStatus(this.status);
        entity.setApprovedBy(this.approvedBy);
        // createdAt e updatedAt serÃ£o gerenciados pela entidade
        return entity;
    }
}

