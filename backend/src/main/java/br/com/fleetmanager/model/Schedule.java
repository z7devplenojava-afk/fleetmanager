package br.com.fleetmanager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;

import br.com.fleetmanager.model.enums.ScheduleStatus;
import br.com.fleetmanager.model.enums.Shift;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "schedules")
public class Schedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference
    private Employee employee;
    
    @NotNull(message = "Schedule date is required")
    @Column(nullable = false)
    private LocalDate scheduleDate;
    
    @NotNull(message = "Shift is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Shift shift;
    
    @NotNull(message = "Location is required")
    @ManyToOne
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;
    
    @NotNull(message = "Schedule status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleStatus status;
    
    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;
    
    @ManyToOne
    @JoinColumn(name = "patrol_id")
    private Patrol patrol;
    
    @Size(max = 500, message = "Observations cannot exceed 500 characters")
    @Column(length = 500)
    private String observations;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
} 