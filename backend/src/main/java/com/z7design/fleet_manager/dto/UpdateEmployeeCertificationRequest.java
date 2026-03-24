package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeCertificationRequest {
    
    // Suporta tanto { employeeId: UUID } quanto { employee: { id: UUID } }
    private UUID employeeId;
    private EmployeeRef employee;
    
    // Suporta tanto { trainingId: UUID } quanto { training: { id: UUID } }
    private UUID trainingId;
    private TrainingRef training;
    
    // Posto de trabalho (opcional)
    private UUID workPostId;
    private String workPostName; // Para busca por nome
    
    @NotBlank(message = "Certification number is required")
    @Size(min = 1, max = 100, message = "Certification number must be between 1 and 100 characters")
    private String certificationNumber;
    
    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;
    
    private LocalDate expirationDate;
    
    private String documentUrl;
    
    // MÃ©todo helper para obter o employeeId
    public UUID getEmployeeId() {
        if (employeeId != null) {
            return employeeId;
        }
        if (employee != null && employee.getId() != null) {
            return employee.getId();
        }
        return null;
    }
    
    // MÃ©todo helper para obter o trainingId
    public UUID getTrainingId() {
        if (trainingId != null) {
            return trainingId;
        }
        if (training != null && training.getId() != null) {
            return training.getId();
        }
        return null;
    }
    
    // Classes internas para deserializaÃ§Ã£o
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeRef {
        private UUID id;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrainingRef {
        private UUID id;
    }
}


