package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class OpportunityDTO {
    private java.util.UUID id;
    private String title;
    private String description;
    private java.util.UUID clientId;
    private java.util.UUID leadId;
    private java.util.UUID statusId;
    private UUID assignedToId;
    private BigDecimal estimatedValue;
    private LocalDateTime closeDate;
    private List<TaskDTO> tasks;
    private List<InteractionHistoryDTO> interactionHistories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
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
    
    public java.util.UUID getClientId() {
        return clientId;
    }
    
    public void setClientId(java.util.UUID clientId) {
        this.clientId = clientId;
    }
    
    public java.util.UUID getLeadId() {
        return leadId;
    }
    
    public void setLeadId(java.util.UUID leadId) {
        this.leadId = leadId;
    }
    
    public java.util.UUID getStatusId() {
        return statusId;
    }
    
    public void setStatusId(java.util.UUID statusId) {
        this.statusId = statusId;
    }
    
    public UUID getAssignedToId() {
        return assignedToId;
    }
    
    public void setAssignedToId(UUID assignedToId) {
        this.assignedToId = assignedToId;
    }
    
    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }
    
    public void setEstimatedValue(BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }
    
    public LocalDateTime getCloseDate() {
        return closeDate;
    }
    
    public void setCloseDate(LocalDateTime closeDate) {
        this.closeDate = closeDate;
    }
    
    public List<TaskDTO> getTasks() {
        return tasks;
    }
    
    public void setTasks(List<TaskDTO> tasks) {
        this.tasks = tasks;
    }
    
    public List<InteractionHistoryDTO> getInteractionHistories() {
        return interactionHistories;
    }
    
    public void setInteractionHistories(List<InteractionHistoryDTO> interactionHistories) {
        this.interactionHistories = interactionHistories;
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
