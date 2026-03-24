package com.z7design.fleet_manager.model;

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
 * Entidade que representa os membros da CIPA
 */
@Entity
@Table(name = "cipa_members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIPAMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Ano do mandato Ã© obrigatÃ³rio")
    @Column(name = "mandate_year", nullable = false)
    private Integer mandateYear;

    @NotNull(message = "PosiÃ§Ã£o Ã© obrigatÃ³ria")
    @Column(nullable = false)
    private String position; // TITULAR, SUPLENTE

    @Column(name = "function")
    private String function; // PRESIDENTE, VICE_PRESIDENTE, SECRETARIO, MEMBRO

    @NotNull(message = "Data da eleiÃ§Ã£o Ã© obrigatÃ³ria")
    @Column(name = "election_date", nullable = false)
    private LocalDate electionDate;

    @NotNull(message = "Data de inÃ­cio Ã© obrigatÃ³ria")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "Data de fim Ã© obrigatÃ³ria")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

