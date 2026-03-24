package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "trainings")
public class Training {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Training name is required")
    @Size(min = 3, max = 255, message = "Training name must be between 3 and 255 characters")
    @Column(nullable = false)
    private String name;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    @Column
    private String description;
    
    @NotBlank(message = "Provider name is required")
    @Size(min = 3, max = 255, message = "Provider name must be between 3 and 255 characters")
    @Column
    private String provider;
    
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1")
    @Column
    private Integer duration;

    @NotNull(message = "Renewal period is required")
    @Min(value = 1, message = "Renewal period must be at least 1 month")
    @Column(name = "renewal_period_months", nullable = false)
    @Builder.Default
    private Integer renewalPeriodMonths = 12;

    @Column(name = "mandatory_for_guards", nullable = false)
    @Builder.Default
    private Boolean mandatoryForGuards = Boolean.TRUE;
    
    @OneToMany(mappedBy = "training")
    @JsonIgnoreProperties("training")
    @JsonIgnore // Ignorar na serializaÃ§Ã£o JSON para evitar LazyInitializationException
    @Builder.Default
    private List<EmployeeCertification> certifications = new ArrayList<>();
    
    @Column(name = "created_at")
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
