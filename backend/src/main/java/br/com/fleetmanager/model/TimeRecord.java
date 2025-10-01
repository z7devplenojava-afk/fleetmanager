package br.com.fleetmanager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;
import br.com.fleetmanager.model.enums.TimeRecordStatus;

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
@Table(name = "time_records")
public class TimeRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference("employee-time-records")
    private Employee employee;
    
    @NotNull(message = "Record date is required")
    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;
    
    @NotNull(message = "Entry time is required")
    @Column(name = "entry_time")
    private LocalTime entryTime;
    
    @NotNull(message = "Exit time is required")
    @Column(name = "exit_time")
    private LocalTime exitTime;
    
    @NotNull(message = "Entry lunch time is required")
    @Column(name = "entry_lunch_time")
    private LocalTime entryLunchTime;
    
    @NotNull(message = "Exit lunch time is required")
    @Column(name = "exit_lunch_time")
    private LocalTime exitLunchTime;
    
    @NotNull(message = "Time record status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TimeRecordStatus status;
    
    @Size(max = 1000, message = "Justification cannot exceed 1000 characters")
    @Column(name = "justification")
    private String justification;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
} 