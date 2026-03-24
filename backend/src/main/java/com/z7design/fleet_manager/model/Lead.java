package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.z7design.fleet_manager.model.enums.LeadSource;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lead {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    @Size(max = 255, message = "Nome deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "name", nullable = false)
    private String name;
    
    @Email(message = "Email deve ser vÃ¡lido")
    @Size(max = 255, message = "Email deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "email")
    private String email;
    
    @Size(max = 20, message = "Telefone deve ter no mÃ¡ximo 20 caracteres")
    @Column(name = "phone")
    private String phone;
    
    @Size(max = 20, message = "Celular deve ter no mÃ¡ximo 20 caracteres")
    @Column(name = "mobile")
    private String mobile;
    
    @Size(max = 255, message = "Empresa deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "company")
    private String company;
    
    @Size(max = 255, message = "Cargo deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "position")
    private String position;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LeadStatus status = LeadStatus.NEW;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private LeadSource source = LeadSource.OTHER;
    
    @Column(name = "estimated_value", precision = 15, scale = 2)
    private BigDecimal estimatedValue;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private User assignedTo;
    
    // Campo transiente para facilitar serializaÃ§Ã£o JSON
    @Transient
    @JsonProperty("assignedToName")
    private String assignedToName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @Column(name = "next_follow_up")
    private LocalDateTime nextFollowUp;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public Lead() {}
    
    public Lead(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }
    
    public void setId(java.util.UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getMobile() {
        return mobile;
    }
    
    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
    
    public String getCompany() {
        return company;
    }
    
    public void setCompany(String company) {
        this.company = company;
    }
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public LeadStatus getStatus() {
        return status;
    }
    
    public void setStatus(LeadStatus status) {
        this.status = status;
    }
    
    public LeadSource getSource() {
        return source;
    }
    
    public void setSource(LeadSource source) {
        this.source = source;
    }
    
    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }
    
    public void setEstimatedValue(BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public User getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
        // Atualizar assignedToName quando assignedTo for definido
        if (assignedTo != null) {
            this.assignedToName = assignedTo.getName() != null ? assignedTo.getName() : assignedTo.getUsername();
        } else {
            this.assignedToName = null;
        }
    }
    
    public String getAssignedToName() {
        // Se assignedToName nÃ£o estiver definido, tentar obter de assignedTo
        if (assignedToName == null && assignedTo != null) {
            return assignedTo.getName() != null ? assignedTo.getName() : assignedTo.getUsername();
        }
        return assignedToName;
    }
    
    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }
    
    public User getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getNextFollowUp() {
        return nextFollowUp;
    }
    
    public void setNextFollowUp(LocalDateTime nextFollowUp) {
        this.nextFollowUp = nextFollowUp;
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
