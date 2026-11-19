package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "service_invoices")
@Data
@NoArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class ServiceInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "fiscal_document_id")
    private UUID fiscalDocumentId;

    @Column(nullable = false, length = 20)
    private String number;

    @Column(nullable = false, length = 10)
    private String series;

    @Column(name = "verification_code", nullable = false, length = 50)
    private String verificationCode;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "emission_date", nullable = false)
    private LocalDateTime emissionDate;

    @Column(nullable = false, length = 7)
    private String competence;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "issuer_name", nullable = false, length = 200)
    private String issuerName;

    @Column(name = "issuer_tax_id", nullable = false, length = 20)
    private String issuerTaxId;

    @Column(name = "issuer_address")
    private String issuerAddress;

    @Column(name = "issuer_city", length = 120)
    private String issuerCity;

    @Column(name = "issuer_state", length = 2)
    private String issuerState;

    @Column(name = "issuer_zip", length = 12)
    private String issuerZip;

    @Column(name = "issuer_phone", length = 30)
    private String issuerPhone;

    @Column(name = "issuer_email", length = 120)
    private String issuerEmail;

    @Column(name = "issuer_municipal_registration", length = 30)
    private String issuerMunicipalRegistration;

    @Column(name = "taker_name", nullable = false, length = 200)
    private String takerName;

    @Column(name = "taker_tax_id", length = 20)
    private String takerTaxId;

    @Column(name = "taker_municipal_registration", length = 20)
    private String takerMunicipalRegistration;

    @Column(name = "taker_address")
    private String takerAddress;

    @Column(name = "taker_address_number", length = 20)
    private String takerAddressNumber;

    @Column(name = "taker_neighborhood", length = 100)
    private String takerNeighborhood;

    @Column(name = "taker_municipality_code", length = 7)
    private String takerMunicipalityCode;

    @Column(name = "taker_city", length = 120)
    private String takerCity;

    @Column(name = "taker_state", length = 2)
    private String takerState;

    @Column(name = "taker_zip", length = 12)
    private String takerZip;

    @Column(name = "taker_email", length = 120)
    private String takerEmail;

    @Column(name = "service_code", nullable = false, length = 20)
    private String serviceCode;

    @Column(name = "service_description", nullable = false)
    private String serviceDescription;

    @Column(columnDefinition = "TEXT")
    private String discrimination;

    @Column(name = "gross_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "deduction_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal deductionAmount;

    @Column(name = "iss_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal issRate;

    @Column(name = "iss_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal issAmount;

    @Column(name = "iss_withheld", nullable = false)
    private boolean issWithheld;

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ===================== NFS-e Nacional / DPS =====================

    @Column(name = "dps_number")
    private Long dpsNumber;

    @Column(name = "dps_id", length = 45)
    private String dpsId;

    @Column(name = "nfse_key", length = 50)
    private String nfseKey;

    /** 1 = Produção, 2 = Homologação. */
    @Column(length = 1)
    private String environment;

    @Column(name = "municipality_code", length = 7)
    private String municipalityCode;

    @Column(name = "service_location_code", length = 7)
    private String serviceLocationCode;

    @Column(name = "municipal_tax_code", length = 20)
    private String municipalTaxCode;

    @Column(name = "nbs_code", length = 9)
    private String nbsCode;

    @Column(name = "iss_taxation", length = 1)
    private String issTaxation;

    @Column(name = "iss_withholding_type", length = 1)
    private String issWithholdingType;

    @Column(name = "op_simp_nac", length = 1)
    private String opSimpNac;

    @Column(name = "reg_esp_trib", length = 1)
    private String regEspTrib;

    @Column(name = "inss_amount", precision = 15, scale = 2)
    private BigDecimal inssAmount;

    @Column(name = "irrf_amount", precision = 15, scale = 2)
    private BigDecimal irrfAmount;

    @Column(name = "csll_amount", precision = 15, scale = 2)
    private BigDecimal csllAmount;

    @Column(name = "iss_retained_amount", precision = 15, scale = 2)
    private BigDecimal issRetainedAmount;

    @Column(name = "signed_xml", columnDefinition = "TEXT")
    private String signedXml;

    @Column(name = "response_xml", columnDefinition = "TEXT")
    private String responseXml;

    @Column(name = "rejection_code", length = 20)
    private String rejectionCode;

    @Column(name = "rejection_message", columnDefinition = "TEXT")
    private String rejectionMessage;

    @Column(name = "certificate_id")
    private UUID certificateId;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    // ===================== IBS/CBS e eventos =====================

    @Column(name = "ibscbs_fin_nfse", length = 2)
    private String ibscbsFinNfse;

    @Column(name = "ibscbs_ind_final", length = 1)
    private String ibscbsIndFinal;

    @Column(name = "ibscbs_c_ind_op", length = 6)
    private String ibscbscIndOp;

    @Column(name = "ibscbs_tp_oper", length = 1)
    private String ibscbsTpOper;

    @Column(name = "ibscbs_tp_ente_gov", length = 1)
    private String ibscbsTpEnteGov;

    @Column(name = "ibscbs_ind_dest", length = 2)
    private String ibscbsIndDest;

    @Column(name = "ibscbs_cst", length = 3)
    private String ibscbsCst;

    @Column(name = "ibscbs_c_class_trib", length = 6)
    private String ibscbsCClassTrib;

    @Column(name = "ibscbs_c_cred_pres", length = 2)
    private String ibscbsCCredPres;

    @Column(name = "ibscbs_v_bc", precision = 15, scale = 2)
    private BigDecimal ibscbsVbc;

    @Column(name = "ibscbs_p_ibs_uf", precision = 7, scale = 4)
    private BigDecimal ibscbsPIbsUf;

    @Column(name = "ibscbs_p_ibs_mun", precision = 7, scale = 4)
    private BigDecimal ibscbsPIbsMun;

    @Column(name = "ibscbs_p_cbs", precision = 7, scale = 4)
    private BigDecimal ibscbsPCbs;

    @Column(name = "ibscbs_v_ibs", precision = 15, scale = 2)
    private BigDecimal ibscbsVIbs;

    @Column(name = "ibscbs_v_cbs", precision = 15, scale = 2)
    private BigDecimal ibscbsVCbs;

    @Column(name = "ibscbs_v_tot_nf", precision = 15, scale = 2)
    private BigDecimal ibscbsVTotNf;

    @Column(name = "event_xml", columnDefinition = "TEXT")
    private String eventXml;

    @Column(name = "event_response_xml", columnDefinition = "TEXT")
    private String eventResponseXml;

    @Column(name = "event_id", length = 60)
    private String eventId;

    @Column(name = "event_protocol", length = 60)
    private String eventProtocol;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceInvoiceItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addItem(ServiceInvoiceItem item) {
        item.setInvoice(this);
        items.add(item);
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = "EMITIDO";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
