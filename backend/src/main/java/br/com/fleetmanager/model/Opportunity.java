package br.com.fleetmanager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.InteractionHistory;
import br.com.fleetmanager.model.KanbanStatus;
import br.com.fleetmanager.model.Task;

@Entity
@Table(name = "opportunities")
public class Opportunity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private KanbanStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "estimated_value", precision = 15, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @OneToMany(mappedBy = "opportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks;

    @OneToMany(mappedBy = "opportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InteractionHistory> interactionHistories;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters e Setters
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public Lead getLead() {
        return lead;
    }

    public void setLead(Lead lead) {
        this.lead = lead;
    }

    public KanbanStatus getStatus() {
        return status;
    }

    public void setStatus(KanbanStatus status) {
        this.status = status;
    }

    public User getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }

    public java.math.BigDecimal getEstimatedValue() {
        return estimatedValue;
    }

    public void setEstimatedValue(java.math.BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }

    public java.time.LocalDateTime getCloseDate() {
        return closeDate;
    }

    public void setCloseDate(java.time.LocalDateTime closeDate) {
        this.closeDate = closeDate;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // ...
} 