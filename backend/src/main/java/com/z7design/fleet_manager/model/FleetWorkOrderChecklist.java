package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ordem_servico_checklist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetWorkOrderChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    private FleetWorkOrder workOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checklist_item_id", nullable = false)
    private ChecklistItem checklistItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ChecklistStatus situacao = ChecklistStatus.OK;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "reparo_realizado", columnDefinition = "TEXT")
    private String reparoRealizado;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum ChecklistStatus {
        OK, NAO_OK, NAO_APLICA
    }
}
