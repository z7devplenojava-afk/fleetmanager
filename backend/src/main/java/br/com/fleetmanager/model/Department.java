package br.com.fleetmanager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Department {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Nome do departamento é obrigatório")
    @Column(nullable = false, length = 100, unique = true)
    private String name;
    
    @Column(length = 255)
    private String description;
    
    @Column(name = "email_domain")
    private String emailDomain;
    
    @Column(name = "manager_id")
    private UUID managerId;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Data de criação é obrigatória")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
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