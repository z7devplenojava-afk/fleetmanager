package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "procurement_quote_comparisons")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProcurementQuoteComparison implements TenantAware {

    public enum ComparisonStatus {
        IN_QUOTATION,           // Coletando as 3 cotações
        READY_FOR_EVALUATION,   // 3 cotações preenchidas, prontas para avaliação
        APPROVED,               // Cotação vencedora aprovada
        REJECTED                // Rejeitado
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "requisition_id", nullable = false)
    private UUID requisitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", insertable = false, updatable = false)
    private MaterialRequisition requisition;

    @Column(name = "comparison_number", nullable = false, length = 50)
    private String comparisonNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    @Builder.Default
    private ComparisonStatus status = ComparisonStatus.IN_QUOTATION;

    @Column(name = "system_recommended_option_id")
    private UUID systemRecommendedOptionId;

    @Column(name = "system_recommendation_reason", columnDefinition = "TEXT")
    private String systemRecommendationReason;

    @Column(name = "chosen_option_id")
    private UUID chosenOptionId;

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_by_name")
    private String approvedByName;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @OneToMany(mappedBy = "comparison", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProcurementQuoteOption> options = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
