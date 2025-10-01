package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.QuoteStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotes")
public class Quote {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    @NotBlank(message = "Título é obrigatório")
    @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "quote_number", unique = true)
    private String quoteNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private QuoteStatus status = QuoteStatus.DRAFT;
    
    @Column(name = "total_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalValue;
    
    @Column(name = "valid_until")
    private LocalDate validUntil;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;
    
    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuoteItem> items = new ArrayList<>();
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public Quote() {}
    
    public Quote(String title, BigDecimal totalValue) {
        this.title = title;
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
    
    public String getQuoteNumber() {
        return quoteNumber;
    }
    
    public void setQuoteNumber(String quoteNumber) {
        this.quoteNumber = quoteNumber;
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
    
    public QuoteStatus getStatus() {
        return status;
    }
    
    public void setStatus(QuoteStatus status) {
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
    
    public List<QuoteItem> getItems() {
        return items;
    }
    
    public void setItems(List<QuoteItem> items) {
        this.items = items;
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