package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
 * Entidade que representa as inspeÃ§Ãµes de seguranÃ§a
 */
@Entity
@Table(name = "safety_inspections")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Data da inspeÃ§Ã£o Ã© obrigatÃ³ria")
    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @NotBlank(message = "Local da inspeÃ§Ã£o Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private String location;

    @NotNull(message = "Inspetor Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_user_id", nullable = false)
    private User inspectorUser;

    @NotBlank(message = "Tipo de inspeÃ§Ã£o Ã© obrigatÃ³rio")
    @Column(name = "inspection_type", nullable = false)
    private String inspectionType; // ROTINEIRA, ESPECIAL, AUDITORIA

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Column(nullable = false)
    @Builder.Default
    private String status = "AGENDADA"; // AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "photos_urls", columnDefinition = "TEXT[]")
    private String[] photosUrls;

    @Column(name = "documents_urls", columnDefinition = "TEXT[]")
    private String[] documentsUrls;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

