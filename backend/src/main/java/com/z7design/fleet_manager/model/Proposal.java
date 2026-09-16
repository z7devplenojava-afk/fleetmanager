package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.ProposalStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.proxy.HibernateProxy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "proposals")
public class Proposal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Size(max = 255, message = "TÃ­tulo deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "proposal_number", unique = true)
    private String proposalNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Lead lead;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ProposalStatus status = ProposalStatus.DRAFT;
    
    @Column(name = "total_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalValue;
    
    @Column(name = "valid_until")
    private LocalDate validUntil;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "terms_conditions", columnDefinition = "TEXT")
    private String termsConditions;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;
    
    /** PRD Módulo 2: simulação de custos (Módulo 1) que originou os valores da proposta. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cost_simulation_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private com.z7design.fleet_manager.model.CostSimulation costSimulation;
    
    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProposalItem> items = new ArrayList<>();
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public Proposal() {}
    
    public Proposal(String title, Client client, BigDecimal totalValue) {
        this.title = title;
        this.client = client;
        this.totalValue = totalValue;
    }
    
    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }
    
    public void setId(java.util.UUID id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getProposalNumber() {
        return proposalNumber;
    }
    
    public void setProposalNumber(String proposalNumber) {
        this.proposalNumber = proposalNumber;
    }
    
    public Client getClient() {
        return client;
    }
    
    public void setClient(Client client) {
        this.client = client;
    }
    
    public Lead getLead() {
        if (lead == null) {
            return null;
        }
        
        // Tratar caso onde o Lead foi deletado mas a referÃªncia ainda existe
        try {
            // Se for um proxy do Hibernate, tentar inicializar
            if (lead instanceof HibernateProxy) {
                HibernateProxy proxy = (HibernateProxy) lead;
                try {
                    proxy.getHibernateLazyInitializer().initialize();
                } catch (jakarta.persistence.EntityNotFoundException e) {
                    // Lead foi deletado, retornar null
                    this.lead = null;
                    return null;
                }
            }
            // Verificar se o Lead ainda existe acessando um campo simples
            lead.getId();
            return lead;
        } catch (jakarta.persistence.EntityNotFoundException e) {
            // Lead foi deletado, limpar referÃªncia e retornar null
            this.lead = null;
            return null;
        } catch (Exception e) {
            // Outro erro, retornar null para evitar quebrar a serializaÃ§Ã£o
            return null;
        }
    }
    
    public void setLead(Lead lead) {
        this.lead = lead;
    }
    
    public ProposalStatus getStatus() {
        return status;
    }
    
    public void setStatus(ProposalStatus status) {
        this.status = status;
    }
    
    public BigDecimal getTotalValue() {
        return totalValue;
    }
    
    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }
    
    public LocalDate getValidUntil() {
        return validUntil;
    }
    
    public void setValidUntil(LocalDate validUntil) {
        this.validUntil = validUntil;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getTermsConditions() {
        return termsConditions;
    }
    
    public void setTermsConditions(String termsConditions) {
        this.termsConditions = termsConditions;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public User getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
    
    public User getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }
    
    public List<ProposalItem> getItems() {
        return items;
    }
    
    public void setItems(List<ProposalItem> items) {
        this.items = items;
    }

    public com.z7design.fleet_manager.model.CostSimulation getCostSimulation() {
        return costSimulation;
    }

    public void setCostSimulation(com.z7design.fleet_manager.model.CostSimulation costSimulation) {
        this.costSimulation = costSimulation;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
} 
