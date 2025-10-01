package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payslips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payslip {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 255)
    private String employeeName;
    
    @Column(nullable = false, length = 20)
    private String cpf;
    
    @Column(nullable = false)
    private Integer month;
    
    @Column(nullable = false)
    private Integer year;
    
    @Column(nullable = false)
    private String fileName;
    
    @Column(nullable = false)
    private LocalDateTime processedAt;
    
    @PrePersist
    protected void onCreate() {
        processedAt = LocalDateTime.now();
    }
} 