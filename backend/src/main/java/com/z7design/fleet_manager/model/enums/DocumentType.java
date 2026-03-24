package com.z7design.fleet_manager.model.enums;

public enum DocumentType {
    // Documentos Pessoais
    CPF("CPF", "Cadastro de Pessoa FÃ­sica"),
    RG("RG", "Carteira de Identidade"),
    TITULO_ELEITOR("TÃ­tulo de Eleitor", "TÃ­tulo de Eleitor"),
    CERTIDAO_NASCIMENTO("CertidÃ£o de Nascimento", "CertidÃ£o de Nascimento"),
    CERTIDAO_CASAMENTO("CertidÃ£o de Casamento", "CertidÃ£o de Casamento"),
    
    // Documentos Trabalhistas
    CTPS("CTPS", "Carteira de Trabalho e PrevidÃªncia Social"),
    PIS_PASEP("PIS/PASEP", "Programa de IntegraÃ§Ã£o Social"),
    CARTEIRA_PROFISSIONAL("Carteira Profissional", "Carteira de Identidade Profissional"),
    
    // Documentos de QualificaÃ§Ã£o
    CNH("CNH", "Carteira Nacional de HabilitaÃ§Ã£o"),
    CERTIFICACAO_PROFISSIONAL("CertificaÃ§Ã£o Profissional", "CertificaÃ§Ã£o Profissional"),
    DIPLOMA("Diploma", "Diploma de FormaÃ§Ã£o"),
    
    // Documentos de SaÃºde
    ASO("ASO", "Atestado de SaÃºde Ocupacional"),
    EXAME_MEDICO("Exame MÃ©dico", "Exame MÃ©dico"),
    
    // Documentos de VeÃ­culo (para motoristas)
    CRLV("CRLV", "Certificado de Registro e Licenciamento de VeÃ­culo"),
    IPVA("IPVA", "Imposto sobre Propriedade de VeÃ­culos Automotores"),
    SEGURO("Seguro", "ApÃ³lice de Seguro"),
    
    // Documentos de Pagamento/Financeiros
    HOLERITE("Holerite", "Holerite/Contracheque de Pagamento"),
    COMPROVANTE_PAGAMENTO("Comprovante de Pagamento", "Comprovante de Pagamento BancÃ¡rio"),
    
    // Outros
    OUTROS("Outros", "Outros Documentos");

    private final String displayName;
    private final String description;

    DocumentType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
} 
