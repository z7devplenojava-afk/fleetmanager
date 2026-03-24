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
    CLIENT_MANAGER // 📱 Gestor de Contrato (Cliente Final)
}
