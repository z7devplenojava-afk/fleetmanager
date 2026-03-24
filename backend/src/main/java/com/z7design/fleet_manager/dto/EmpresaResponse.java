package com.z7design.fleet_manager.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO com dados da empresa para exibição no frontend (logo, nome, tema).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmpresaResponse {
    private String id;
    private String nome;
    private String logoUrl;
    private String temaCor;
    private String branchName;
    private String unitName;

    /**
     * Lista de funcionalidades habilitadas para esta empresa
     * Exemplos: "dashboard", "operacional", "manutencao", "financeiro", "rotas",
     * "relatorios"
     */
    private List<String> enabledFeatures;
}
