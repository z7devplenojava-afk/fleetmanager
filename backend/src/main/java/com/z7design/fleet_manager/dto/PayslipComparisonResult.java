package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipComparisonResult {
    
    @Builder.Default
    private boolean hasChanges = false;
    
    @Builder.Default
    private List<String> differences = new ArrayList<>();
    
    /**
     * Adiciona uma diferenÃ§a encontrada na comparaÃ§Ã£o
     */
    public void addDifference(String field, String oldValue, String newValue) {
        this.hasChanges = true;
        this.differences.add(String.format("%s: '%s' -> '%s'", field, 
            oldValue != null ? oldValue : "null", 
            newValue != null ? newValue : "null"));
    }
    
    /**
     * Adiciona uma diferenÃ§a encontrada na comparaÃ§Ã£o (formato customizado)
     */
    public void addDifference(String description) {
        this.hasChanges = true;
        this.differences.add(description);
    }
    
    /**
     * Verifica se hÃ¡ mudanÃ§as detectadas
     */
    public boolean hasChanges() {
        return hasChanges;
    }
    
    /**
     * Retorna a lista de diferenÃ§as encontradas
     */
    public List<String> getDifferences() {
        return differences != null ? differences : new ArrayList<>();
    }
}


