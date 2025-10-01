package br.com.fleetmanager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;

import br.com.fleetmanager.model.enums.EvaluationStatus;
import br.com.fleetmanager.model.enums.EvaluationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "performance_evaluations")
public class PerformanceEvaluation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference
    private Employee employee;
    
    @NotNull(message = "Evaluator is required")
    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;
    
    @NotNull(message = "Evaluation date is required")
    @Column(name = "evaluation_date", nullable = false)
    private LocalDate evaluationDate;
    
    @NotNull(message = "Evaluation type is required")
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EvaluationType evaluationType;
    
    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be at least 0")
    @Max(value = 100, message = "Score cannot exceed 100")
    @Column(nullable = false)
    private Integer score;
    
    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    @Column(length = 1000)
    private String comments;
    
    @NotNull(message = "Evaluation status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationStatus status;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
} 