package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.AdmissionRequestType;
import com.z7design.fleet_manager.model.enums.AdmissionRequestPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAdmissionRequestDTO {
    
    @NotNull(message = "Tipo Ã© obrigatÃ³rio")
    private AdmissionRequestType type;
    
    @NotBlank(message = "Nome do funcionÃ¡rio Ã© obrigatÃ³rio")
    private String employeeName;
    
    private String employeeCpf;
    
    private String employeeRg;
    
    private String employeeEmail;
    
    private String employeePhone;
    
    private String position;
    
    private String department;
    
    private UUID unitId;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String reason;
    
    private String justification;
    
    private AdmissionRequestPriority priority;
    
    private String requesterName;
    
    private UUID requesterId;
    
    private UUID approverId;
    
    private String notes;
}









