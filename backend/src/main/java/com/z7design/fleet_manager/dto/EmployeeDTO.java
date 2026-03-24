package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.z7design.fleet_manager.config.jackson.BlankStringToNullLocalDateDeserializer;
import com.z7design.fleet_manager.config.jackson.BlankStringToNullUuidDeserializer;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO {
    @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
    private java.util.UUID id;
    private String name;
    private String cpf;
    private String rg;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate birthDate;
    private String gender;
    private String maritalStatus;
    private String nationality;
    
    // Lista de dependentes (usado apenas para visualizaÃ§Ã£o, nÃ£o para criaÃ§Ã£o/atualizaÃ§Ã£o)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private java.util.List<com.z7design.fleet_manager.dto.DependentDTO> dependents;
    
    // private String photoUrl;
    // private String currentScale;
    private String email;
    private String phone;
    private String telefoneContato;
    private String cnhNumber;
    @JsonDeserialize(using = AddressDeserializer.class)
    private AddressDTO address;
    
    // Campos de endereÃ§o separados
    private String enderecoRua;
    private String enderecoNumero;
    private String enderecoComplemento;
    private String enderecoBairro;
    private String enderecoCidade;
    private String enderecoEstado;
    private String enderecoCep;
    
    // CIN (Carteira de Identidade Nacional)
    private String cinNumero;
    private String cinOrgaoEmissor;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate cinDataEmissao;
    
    // CTPS Digital PDF
    private byte[] ctpsDigitalPdf;
    private String ctpsDigitalPdfNome;
    private Long ctpsDigitalPdfTamanho;
    private BankInfoDTO bankInfo;
    private JobInfoDTO jobInfo;
    private List<DocumentDTO> documents;
    private EmergencyContactDTO emergencyContact;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // private String tituloEleitor;
    // private String carteiraIdentidade;
    // private String grauInstrucao;
    // private String pai;
    // private String mae;
    // private String naturalidade;
    // private String nationality;
    private String registrationNumber;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate hireDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate terminationDate;
    // Campos jÃ¡ implementados abaixo (linhas 87-141) - mantidos comentados para evitar duplicaÃ§Ã£o
    // private String cep;
    // private String ctps;
    // private String cbo;
    // private String pis;
    // private BigDecimal salario;
    // private Boolean fgtsOptante;
    // @JsonFormat(pattern = "yyyy-MM-dd")
    // private LocalDate fgtsDataOpcao;
    // private String fgtsBancoDepositario;
    // private String empresaNome;
    // private String empresaEndereco;
    // private String empresaCnpj;
    // private Boolean possuiWhatsapp;
    // private String caminhoPdf;
    // private String mesReferencia;
    // private String anoReferencia;
    private String notes;
    private String status;
    
    // Dados do cÃ´njuge
    private String spouseName;
    private String spouseCpf;
    private String spouseRg;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate spouseBirthDate;
    private String spousePhone;
    private String spouseEmail;
    
    // Campos da ficha de registro
    private String empresaNome;
    private String empresaEndereco;
    private String empresaCnpj;
    private String tituloEleitor;
    private String tituloEleitorZona;
    private String tituloEleitorSecao;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate tituloEleitorDataExpedicao;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate tituloEleitorValidade;
    private String nomeConselhoRegional;
    private String carteiraIdentidadeOrgaoEmissor;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate carteiraIdentidadeDataEmissao;
    private String certificadoMilitar;
    private String nomePai;
    private String nomeMae;
    private String localNascimento;
    private String municipioNascimento;
    private String estadoNascimento;
    private String sexo; // MASCULINO, FEMININO, OUTRO
    private String grauInstrucao;
    private String matriculaEsocial;
    private String cbo;
    private String pis;
    private BigDecimal salario;
    private String salarioPorExtenso;
    private String periodoPagamento;
    private String horarioTrabalho; // PerÃ­odo de Trabalho (ex: "18:00 Ã€S 06:00 H")
    private String horarioTrabalhoIntervalo; // Intervalo (ex: "23:00 Ã€S 00:00 H")
    private String diasTrabalho; // Dias de Trabalho (ex: "12X36")
    private String prazoExperienciaTexto; // Prazo de ExperiÃªncia em texto (ex: "45 DIAS")
    private String prorrogacaoExperiencia; // ProrrogaÃ§Ã£o do prazo de experiÃªncia
    private String folgaSemanal; // Dias de Folga (ex: "1Âª Escola")
    private String escalaTrabalho; // Escala de Trabalho
    private Boolean fgtsOptante;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate fgtsDataOpcao;
    private String fgtsBancoDepositario;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate fgtsDataRetratacao;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate pisDataCadastro;
    private String pisBancoDepositario;
    private String pisEnderecoBanco;
    private String pisCodigoBanco;
    private String pisCodigoAgencia;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate cnhExpirationDate;
    
    // Campo para Posto de Trabalho
    private String workPostId;
    
    // Campo para Departamento
    private String departmentId;
    private String cnhCategory;
    private String ctps;
    private String ctpsRural;
    private String ctpsSeries;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate ctpsIssueDate;
    private String ctpsIssuingAgency;
    private String carteiraModelo19;
    private String registroGeralEstrangeiro;
    private Boolean casadoBrasileiro;
    private String nomeConjugeEstrangeiro;
    private Boolean temFilhosBrasileiros;
    private Integer quantidadeFilhosBrasileiros;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate dataChegadaBrasil;
    private Boolean naturalizado;
    private String decretoNaturalizacao;
    private String vistoFiscalizacao;
    
    // Campos para Estrangeiro
    private String rneNumero; // RNE nÂº
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate rneValidade; // Validade do RNE
    private String ricNumero; // NÂº RIC (para naturalizados)
    private String ricOrgaoEmissor; // Ã“rgÃ£o Emissor do RIC
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate ricDataEmissao; // Data de EmissÃ£o do RIC
    private String tipoVisto; // Tipo de Visto
    
    private String assinaturaFuncionario;
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate dataRescisao;
    
    // Dados do Exame MÃ©dico (ASO)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
    private LocalDate exameMedicoData;
    private String exameMedicoTipo; // ADMISSIONAL, DEMISSIONAL, PERIODICO, MUDANCA_FUNCAO, RETORNO_TRABALHO
    private IdOnlyDTO exameMedicoDoctor; // ReferÃªncia ao mÃ©dico
    private String exameMedicoHorario; // Ex: "18:00 Ã€S 06:00 H"
    private Boolean exameMedicoIntervalosRefeicao; // true = Sim, false = NÃ£o
    private String exameMedicoObservacoes;
    private Boolean exameMedicoPrimeiroEmprego; // true = Sim, false = NÃ£o
    private Boolean exameMedicoContribuicaoSindicalPaga; // true = Sim, false = NÃ£o
    
    /**
     * UsuÃ¡rio do sistema vinculado ao funcionÃ¡rio (opcional).
     * SÃ³ deve ser preenchido se o funcionÃ¡rio tambÃ©m for usuÃ¡rio do sistema.
     */
    private IdOnlyDTO user;
    private PositionDTO position;
    private UnitDTO unit;
    private IdOnlyDTO company;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressDTO {
        private String street;
        private String number;
        private String complement;
        private String neighborhood;
        private String city;
        private String state;
        private String zipCode;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankInfoDTO {
        private String bank;
        private String agency;
        private String account;
        private String accountType;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JobInfoDTO {
        private String position;
        private String function;
        private String unit;
        @JsonFormat(pattern = "yyyy-MM-dd")
        @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
        private LocalDate admissionDate;
        @JsonFormat(pattern = "yyyy-MM-dd")
        @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
        private LocalDate probationEndDate;
        private String contractType;
        private BigDecimal salary;
        private String status;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentDTO {
        @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
        private java.util.UUID id;
        private String type;
        private String number;
        @JsonFormat(pattern = "yyyy-MM-dd")
        @JsonDeserialize(using = BlankStringToNullLocalDateDeserializer.class)
        private LocalDate issueDate;
        private String issuingAuthority;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmergencyContactDTO {
        private String name;
        private String relationship;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdOnlyDTO {
        @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
        private java.util.UUID id;
        private String name;
        private String username;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PositionDTO {
        @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
        private java.util.UUID id;
        private String name;
        private String description;
        private Double baseSalary;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitDTO {
        @JsonDeserialize(using = BlankStringToNullUuidDeserializer.class)
        private java.util.UUID id;
        private String name;
        private String description;
        private String address;
        private String phone;
        private String email;
        private String code;
        private String manager;
        private boolean active;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    
    // Deserializador customizado para o campo address
    public static class AddressDeserializer extends StdDeserializer<AddressDTO> {
        
        public AddressDeserializer() {
            super(AddressDTO.class);
        }
        
        @Override
        public AddressDTO deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            JsonNode node = p.getCodec().readTree(p);
            
            AddressDTO address = new AddressDTO();
            
            if (node.isTextual()) {
                // Se for string, usar como street
                address.setStreet(node.asText());
            } else if (node.isObject()) {
                // Se for objeto, mapear os campos
                if (node.has("street")) {
                    address.setStreet(node.get("street").asText());
                }
                if (node.has("number")) {
                    address.setNumber(node.get("number").asText());
                }
                if (node.has("complement")) {
                    address.setComplement(node.get("complement").asText());
                }
                if (node.has("neighborhood")) {
                    address.setNeighborhood(node.get("neighborhood").asText());
                }
                if (node.has("city")) {
                    address.setCity(node.get("city").asText());
                }
                if (node.has("state")) {
                    address.setState(node.get("state").asText());
                }
                if (node.has("zipCode")) {
                    address.setZipCode(node.get("zipCode").asText());
                }
            }
            
            return address;
        }
    }
} 
