package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.QuoteStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class QuoteDTO {
    
    private java.util.UUID id;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Size(max = 255, message = "TÃ­tulo deve ter no mÃ¡ximo 255 caracteres")
    private String title;
    
    private String quoteNumber;
    
    private java.util.UUID clientId;
    
    private String clientName;
    
    private java.util.UUID leadId;
    
    private String leadName;
    
    private QuoteStatus status = QuoteStatus.DRAFT;
    
    @NotNull(message = "Valor total Ã© obrigatÃ³rio")
    private BigDecimal totalValue;
    
    private LocalDate validUntil;
    
    private String description;
    
    private String notes;
    
    private Integer estimatedDuration; // em dias
    
    private String paymentTerms;
    
    private java.util.UUID createdById;
    
    private String createdByName;
    
    private java.util.UUID assignedToId;
    
    private String assignedToName;
    
    private List<QuoteItemDTO> items;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Constructors
    public QuoteDTO() {}
    
    public QuoteDTO(String title, BigDecimal totalValue) {
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
    
    public java.util.UUID getClientId() {
        return clientId;
    }
    
    public void setClientId(java.util.UUID clientId) {
        this.clientId = clientId;
    }
    
    public String getClientName() {
        return clientName;
    }
    
    public void setClientName(String clientName) {
        this.clientName = clientName;
    }
    
    public java.util.UUID getLeadId() {
        return leadId;
    }
    
    public void setLeadId(java.util.UUID leadId) {
        this.leadId = leadId;
    }
    
    public String getLeadName() {
        return leadName;
    }
    
    public void setLeadName(String leadName) {
        this.leadName = leadName;
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
    
    public Integer getEstimatedDuration() {
        return estimatedDuration;
    }
    
    public void setEstimatedDuration(Integer estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }
    
    public String getPaymentTerms() {
        return paymentTerms;
    }
    
    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }
    
    public java.util.UUID getCreatedById() {
        return createdById;
    }
    
    public void setCreatedById(java.util.UUID createdById) {
        this.createdById = createdById;
    }
    
    public String getCreatedByName() {
        return createdByName;
    }
    
    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }
    
    public java.util.UUID getAssignedToId() {
        return assignedToId;
    }
    
    public void setAssignedToId(java.util.UUID assignedToId) {
        this.assignedToId = assignedToId;
    }
    
    public String getAssignedToName() {
        return assignedToName;
    }
    
    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }
    
    public List<QuoteItemDTO> getItems() {
        return items;
    }
    
    public void setItems(List<QuoteItemDTO> items) {
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
