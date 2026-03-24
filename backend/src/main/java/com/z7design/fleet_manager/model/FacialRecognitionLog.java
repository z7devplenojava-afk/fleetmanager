package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "facial_recognition_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacialRecognitionLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "employee_id")
    private UUID employeeId;
    
    @Column(name = "cpf", length = 14)
    private String cpf;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "recognition_type", nullable = false, length = 50)
    private RecognitionType recognitionType;
    
    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;
    
    @Column(name = "face_quality_score", precision = 5, scale = 2)
    private BigDecimal faceQualityScore;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "recognition_status", nullable = false, length = 20)
    private RecognitionStatus recognitionStatus;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "location_latitude", precision = 10, scale = 8)
    private BigDecimal locationLatitude;
    
    @Column(name = "location_longitude", precision = 11, scale = 8)
    private BigDecimal locationLongitude;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Relacionamento com Employee (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private Employee employee;
    
    public enum RecognitionType {
        LOGIN, VISIT, ATTENDANCE, REGISTRATION
    }
    
    public enum RecognitionStatus {
        SUCCESS, FAILED, LOW_CONFIDENCE, FACE_NOT_FOUND, POOR_QUALITY
    }
}

