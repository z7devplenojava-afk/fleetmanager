package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.Department;

import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;
import com.z7design.fleet_manager.tenant.TenantEntityListener;

@Data
@Entity
@Table(name = "employees")
@EntityListeners(TenantEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "documents", "benefits", "dependents", "timeRecords",
        "payrolls", "epis", "occurrences" })
@Filter(name = "tenantFilter", condition = "(company_id = :companyId OR company_id IS NULL)")
public class Employee implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "position_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Position position;

    @Column
    private String registrationNumber;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate hireDate;

    @Column(name = "probation_end_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate probationEndDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentStatus status;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column
    private String name;

    @Column(nullable = true)
    private String document;

    @Column(name = "birth_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "unit_id")
    @JsonIgnoreProperties("employees")
    private Unit unit;

    @Column
    private String address; // Mantido para compatibilidade

    // Campos de endereÃ§o separados
    @Column(name = "endereco_rua", length = 255)
    private String enderecoRua;

    @Column(name = "endereco_numero", length = 20)
    private String enderecoNumero;

    @Column(name = "endereco_complemento", length = 100)
    private String enderecoComplemento;

    @Column(name = "endereco_bairro", length = 100)
    private String enderecoBairro;

    @Column(name = "endereco_cidade", length = 100)
    private String enderecoCidade;

    @Column(name = "endereco_estado", length = 2)
    private String enderecoEstado;

    @Column(name = "endereco_cep", length = 10)
    private String enderecoCep;

    @Column
    private String phone;

    @Column(name = "telefone_contato", length = 20)
    private String telefoneContato;

    @Email(message = "Invalid email format")
    @Column
    private String email;

    // CNH - cnh_number jÃ¡ existe (V504), adicionar apenas campos complementares
    @Column(name = "cnh_number", length = 20)
    private String cnhNumber;

    @Column(name = "cnh_expiration_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate cnhExpirationDate;

    @Column(name = "cnh_category", length = 5)
    private String cnhCategory;

    // CTPS - ctps jÃ¡ existe (V256), adicionar apenas campos complementares
    @Column(name = "ctps_series", length = 10)
    private String ctpsSeries;

    @Column(name = "ctps_issue_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate ctpsIssueDate;

    @Column(name = "ctps_issuing_agency", length = 100)
    private String ctpsIssuingAgency;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonBackReference("company-employees")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "work_post_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private WorkPost workPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Department department;

    // Dados Pessoais
    @Column(name = "marital_status")
    private String maritalStatus;

    @Column(name = "nationality", length = 50)
    private String nationality;

    // @Column(name = "photo_url")
    // private String photoUrl;

    // Dados Profissionais
    // @Column(name = "current_scale")
    // private String currentScale;

    // Documentos
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Document> documents = new ArrayList<>();

    // BenefÃ­cios
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Benefit> benefits = new ArrayList<>();

    // HistÃ³rico de Escalas
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Schedule> schedules = new ArrayList<>();

    // OcorrÃªncias
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Occurrence> occurrences = new ArrayList<>();

    // Holerites
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Payroll> payrolls = new ArrayList<>();

    // EPIs
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<EPI> epis = new ArrayList<>();

    // Time Records
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<TimeRecord> timeRecords = new ArrayList<>();

    // Dependentes
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Dependent> dependents = new ArrayList<>();

    // @Column(name = "caminho_pdf")
    // private String caminhoPdf;

    // @Column(name = "mes_referencia")
    // private String mesReferencia;

    // @Column(name = "ano_referencia")
    // private String anoReferencia;

    // @Column(name = "possui_whatsapp")
    // private Boolean possuiWhatsapp;

    // Campos adicionais para admissÃ£o completa
    @Column(name = "titulo_eleitor", length = 20)
    private String tituloEleitor;

    // @Column(name = "carteira_identidade")
    // private String carteiraIdentidade;

    // @Column(name = "grau_instrucao")
    // private String grauInstrucao;

    // @Column(name = "pai")
    // private String pai;

    // @Column(name = "mae")
    // private String mae;

    // @Column(name = "naturalidade")
    // private String naturalidade;

    // @Column(name = "cep")
    // private String cep;

    @Column(name = "ctps", length = 30)
    private String ctps;

    @Column(name = "ctps_rural", length = 30)
    private String ctpsRural;

    @Column(name = "titulo_eleitor_zona", length = 10)
    private String tituloEleitorZona;

    @Column(name = "titulo_eleitor_secao", length = 10)
    private String tituloEleitorSecao;

    @Column(name = "titulo_eleitor_data_expedicao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tituloEleitorDataExpedicao;

    @Column(name = "titulo_eleitor_validade")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tituloEleitorValidade;

    @Column(name = "nome_conselho_regional", length = 100)
    private String nomeConselhoRegional;

    @Column(name = "carteira_identidade_orgao_emissor", length = 50)
    private String carteiraIdentidadeOrgaoEmissor;

    @Column(name = "carteira_identidade_data_emissao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate carteiraIdentidadeDataEmissao;

    // CIN - Carteira de Identidade Nacional
    @Column(name = "cin_numero", length = 30)
    private String cinNumero;

    @Column(name = "cin_orgao_emissor", length = 50)
    private String cinOrgaoEmissor;

    @Column(name = "cin_data_emissao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate cinDataEmissao;

    // Upload PDF da CTPS Digital
    @Column(name = "ctps_digital_pdf", columnDefinition = "BYTEA")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private byte[] ctpsDigitalPdf;

    @Column(name = "ctps_digital_pdf_nome", length = 255)
    private String ctpsDigitalPdfNome;

    @Column(name = "ctps_digital_pdf_tamanho")
    private Long ctpsDigitalPdfTamanho;

    @Column(name = "certificado_militar", length = 30)
    private String certificadoMilitar;

    @Column(name = "cbo", length = 20)
    private String cbo;

    @Column(name = "pis", length = 20)
    private String pis;

    @Column(name = "salario")
    private java.math.BigDecimal salario;

    @Column(name = "salario_por_extenso", columnDefinition = "TEXT")
    private String salarioPorExtenso;

    @Column(name = "periodo_pagamento", length = 50)
    private String periodoPagamento;

    @Column(name = "horario_trabalho", columnDefinition = "TEXT")
    private String horarioTrabalho; // PerÃ­odo de Trabalho (ex: "18:00 Ã€S 06:00 H")

    @Column(name = "horario_trabalho_intervalo", length = 100)
    private String horarioTrabalhoIntervalo; // Intervalo (ex: "23:00 Ã€S 00:00 H")

    @Column(name = "dias_trabalho", length = 20)
    private String diasTrabalho; // Dias de Trabalho (ex: "12X36")

    @Column(name = "prazo_experiencia_texto", length = 50)
    private String prazoExperienciaTexto; // Prazo de ExperiÃªncia em texto (ex: "45 DIAS")

    @Column(name = "prorrogacao_experiencia", length = 50)
    private String prorrogacaoExperiencia; // ProrrogaÃ§Ã£o do prazo de experiÃªncia

    @Column(name = "folga_semanal", length = 50)
    private String folgaSemanal; // Dias de Folga (ex: "1Âª Escola")

    @Column(name = "escala_trabalho", length = 100)
    private String escalaTrabalho; // Escala de Trabalho

    // FGTS
    @Column(name = "fgts_optante")
    private Boolean fgtsOptante;

    @Column(name = "fgts_data_opcao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fgtsDataOpcao;

    @Column(name = "fgts_banco_depositario", length = 100)
    private String fgtsBancoDepositario;

    @Column(name = "fgts_data_retratacao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fgtsDataRetratacao;

    // Empresa (dados bÃ¡sicos)
    @Column(name = "empresa_nome", length = 100)
    private String empresaNome;

    @Column(name = "empresa_endereco", length = 255)
    private String empresaEndereco;

    @Column(name = "empresa_cnpj", length = 20)
    private String empresaCnpj;

    @Column(name = "visto_fiscalizacao", columnDefinition = "TEXT")
    private String vistoFiscalizacao;

    // InformaÃ§Ãµes pessoais adicionais
    @Column(name = "nome_pai", length = 100)
    private String nomePai;

    @Column(name = "nome_mae", length = 100)
    private String nomeMae;

    @Column(name = "local_nascimento", length = 100)
    private String localNascimento;

    @Column(name = "municipio_nascimento", length = 100)
    private String municipioNascimento;

    @Column(name = "estado_nascimento", length = 2)
    private String estadoNascimento;

    @Column(name = "sexo", length = 20)
    private String sexo; // MASCULINO, FEMININO, OUTRO

    @Column(name = "grau_instrucao", length = 50)
    private String grauInstrucao;

    @Column(name = "matricula_esocial", length = 50)
    private String matriculaEsocial;

    // PIS
    @Column(name = "pis_data_cadastro")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate pisDataCadastro;

    @Column(name = "pis_banco_depositario", length = 100)
    private String pisBancoDepositario;

    @Column(name = "pis_endereco_banco", length = 255)
    private String pisEnderecoBanco;

    @Column(name = "pis_codigo_banco", length = 10)
    private String pisCodigoBanco;

    @Column(name = "pis_codigo_agencia", length = 10)
    private String pisCodigoAgencia;

    // Dados BancÃ¡rios
    @Column(name = "banco", length = 100)
    private String banco;

    @Column(name = "agencia", length = 20)
    private String agencia;

    @Column(name = "conta_corrente", length = 20)
    private String contaCorrente;

    // Estrangeiros
    @Column(name = "carteira_modelo_19", length = 30)
    private String carteiraModelo19;

    @Column(name = "registro_geral_estrangeiro", length = 30)
    private String registroGeralEstrangeiro;

    @Column(name = "rne_numero", length = 30)
    private String rneNumero; // RNE nÂº

    @Column(name = "rne_validade")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate rneValidade; // Validade do RNE

    @Column(name = "casado_brasileiro")
    private Boolean casadoBrasileiro;

    @Column(name = "nome_conjuge_estrangeiro", length = 100)
    private String nomeConjugeEstrangeiro;

    // RIC - Registro de Identidade Civil (para naturalizados)
    @Column(name = "ric_numero", length = 30)
    private String ricNumero; // NÂº RIC

    @Column(name = "ric_orgao_emissor", length = 50)
    private String ricOrgaoEmissor; // Ã“rgÃ£o Emissor do RIC

    @Column(name = "ric_data_emissao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate ricDataEmissao; // Data de EmissÃ£o do RIC

    @Column(name = "tipo_visto", length = 50)
    private String tipoVisto; // Tipo de Visto

    // Dados do cÃ´njuge
    @Column(name = "spouse_name", length = 100)
    private String spouseName;

    @Column(name = "spouse_cpf", length = 14)
    private String spouseCpf;

    @Column(name = "spouse_rg", length = 20)
    private String spouseRg;

    @Column(name = "spouse_birth_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate spouseBirthDate;

    @Column(name = "spouse_phone", length = 20)
    private String spousePhone;

    @Column(name = "spouse_email", length = 100)
    @Email
    private String spouseEmail;

    @Column(name = "tem_filhos_brasileiros")
    private Boolean temFilhosBrasileiros;

    @Column(name = "quantidade_filhos_brasileiros")
    private Integer quantidadeFilhosBrasileiros;

    @Column(name = "data_chegada_brasil")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataChegadaBrasil;

    @Column(name = "naturalizado")
    private Boolean naturalizado;

    @Column(name = "decreto_naturalizacao", length = 50)
    private String decretoNaturalizacao;

    // Assinaturas e controle
    @Column(name = "assinatura_funcionario", columnDefinition = "TEXT")
    private String assinaturaFuncionario;

    @Column(name = "data_rescisao")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataRescisao;

    // Dados do Exame MÃ©dico (ASO)
    @Column(name = "exame_medico_data")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate exameMedicoData;

    @Column(name = "exame_medico_tipo", length = 50)
    private String exameMedicoTipo; // ADMISSIONAL, DEMISSIONAL, PERIODICO, MUDANCA_FUNCAO, RETORNO_TRABALHO

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "exame_medico_doctor_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Doctor exameMedicoDoctor;

    @Column(name = "exame_medico_horario", length = 100)
    private String exameMedicoHorario; // Ex: "18:00 Ã€S 06:00 H"

    @Column(name = "exame_medico_intervalos_refeicao")
    private Boolean exameMedicoIntervalosRefeicao; // true = Sim, false = NÃ£o

    @Column(name = "exame_medico_observacoes", columnDefinition = "TEXT")
    private String exameMedicoObservacoes;

    @Column(name = "exame_medico_primeiro_emprego")
    private Boolean exameMedicoPrimeiroEmprego; // true = Sim, false = NÃ£o

    @Column(name = "exame_medico_contribuicao_sindical_paga")
    private Boolean exameMedicoContribuicaoSindicalPaga; // true = Sim, false = Não

    // =========================================================================
    // Campos de Benefícios e Descontos (importação da planilha de folha)
    // =========================================================================

    @Column(name = "mensalidade_plano_saude", precision = 15, scale = 2)
    private java.math.BigDecimal mensalidadePlanoSaude;

    @Column(name = "coparticipacao_saude", precision = 15, scale = 2)
    private java.math.BigDecimal coparticipacaoSaude;

    @Column(name = "plano_odontologico", precision = 15, scale = 2)
    private java.math.BigDecimal planoOdontologico;

    @Column(name = "vale_transporte", precision = 15, scale = 2)
    private java.math.BigDecimal valeTransporte;

    @Column(name = "desconto_multas", precision = 15, scale = 2)
    private java.math.BigDecimal descontoMultas;

    @Column(name = "desconto_avarias", precision = 15, scale = 2)
    private java.math.BigDecimal descontoAvarias;

    @Column(name = "vale_adiantamento", precision = 15, scale = 2)
    private java.math.BigDecimal valeAdiantamento;

    @Column(name = "adicional_noturno", precision = 15, scale = 2)
    private java.math.BigDecimal adicionalNoturno;

    @Column(name = "horas_extras_50", precision = 15, scale = 2)
    private java.math.BigDecimal horasExtras50;

    @Column(name = "horas_extras_60", precision = 15, scale = 2)
    private java.math.BigDecimal horasExtras60;

    @Column(name = "horas_extras_100", precision = 15, scale = 2)
    private java.math.BigDecimal horasExtras100;

    @Column(name = "afastamento_motivo", length = 255)
    private String afastamentoMotivo;

    @Column(name = "afastamento_data")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate afastamentoData;

    // Campos Ficha de Registro de Empregado
    @Column(name = "ativ_federal", length = 50)
    private String ativFederal;

    @Column(name = "numero_recibo", length = 50)
    private String numeroRecibo;

    @Column(name = "raca_cor", length = 30)
    private String racaCor;

    @Column(name = "sindicato", length = 100)
    private String sindicato;

    @Column(name = "organograma", length = 100)
    private String organograma;

    @Column(name = "modo_pagamento", length = 50)
    private String modoPagamento;

    @Column(name = "ctps_uf", length = 2)
    private String ctpsUf;

    @Column(name = "codigo_funcionario", length = 50)
    private String codigoFuncionario;

    @Column(name = "reservista_categoria", length = 50)
    private String reservistaCategoria;

    @Column(name = "registro_profissional", length = 50)
    private String registroProfissional;

    @Column(name = "data_registro_profissional")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataRegistroProfissional;

    // Método para obter o nome completo do funcionário
    public String getFullName() {
        return this.name;
    }
}
