package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para resposta da API CA EPI
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CAEPIResponseDTO {
    private String numero;
    private String nome;
    private String descricao;
    private String situacao;
    private String validade;
    private String fabricante;
    private String equipamento;
}


