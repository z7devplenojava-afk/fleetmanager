package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "unified_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id")
    private Payslip payslip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id")
    private PaymentReceipt receipt;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "employee_name", length = 255)
    private String employeeName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "status", length = 20)
    @Enumerated(EnumType.STRING)
    private UnifiedDocumentStatus status;

    @Column(name = "matching_confidence", precision = 5, scale = 2)
    private BigDecimal matchingConfidence;

    @Column(name = "notes", length = 1000)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    public enum UnifiedDocumentStatus {
        PENDING("Pendente"),
        PROCESSED("Processado"),
        ERROR("Erro"),
        MANUAL_REVIEW("Revisão Manual");

        private final String description;

        UnifiedDocumentStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
} 