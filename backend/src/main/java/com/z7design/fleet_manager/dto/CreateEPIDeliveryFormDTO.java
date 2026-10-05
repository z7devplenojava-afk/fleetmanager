package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEPIDeliveryFormDTO {
    
    @NotNull(message = "Funcionário é obrigatório")
    private UUID employeeId;
    
    private UUID companyId;
    
    @NotNull(message = "Data de entrega é obrigatória")
    private LocalDate deliveryDate;
    
    private UUID responsibleEmployeeId;
    
    private String observations;
    
    private String pdfUrl;
    
    private List<EPIDeliveryFormItemDTO> items;
}










