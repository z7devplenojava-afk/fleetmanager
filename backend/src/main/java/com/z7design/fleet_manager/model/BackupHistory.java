package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * HistÃ³rico de execuÃ§Ãµes de backup
 */
@Entity
@Table(name = "backup_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "configuration_id", nullable = false)
    private BackupConfiguration configuration;
    
    @Column(nullable = false)
    private LocalDateTime backupDate;
    
    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, PARTIAL
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column(nullable = true)
    private String backupFilePath;
    
    @Column(nullable = true)
    private Long backupSizeBytes;
    
    @Column(nullable = true)
    private Integer durationSeconds;
    
    @Column(nullable = true)
    private Integer tablesBackedUp;
    
    @Column(nullable = true)
    private Long rowsBackedUp;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}


