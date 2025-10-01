package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.enums.MovementType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentMovementDTO {
    private UUID id;
    private UUID equipmentId;
    private String equipmentSerialNumber;
    private String equipmentModel;
    private UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    private UUID workPostId;
    private String workPostName;
    private String workPostLocation;
    private UUID authorizedById;
    private String authorizedByName;
    private MovementType movementType;
    private LocalDateTime movementDate;
    private LocalDateTime expectedReturnDate;
    private LocalDateTime actualReturnDate;
    private String reason;
    private String notes;
    private Boolean returned;
    private String conditionOnWithdrawal;
    private String conditionOnReturn;
    private LocalDateTime createdAt;
    
    // Campos calculados
    private Boolean isOverdue;
    private Long daysOut;
    private String status; // "Em uso", "Devolvido", "Atrasado", etc.
} 