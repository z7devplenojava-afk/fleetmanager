package br.com.fleetmanager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

@Data
@Entity
@Table(name = "error_logs")
public class ErrorLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String message;
    
    @Column
    private String endpoint;
    
    @Column(columnDefinition = "TEXT")
    private String stackTrace;
    
    @Column(name = "created_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime timestamp;
} 