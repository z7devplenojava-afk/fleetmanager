package br.com.fleetmanager.model;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Entity
@Table(name = "routes")
public class Route {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Route name is required")
    @Size(min = 3, max = 100, message = "Route name must be between 3 and 100 characters")
    @Column(nullable = false)
    private String name;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(length = 500)
    private String description;
    
    @NotNull(message = "Unit is required")
    @ManyToOne
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @NotNull(message = "Location is required")
    @ManyToOne
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;
    
    @NotNull(message = "Estimated duration is required")
    @Positive(message = "Estimated duration must be a positive value")
    @Column(name = "estimated_duration")
    private Duration estimatedDuration;
    
    @Column(name = "checkpoints_required", nullable = false)
    private boolean checkpointsRequired;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
} 