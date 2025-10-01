package br.com.fleetmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

import br.com.fleetmanager.model.CostCenter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCostCenterDTO {
    
    @NotBlank(message = "Código é obrigatório")
    @Size(max = 20, message = "Código deve ter no máximo 20 caracteres")
    private String code;
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    private String name;
    
    @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
    private String description;
    
    @Size(max = 255, message = "Responsável deve ter no máximo 255 caracteres")
    private String responsible;
    
    @Size(max = 255, message = "Departamento deve ter no máximo 255 caracteres")
    private String department;
    
    private BigDecimal budget;
    
    @NotNull(message = "Status é obrigatório")
    private CostCenter.CostCenterStatus status;
    
    private UUID createdBy;
}
