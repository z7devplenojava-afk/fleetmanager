package com.z7design.fleet_manager.model.enums;

public enum UserRole {
    FLEX_ADMIN, // 🟥 Admin Plataforma (Global)
    COMPANY_ADMIN, // 🟦 Admin Empresa (Tenant)
    SUPER_ADMIN, // 🛑 Acesso total e irrestrito
    ADMIN, // 🟦 Acesso amplo, subordinado ao Super Admin
    GESTOR, // 🟩 Gestor de Unidade/Contrato
    SUPERVISOR, // 🟩 Coordena operações de equipes
    RH, // 🟨 Gerencia informações contratuais e pessoais
    ASSISTENCIA_RH, // 🟨 Assistência de RH
    DEPARTAMENTO_PESSOAL, // 🟨 Gestão completa de DP
    FINANCEIRO, // 🟧 Controla relatórios financeiros
    OPERACIONAL, // 🟦 Departamento Operacional
    VIGILANTE, // 🟦 Colaborador operacional
    AUXI_ADMINISTRATIVO, // 🟪 Suporte administrativo
    AUX_DEP, // 🟪 Suporte DP
    TI_SUPORTE, // 🟪 Gerencia configuração técnica
    AUDITOR, // 🟫 Acesso somente leitura
    COLABORADOR, // 🟨 Consulta básica
    MOTORISTA, // 🚌 Operação de transporte
    MECANICO, // 🛠️ Manutenção de frota
    PORTARIA, // 🔘 Controle de acesso
    GESTOR_TRAFEGO, // 🚦 Gestão de escalas e tráfego
    GESTOR_DE_TRAFEGO, // 🚦 Gestão de escalas e tráfego
    MANUTENCAO, // 🛠️ Manutenção
    GESTOR_DE_MANUTENCAO, // 🛠️ Gestor de Manutenção
    ENCARREGADO_DE_MANUTENCAO, // 🛠️ Encarregado de Manutenção
    ALMOXARIFADO, // 📦 Almoxarifado
    COMPRAS, // 🛒 Compras
    GESTOR_DE_COMPRAS, // 🛒 Gestor de Compras
    GESTOR_FINANCEIRO, // 💰 Gestor Financeiro
    GESTOR_OPERACIONAL, // ⚙️ Gestor Operacional
    AUXILIAR_ADMINISTRATIVO, // 📋 Auxiliar Administrativo
    AUXILIAR_DE_RH, // 👥 Auxiliar de RH
    AUXILIAR_DE_DEPARTAMENTO_PESSOAL, // 📄 Auxiliar de DP
    ASSISTENTE_OPERACIONAL, // ⚙️ Assistente Operacional
    ASSISTENTE_LIMPEZA, // 🧹 Assistente de Limpeza
    LAVADOR, // 🚿 Lavador
    ASSISTENTE_FINANCEIRO, // 💰 Assistente Financeiro
    CLIENT_MANAGER // 📱 Gestor de Contrato (Cliente Final)
}
