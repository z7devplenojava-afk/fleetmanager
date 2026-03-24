package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "employee_faces")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeFace {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;
    
    @Column(name = "cpf", nullable = false, unique = true, length = 14)
    private String cpf;
    
    @Lob
    @Column(name = "face_template", nullable = false)
    private byte[] faceTemplate;
    
    @Column(name = "face_encoding", columnDefinition = "TEXT")
    private String faceEncoding;
    
    @Column(name = "face_quality_score")
    private Double faceQualityScore;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // Relacionamento com Employee (opcional, para evitar problemas de lazy loading)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private Employee employee;
}

