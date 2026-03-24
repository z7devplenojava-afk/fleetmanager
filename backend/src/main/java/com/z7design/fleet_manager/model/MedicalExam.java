package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.MedicalExamResult;
import com.z7design.fleet_manager.model.enums.MedicalExamStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa o controle de exames mÃ©dicos (ASO) dos funcionÃ¡rios
 */
@Entity
@Table(name = "medical_exams")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalExam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Tipo de exame Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_type_id", nullable = false)
    private MedicalExamType examType;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Column(name = "doctor_name")
    private String doctorName;

    @Column(name = "doctor_crm")
    private String doctorCrm;

    @Column(name = "clinic_name")
    private String clinicName;

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MedicalExamStatus status = MedicalExamStatus.PENDENTE;

    @Enumerated(EnumType.STRING)
    private MedicalExamResult result;

    @Column(columnDefinition = "TEXT")
    private String restrictions;

    @Column(name = "document_url")
    private String documentUrl; // URL do ASO digitalizado

    @Column(name = "next_exam_date")
    private LocalDate nextExamDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

