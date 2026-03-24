package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "message_deletion_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDeletionLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "message_id", nullable = false)
    private UUID messageId;
    
    @Column(name = "message_title", length = 255)
    private String messageTitle;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by_user_id", nullable = false)
    private User deletedBy;
    
    @Column(name = "deletion_reason", columnDefinition = "TEXT", nullable = false)
    private String deletionReason;
    
    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @PrePersist
    protected void onCreate() {
        deletedAt = LocalDateTime.now();
    }
}

