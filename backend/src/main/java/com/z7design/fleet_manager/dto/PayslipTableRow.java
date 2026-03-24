package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Representa uma linha da tabela de vencimentos/descontos do holerite
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipTableRow {
    private String codigo;           // CÃ³d. (ex: "001", "599", "903")
    private String descricao;        // DescriÃ§Ã£o (ex: "SalÃ¡rio Base", "INSS Folha")
    private String referencia;       // ReferÃªncia (ex: "30,00", "7,62 %")
    private BigDecimal vencimentos;  // Vencimentos (ex: 1649.12)
    private BigDecimal descontos;    // Descontos (ex: 125.65)
}


