package br.com.fleetmanager.model.enums;

public enum UserRole {
    SUPER_ADMIN,      // 🟥 Acesso total e irrestrito
    ADMIN,            // 🟦 Acesso amplo, subordinado ao Super Admin
    SUPERVISOR,       // 🟩 Coordena operações de equipes
    RH,               // 🟨 Gerencia informações contratuais e pessoais
    FINANCEIRO,       // 🟧 Controla relatórios financeiros
    TI_SUPORTE,       // 🟪 Gerencia configuração técnica
    AUDITOR,          // 🟫 Acesso somente leitura
    COLABORADOR
} 