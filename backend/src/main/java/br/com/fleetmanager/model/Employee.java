package br.com.fleetmanager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import br.com.fleetmanager.model.enums.EmploymentStatus;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Entity
@Table(name = "employees")
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    
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
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Position position;
    
    @NotBlank(message = "Registration number is required")
    @Column(nullable = false)
    private String registrationNumber;
    
    @NotNull(message = "Hire date is required")
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate hireDate;
    
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
    
    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;
    
    @NotBlank(message = "Document is required")
    @Column(nullable = false, unique = true)
    private String document;
    
    @Column(name = "birth_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "unit_id")
    @JsonIgnoreProperties("employees")
    private Unit unit;
    
    @NotBlank(message = "Address is required")
    @Column
    private String address;
    
    @NotBlank(message = "Phone is required")
    @Column
    private String phone;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column
    private String email;
    
    @Column(name = "cnh_number", length = 20, unique = true)
    private String cnhNumber;
    
    // Dados Pessoais
    // @NotBlank(message = "O estado civil é obrigatório")
    // @Column(name = "marital_status")
    // private String maritalStatus;
    
    // @NotBlank(message = "A nacionalidade é obrigatória")
    // @Column
    // private String nationality;
    
    // @Column(name = "photo_url")
    // private String photoUrl;

    // Dados Profissionais
    // @Column(name = "current_scale")
    // private String currentScale;

    // Documentos
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Document> documents = new ArrayList<>();

    // Benefícios
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Benefit> benefits = new ArrayList<>();

    // Histórico de Escalas
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Schedule> schedules = new ArrayList<>();

    // Ocorrências
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Occurrence> occurrences = new ArrayList<>();

    // Holerites
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference("employee-payrolls")
    private List<Payroll> payrolls = new ArrayList<>();

    // EPIs
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<EPI> epis = new ArrayList<>();

    // Time Records
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @JsonManagedReference("employee-time-records")
    private List<TimeRecord> timeRecords = new ArrayList<>();

    // @Column(name = "caminho_pdf")
    // private String caminhoPdf;

    // @Column(name = "mes_referencia")
    // private String mesReferencia;

    // @Column(name = "ano_referencia")
    // private String anoReferencia;

    // @Column(name = "possui_whatsapp")
    // private Boolean possuiWhatsapp;

    // Campos adicionais para admissão completa
    // @Column(name = "titulo_eleitor")
    // private String tituloEleitor;

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

    // @Column(name = "ctps")
    // private String ctps;

    // @Column(name = "cbo")
    // private String cbo;

    // @Column(name = "pis")
    // private String pis;

    // @Column(name = "salario")
    // private java.math.BigDecimal salario;

    // FGTS
    // @Column(name = "fgts_optante")
    // private Boolean fgtsOptante;

    // @JsonFormat(pattern = "yyyy-MM-dd")
    // private LocalDate fgtsDataOpcao;

    // @Column(name = "fgts_banco_depositario")
    // private String fgtsBancoDepositario;

    // Empresa (dados básicos)
    // @Column(name = "empresa_nome")
    // private String empresaNome;

    // @Column(name = "empresa_endereco")
    // private String empresaEndereco;

    // @Column(name = "empresa_cnpj")
    // private String empresaCnpj;

    // Método para obter o nome completo do funcionário
    public String getFullName() {
        return this.name;
    }
} 