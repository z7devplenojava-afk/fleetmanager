package com.z7design.fleet_manager.model.enums;

public enum StockCategory {
    // Categorias de Ônibus e Frota
    PECAS_MECANICA("Peças Mecânicas / Motor / Câmbio"),
    PECAS_ELETRICA("Elétrica e Baterias"),
    SISTEMA_FREIOS("Freios e Suspensão"),
    PNEUS_RODAS("Pneus, Câmaras e Rodas"),
    AR_CONDICIONADO("Ar Condicionado e Refrigeração"),
    CARROCERIA_VIDROS("Carroceria, Vidros e Funilaria"),
    LUBRIFICANTES_FLUIDOS("Óleos, Lubrificantes e Fluidos"),
    ACESSORIOS_ONIBUS("Acessórios de Ônibus (Bancos, Cortinas)"),
    LIMPEZA_HIGIENIZACAO("Limpeza e Higienização de Veículos"),
    FERRAMENTAS("Ferramentas e Equipamentos"),

    // Uniformes e EPIs
    UNIFORME_MOTORISTA("Uniformes - Motoristas e Tráfego"),
    UNIFORME_OFICINA("Uniformes - Oficina e Mecânica"),
    UNIFORME_ADMINISTRATIVO("Uniformes - Administrativo"),
    EPI("Equipamento de Proteção Individual"),
    CALCADOS("Calçados / Botinas"),

    // Empresa e Geral
    MATERIAL_ESCRITORIO("Material de Escritório / TI"),
    OUTROS("Outros"),

    // Retrocompatibilidade
    UNIFORME_VIGILANCIA("Uniforme Vigilância"),
    UNIFORME_SERVICOS("Uniforme Serviços"),
    UNIFORME_COZINHA("Uniforme Cozinha"),
    ACESSORIOS("Acessórios");

    private final String description;

    StockCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
