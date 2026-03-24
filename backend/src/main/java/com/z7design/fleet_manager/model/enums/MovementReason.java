package com.z7design.fleet_manager.model.enums;

public enum MovementReason {
    // Entradas
    COMPRA("Compra/Fornecimento"),
    DEVOLUCAO("DevoluÃ§Ã£o"),
    AJUSTE_ENTRADA("Ajuste de Estoque - Entrada"),
    
    // SaÃ­das
    ENTREGA_INICIAL("Entrega Inicial"),
    REPOSICAO("ReposiÃ§Ã£o"),
    TROCA("Troca"),
    DESCARTE("Descarte"),
    PERDA("Perda"),
    AJUSTE_SAIDA("Ajuste de Estoque - SaÃ­da");

    private final String description;

    MovementReason(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
