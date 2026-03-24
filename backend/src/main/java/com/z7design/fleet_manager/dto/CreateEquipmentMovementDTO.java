package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MovementType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentMovementDTO {
    
    @NotNull(message = "ID do equipamento Ã© obrigatÃ³rio")
    private UUID equipmentId;
    
    @NotNull(message = "ID do funcionÃ¡rio Ã© obrigatÃ³rio")
    private UUID employeeId;
    
    private UUID workPostId;
    
    @NotNull(message = "Quem autorizou Ã© obrigatÃ³rio")
    private UUID authorizedById;
    
    @NotNull(message = "Tipo de movimentaÃ§Ã£o Ã© obrigatÃ³rio")
    private MovementType movementType;
    
    @NotNull(message = "Data da movimentaÃ§Ã£o Ã© obrigatÃ³ria")
    private LocalDateTime movementDate;
    
    private LocalDateTime expectedReturnDate;
    
    private String reason;
    
    private String notes;
    
    private String conditionOnWithdrawal;
} 
