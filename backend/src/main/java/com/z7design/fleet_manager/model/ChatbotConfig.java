package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "chatbot_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Nome do chatbot Ã© obrigatÃ³rio")
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String welcomeMessage;
    
    @Column(columnDefinition = "TEXT")
    private String defaultResponse;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "auto_respond")
    private Boolean autoRespond = true;
    
    @Column(name = "transfer_to_human_enabled")
    private Boolean transferToHumanEnabled = true;
    
    @Column(name = "working_hours_enabled")
    private Boolean workingHoursEnabled = false;
    
    @Column(name = "working_hours_start")
    private String workingHoursStart; // HH:mm format
    
    @Column(name = "working_hours_end")
    private String workingHoursEnd; // HH:mm format
    
    @Column(name = "offline_message", columnDefinition = "TEXT")
    private String offlineMessage;
    
    @Column(name = "max_wait_time_minutes")
    private Integer maxWaitTimeMinutes = 30;
    
    @Column(name = "auto_escalate_enabled")
    private Boolean autoEscalateEnabled = false;
    
    @Column(name = "auto_escalate_after_minutes")
    private Integer autoEscalateAfterMinutes = 15;
    
    @Column(name = "knowledge_base_enabled")
    private Boolean knowledgeBaseEnabled = false;
    
    @Column(name = "sentiment_analysis_enabled")
    private Boolean sentimentAnalysisEnabled = false;
    
    @Column(name = "language", length = 10)
    private String language = "pt-BR";
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


