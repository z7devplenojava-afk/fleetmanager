package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class TaskDTO {
    private java.util.UUID id;
    private String title;
    private String description;
    private java.util.UUID opportunityId;
    private UUID assignedToId;
    private LocalDateTime dueDate;
    private Boolean completed;
    private LocalDateTime createdAt;

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
    public java.util.UUID getOpportunityId() {
        return opportunityId;
    }
    public void setOpportunityId(java.util.UUID opportunityId) {
        this.opportunityId = opportunityId;
    }
    public UUID getAssignedToId() {
        return assignedToId;
    }
    public void setAssignedToId(UUID assignedToId) {
        this.assignedToId = assignedToId;
    }
    public java.time.LocalDateTime getDueDate() {
        return dueDate;
    }
    public void setDueDate(java.time.LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    public Boolean getCompleted() {
        return completed;
    }
    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }
    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 
