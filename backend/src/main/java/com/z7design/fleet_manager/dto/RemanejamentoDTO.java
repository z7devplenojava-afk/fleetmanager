package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.RemanejamentoTipo;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemanejamentoDTO {
    
    private UUID id;
    
    @NotNull(message = "ID do funcionÃ¡rio Ã© obrigatÃ³rio")
    private UUID employeeId;
    
    private String employeeName;
    
    @NotNull(message = "Tipo de remanejamento Ã© obrigatÃ³rio")
    private RemanejamentoTipo tipo;
    
    private String origem;
    
    private String destino;
    
    // Campos adicionais para compatibilidade com frontend
    private UUID originWorkstationId;
    
    private UUID destinationWorkstationId;
    
    private LocalDate remanejamentoDate;
    
    private String notes;
    
    @NotNull(message = "Data do remanejamento Ã© obrigatÃ³ria")
    private LocalDate dataRemanejamento;
    
    private String observacao;
}


