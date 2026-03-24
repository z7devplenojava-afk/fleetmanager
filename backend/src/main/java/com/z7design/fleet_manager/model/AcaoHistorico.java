package com.z7design.fleet_manager.model;

public enum AcaoHistorico {
    CRIACAO("CriaÃ§Ã£o"),
    EDICAO("EdiÃ§Ã£o"),
    EXCLUSAO("ExclusÃ£o"),
    ATIVACAO("AtivaÃ§Ã£o"),
    DESATIVACAO("DesativaÃ§Ã£o"),
    APROVACAO("AprovaÃ§Ã£o"),
    REJEICAO("RejeiÃ§Ã£o"),
    CANCELAMENTO("Cancelamento");

    private final String descricao;

    AcaoHistorico(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
} 
