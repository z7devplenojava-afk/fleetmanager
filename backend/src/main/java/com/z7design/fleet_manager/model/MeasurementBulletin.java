package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.MeasurementStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "measurement_bulletins")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementBulletin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name", nullable = false)
    private String companyName = "PROMOVER VIGILÃ‚NCIA PATRIMONIAL LTDA";

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "contract_number", nullable = false)
    private String contractNumber;

    @Column(name = "contract_start")
    private LocalDate contractStart;

    @Column(name = "contract_end")
    private LocalDate contractEnd;

    @Column(name = "nf_number")
    private String nfNumber;

    @Column(name = "elaborated_by", nullable = false)
    private String elaboratedBy;

    @Column(name = "measured_by", nullable = false)
    private String measuredBy;

    @Column(name = "validated_by")
    private String validatedBy;

    @Column(name = "checked_by")
    private String checkedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MeasurementStatus status = MeasurementStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "measurement_type")
    private com.z7design.fleet_manager.model.enums.MeasurementType measurementType = com.z7design.fleet_manager.model.enums.MeasurementType.GLOBAL;

    @Column(name = "subtotal", precision = 15, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @OneToMany(mappedBy = "bulletin", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<MeasurementItem> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "nfse_number", length = 50)
    private String nfseNumber;

    @Column(name = "nfse_key", length = 100)
    private String nfseKey;

    @Column(name = "nfse_pdf_url", length = 500)
    private String nfsePdfUrl;

    @Column(name = "nfse_xml_url", length = 500)
    private String nfseXmlUrl;

    @Column(name = "gross_amount", precision = 15, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "net_amount", precision = 15, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "fatura_locacao_number", length = 50)
    private String faturaLocacaoNumber;

    @Column(name = "pedido_number", length = 50)
    private String pedidoNumber;

    @Column(name = "periodo_locacao", length = 100)
    private String periodoLocacao;

    @Column(name = "placas_veiculos", columnDefinition = "TEXT")
    private String placasVeiculos;

    @Column(name = "dados_bancarios", length = 255)
    private String dadosBancarios;

    // MÃ©todo para calcular subtotal automaticamente
    public void calculateSubtotal() {
        this.subtotal = items.stream()
                .filter(item -> item.getUnitPrice() != null && item.getQuantity() != null)
                .map(item -> item.getUnitPrice().multiply(item.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // MÃ©todo para adicionar item
    public void addItem(MeasurementItem item) {
        items.add(item);
        item.setBulletin(this);
        calculateSubtotal();
    }

    // MÃ©todo para remover item
    public void removeItem(MeasurementItem item) {
        items.remove(item);
        item.setBulletin(null);
        calculateSubtotal();
    }

    // MÃ©todo para obter perÃ­odo formatado
    public String getFormattedPeriod() {
        if (periodStart != null && periodEnd != null) {
            return String.format("%s A %s",
                    periodStart.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yy")),
                    periodEnd.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yy")));
        }
        return "";
    }

    // MÃ©todo para obter status em portuguÃªs
    public String getStatusInPortuguese() {
        switch (status) {
            case DRAFT:
                return "Rascunho";
            case PENDING:
                return "Pendente";
            case VALIDATED:
                return "Validado";
            case CANCELLED:
                return "Cancelado";
            default:
                return status.toString();
        }
    }
}
