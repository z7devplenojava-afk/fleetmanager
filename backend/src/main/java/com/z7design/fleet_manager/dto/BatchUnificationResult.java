package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUnificationResult {
    
    /**
     * Total de funcionÃ¡rios processados
     */
    private int totalProcessed;
    
    /**
     * Total unificado com sucesso
     */
    private int totalSuccess;
    
    /**
     * Total com falha
     */
    private int totalFailed;
    
    /**
     * Lista de sucessos com detalhes
     */
    @Builder.Default
    private List<UnificationDetail> successList = new ArrayList<>();
    
    /**
     * Lista de falhas com motivos
     */
    @Builder.Default
    private List<UnificationDetail> failureList = new ArrayList<>();
    
    /**
     * Tempo de processamento em milissegundos
     */
    private long processingTimeMs;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnificationDetail {
        private String employeeName;
        private Integer month;
        private Integer year;
        private String status;
        private String message;
        private String filePath;
        private Boolean namesMatch;
        private String holeriteFound;
        private String receiptFound;
    }
}


