package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.WorkPostStatus;
import com.z7design.fleet_manager.model.enums.WorkPostType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

@Entity
@Table(name = "work_posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "client", "contract", "responsible", "nrs", "epis", "trainings", "workSchedules"})
public class WorkPost {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    // IdentificaÃ§Ã£o do Posto
    @Column(nullable = false, unique = true)
    private String postCode; // CÃ³digo do posto
    
    @Column(nullable = false)
    private String name; // Nome do posto
    
    @Column(columnDefinition = "TEXT")
    private String description; // DescriÃ§Ã£o detalhada
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkPostType type; // Tipo: 24H, SDF, 12H_NOTURNO
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private WorkPostStatus status; // Status: ATIVO, INATIVO, EM_IMPLANTACAO, SUSPENSO
    
    // LocalizaÃ§Ã£o
    @Column(nullable = false)
    private String address; // EndereÃ§o do posto
    
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
    
    // ConfiguraÃ§Ã£o de Pessoal
    @Column(nullable = false)
    private Integer requiredVigilantes; // Quantidade de vigilantes necessÃ¡rios
    
    @Column(nullable = false)
    private String workSchedule; // Escala: 12x36, 6x1, etc.
    
    @Column(nullable = false)
    private LocalTime shiftStart; // HorÃ¡rio de inÃ­cio do turno
    
    @Column(nullable = false)
    private LocalTime shiftEnd; // HorÃ¡rio de fim do turno
    
    private String shiftDescription; // DescriÃ§Ã£o do turno (ex: "18:00 Ã s 06:00")
    
    // BenefÃ­cios e CondiÃ§Ãµes
    private Boolean transportVoucher; // Vale transporte
    private Boolean costAllowance; // Ajuda de custo
    private BigDecimal costAllowanceValue; // Valor da ajuda de custo
    private Boolean intrajourney; // Intrajornada
    private Boolean localMeal; // AlimentaÃ§Ã£o no local
    private Boolean mealTicket; // Ticket alimentaÃ§Ã£o
    private Boolean healthPlan; // Plano de saÃºde
    private Boolean dentalPlan; // Plano odontolÃ³gico
    
    // Recursos e Equipamentos
    private Integer cars; // Quantidade de carros
    private Integer motorcycles; // Quantidade de motos
    private Integer radios; // Quantidade de rÃ¡dios
    private Integer corporates; // Quantidade de corporativos
    private Boolean documentBank; // Banco DOC
    
    // Conformidade Legal
    @ElementCollection
    @CollectionTable(name = "work_post_nrs", joinColumns = @JoinColumn(name = "work_post_id"))
    @Column(name = "nr")
    private List<String> nrs; // Normas Regulamentadoras
    
    private Boolean pgr; // Programa de Gerenciamento de Riscos
    private Boolean pcmso; // Programa de Controle MÃ©dico de SaÃºde Ocupacional
    
    @ElementCollection
    @CollectionTable(name = "work_post_epis", joinColumns = @JoinColumn(name = "work_post_id"))
    @Column(name = "epi")
    private List<String> epis; // Equipamentos de ProteÃ§Ã£o Individual
    
    @ElementCollection
    @CollectionTable(name = "work_post_trainings", joinColumns = @JoinColumn(name = "work_post_id"))
    @Column(name = "training")
    private List<String> trainings; // Treinamentos necessÃ¡rios
    
    // ImplantaÃ§Ã£o
    private LocalDate implementationDate; // Data de implantaÃ§Ã£o
    private LocalTime implementationTime; // HorÃ¡rio de implantaÃ§Ã£o
    
    @Column(columnDefinition = "TEXT")
    private String observations; // ObservaÃ§Ãµes complementares
    
    // ResponsÃ¡vel
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible; // ResponsÃ¡vel pela implantaÃ§Ã£o
    
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
