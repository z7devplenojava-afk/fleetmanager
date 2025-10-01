package br.com.fleetmanager.model.enums;

public enum MovementReason {
    // Entradas
    COMPRA("Compra/Fornecimento"),
    DEVOLUCAO("Devolução"),
    AJUSTE_ENTRADA("Ajuste de Estoque - Entrada"),
    
    // Saídas
    ENTREGA_INICIAL("Entrega Inicial"),
    REPOSICAO("Reposição"),
    TROCA("Troca"),
    DESCARTE("Descarte"),
    PERDA("Perda"),
    AJUSTE_SAIDA("Ajuste de Estoque - Saída");

    private final String description;

    MovementReason(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}