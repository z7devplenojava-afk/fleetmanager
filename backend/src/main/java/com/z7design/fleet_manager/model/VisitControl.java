package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "visit_controls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitControl {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(length = 255)
    private String title; // TÃ­tulo da visita

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String assignedTo;

    @ManyToOne
    @JoinColumn(name = "supervisor_id")
    private Employee supervisor;

    @ManyToOne
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee; // FuncionÃ¡rio identificado no local da visita

    @Column(name = "employee_cpf")
    private String employeeCpf; // CPF informado manualmente (quando QR Code nÃ£o funciona)

    @Column(name = "employee_registration_number")
    private String employeeRegistrationNumber; // MatrÃ­cula informada manualmente

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false)
    private LocalTime scheduledAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisitControlStatus status = VisitControlStatus.SCHEDULED;

    @Column(length = 2000)
    private String observations;

    @Column(length = 2000)
    private String findings;

    private String reportUrl;

    @Column(nullable = false)
    private Boolean isSuccessful = false;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

