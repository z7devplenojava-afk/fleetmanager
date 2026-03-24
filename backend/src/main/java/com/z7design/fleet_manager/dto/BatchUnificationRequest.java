package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUnificationRequest {
    
    /**
     * MÃªs para filtrar (opcional - se null, processa todos)
     */
    private Integer month;
    
    /**
     * Ano para filtrar (opcional - se null, processa todos)
     */
    private Integer year;
    
    /**
     * Se true, cria documento mesmo com nomes nÃ£o coincidentes (apenas aviso)
     * Se false, rejeita se nomes nÃ£o coincidirem
     */
    private Boolean forceUnification;
}


