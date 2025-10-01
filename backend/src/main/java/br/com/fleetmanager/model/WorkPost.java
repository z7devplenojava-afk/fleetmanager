package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import br.com.fleetmanager.model.enums.WorkPostStatus;
import br.com.fleetmanager.model.enums.WorkPostType;

@Entity
@Table(name = "work_posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkPost {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    // Identificação do Posto
    @Column(nullable = false, unique = true)
    private String postCode; // Código do posto
    
    @Column(nullable = false)
    private String name; // Nome do posto
    
    @Column(columnDefinition = "TEXT")
    private String description; // Descrição detalhada
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkPostType type; // Tipo: 24H, SDF, 12H_NOTURNO
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private WorkPostStatus status; // Status: ATIVO, INATIVO, EM_IMPLANTACAO, SUSPENSO
    
    // Localização
    @Column(nullable = false)
    private String address; // Endereço do posto
    
    private String city;
    private String state;
    private String zipCode;
    
    // Cliente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = true)
    private Client client;
    
    // Contrato
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;
    
    // Configuração de Pessoal
    @Column(nullable = false)
    private Integer requiredVigilantes; // Quantidade de vigilantes necessários
    
    @Column(nullable = false)
    private String workSchedule; // Escala: 12x36, 6x1, etc.
    
    @Column(nullable = false)
    private LocalTime shiftStart; // Horário de início do turno
    
    @Column(nullable = false)
    private LocalTime shiftEnd; // Horário de fim do turno
    
    private String shiftDescription; // Descrição do turno (ex: "18:00 às 06:00")
    
    // Benefícios e Condições
    private Boolean transportVoucher; // Vale transporte
    private Boolean costAllowance; // Ajuda de custo
    private BigDecimal costAllowanceValue; // Valor da ajuda de custo
    private Boolean intrajourney; // Intrajornada
    private Boolean localMeal; // Alimentação no local
    private Boolean mealTicket; // Ticket alimentação
    private Boolean healthPlan; // Plano de saúde
    private Boolean dentalPlan; // Plano odontológico
    
    // Recursos e Equipamentos
    private Integer cars; // Quantidade de carros
    private Integer motorcycles; // Quantidade de motos
    private Integer radios; // Quantidade de rádios
    private Integer corporates; // Quantidade de corporativos
    private Boolean documentBank; // Banco DOC
    
    // Conformidade Legal
    @ElementCollection
    @CollectionTable(name = "work_post_nrs", joinColumns = @JoinColumn(name = "work_post_id"))
    @Column(name = "nr")
    private List<String> nrs; // Normas Regulamentadoras
    
    private Boolean pgr; // Programa de Gerenciamento de Riscos
    private Boolean pcmso; // Programa de Controle Médico de Saúde Ocupacional
    
    @ElementCollection
    @CollectionTable(name = "work_post_epis", joinColumns = @JoinColumn(name = "work_post_id"))
    @Column(name = "epi")
    private List<String> epis; // Equipamentos de Proteção Individual
    
    @ElementCollection
    @CollectionTable(name = "work_post_trainings", joinColumns = @JoinColumn(name = "work_post_id"))
    @Column(name = "training")
    private List<String> trainings; // Treinamentos necessários
    
    // Implantação
    private LocalDate implementationDate; // Data de implantação
    private LocalTime implementationTime; // Horário de implantação
    
    @Column(columnDefinition = "TEXT")
    private String observations; // Observações complementares
    
    // Responsável
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible; // Responsável pela implantação
    
    // Auditoria
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkSchedule> workSchedules = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<WorkSchedule> getWorkSchedules() {
        return workSchedules;
    }

    public void setWorkSchedules(List<WorkSchedule> workSchedules) {
        this.workSchedules = workSchedules;
    }
}