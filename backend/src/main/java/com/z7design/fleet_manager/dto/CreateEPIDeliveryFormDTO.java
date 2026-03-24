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
    
    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    private UUID employeeId;
    
    @NotNull(message = "Empresa Ã© obrigatÃ³ria")
    private UUID companyId;
    
    @NotNull(message = "Data de entrega Ã© obrigatÃ³ria")
    private LocalDate deliveryDate;
    
    private UUID responsibleEmployeeId;
    
    private String observations;
    
    private String pdfUrl;
    
    @NotEmpty(message = "Ã‰ necessÃ¡rio pelo menos um item de EPI")
    private List<EPIDeliveryFormItemDTO> items;
}










