package br.com.fleetmanager.model.enums;

public enum DocumentType {
    // Documentos Pessoais
    CPF("CPF", "Cadastro de Pessoa Física"),
    RG("RG", "Carteira de Identidade"),
    TITULO_ELEITOR("Título de Eleitor", "Título de Eleitor"),
    CERTIDAO_NASCIMENTO("Certidão de Nascimento", "Certidão de Nascimento"),
    CERTIDAO_CASAMENTO("Certidão de Casamento", "Certidão de Casamento"),
    
    // Documentos Trabalhistas
    CTPS("CTPS", "Carteira de Trabalho e Previdência Social"),
    PIS_PASEP("PIS/PASEP", "Programa de Integração Social"),
    CARTEIRA_PROFISSIONAL("Carteira Profissional", "Carteira de Identidade Profissional"),
    
    // Documentos de Qualificação
    CNH("CNH", "Carteira Nacional de Habilitação"),
    CERTIFICACAO_PROFISSIONAL("Certificação Profissional", "Certificação Profissional"),
    DIPLOMA("Diploma", "Diploma de Formação"),
    
    // Documentos de Saúde
    ASO("ASO", "Atestado de Saúde Ocupacional"),
    EXAME_MEDICO("Exame Médico", "Exame Médico"),
    
    // Documentos de Veículo (para motoristas)
    CRLV("CRLV", "Certificado de Registro e Licenciamento de Veículo"),
    IPVA("IPVA", "Imposto sobre Propriedade de Veículos Automotores"),
    SEGURO("Seguro", "Apólice de Seguro"),
    
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