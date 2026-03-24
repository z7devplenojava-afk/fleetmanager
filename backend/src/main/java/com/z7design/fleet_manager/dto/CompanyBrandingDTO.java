package com.z7design.fleet_manager.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para informações de branding da empresa.
 * Usado para retornar dados visuais e configurações da empresa ao frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyBrandingDTO {

    /**
     * ID único da empresa
     */
    private UUID id;

    /**
     * Nome completo da empresa
     */
    private String nome;

    /**
     * Sigla/abreviação da empresa
     */
    private String sigla;

    /**
     * URL do logo da empresa (caminho relativo ou absoluto)
     */
    private String logoUrl;

    /**
     * Tema visual da empresa: 'white', 'gray', ou 'dark'
     */
    private String theme;

    /**
     * Lista de funcionalidades habilitadas para esta empresa
     * Exemplos: "dashboard", "operacional", "manutencao", "financeiro", "rotas",
     * "relatorios"
     */
    private List<String> enabledFeatures;
}
