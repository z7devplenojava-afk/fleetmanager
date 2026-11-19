package com.z7design.fleet_manager.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** NF-e modelo 55 (versão 4.00) emitida pela empresa. */
@Entity
@Table(name = "electronic_nfes")
@Data
@NoArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class ElectronicNfe {

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

    @Column(name = "access_key", nullable = false, length = 44)
    private String accessKey;

    /** RASCUNHO / PROCESSANDO / EMITIDA / ERRO / CANCELADA. */
    @Column(nullable = false, length = 20)
    private String status;

    /** 1 = produção, 2 = homologação. */
    @Column(nullable = false, length = 1)
    private String environment;

    @Column(name = "emission_date", nullable = false)
    private LocalDateTime emissionDate;

    @Column(name = "nature_operation", nullable = false, length = 120)
    private String natureOperation;

    @Column(name = "tp_nf", nullable = false, length = 1)
    private String tpNf;

    @Column(name = "id_dest", nullable = false, length = 1)
    private String idDest;

    @Column(name = "tp_imp", nullable = false, length = 1)
    private String tpImp;

    @Column(name = "tp_emis", nullable = false, length = 1)
    private String tpEmis;

    @Column(name = "fin_nfe", nullable = false, length = 1)
    private String finNfe;

    @Column(name = "ind_final", nullable = false, length = 1)
    private String indFinal;

    @Column(name = "ind_pres", nullable = false, length = 1)
    private String indPres;

    @Column(name = "proc_emi", nullable = false, length = 1)
    private String procEmi;

    @Column(name = "ver_proc", nullable = false, length = 20)
    private String verProc;

    @Column(name = "issuer_name", nullable = false, length = 200)
    private String issuerName;

    @Column(name = "issuer_tax_id", nullable = false, length = 20)
    private String issuerTaxId;

    @Column(name = "issuer_state_registration", length = 20)
    private String issuerStateRegistration;

    @Column(name = "issuer_state", length = 2)
    private String issuerState;

    @Column(name = "issuer_city", length = 120)
    private String issuerCity;

    @Column(name = "issuer_municipality_code", length = 7)
    private String issuerMunicipalityCode;

    @Column(name = "issuer_address", length = 255)
    private String issuerAddress;

    @Column(name = "issuer_address_number", length = 20)
    private String issuerAddressNumber;

    @Column(name = "issuer_neighborhood", length = 100)
    private String issuerNeighborhood;

    @Column(name = "issuer_zip", length = 12)
    private String issuerZip;

    @Column(name = "issuer_phone", length = 30)
    private String issuerPhone;

    @Column(name = "issuer_email", length = 120)
    private String issuerEmail;

    @Column(name = "issuer_crt", nullable = false, length = 1)
    private String issuerCrt;

    @Column(name = "recipient_name", length = 200)
    private String recipientName;

    @Column(name = "recipient_tax_id", length = 20)
    private String recipientTaxId;

    @Column(name = "recipient_state_registration", length = 20)
    private String recipientStateRegistration;

    @Column(name = "recipient_ind_iedest", length = 1)
    private String recipientIndIeDest;

    @Column(name = "recipient_email", length = 120)
    private String recipientEmail;

    @Column(name = "recipient_address", length = 255)
    private String recipientAddress;

    @Column(name = "recipient_address_number", length = 20)
    private String recipientAddressNumber;

    @Column(name = "recipient_neighborhood", length = 100)
    private String recipientNeighborhood;

    @Column(name = "recipient_city", length = 120)
    private String recipientCity;

    @Column(name = "recipient_state", length = 2)
    private String recipientState;

    @Column(name = "recipient_zip", length = 12)
    private String recipientZip;

    @Column(name = "recipient_municipality_code", length = 7)
    private String recipientMunicipalityCode;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "icms_base", nullable = false, precision = 15, scale = 2)
    private BigDecimal icmsBase;

    @Column(name = "icms_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal icmsValue;

    @Column(name = "pis_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal pisValue;

    @Column(name = "cofins_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal cofinsValue;

    /** tPag (01=dinheiro, 15=boleto, 90=sem pagamento). */
    @Column(name = "payment_type", nullable = false, length = 2)
    private String paymentType;

    /** indPag (0=à vista, 1=a prazo) — legado mantido por compatibilidade. */
    @Column(name = "payment_ind", nullable = false, length = 1)
    private String paymentInd;

    /** modFrete (9=sem ocorrência de transporte). */
    @Column(name = "freight_modality", nullable = false, length = 1)
    private String freightModality;

    @Column(name = "resp_tech_cnpj", length = 14)
    private String respTechCnpj;

    @Column(name = "resp_tech_contact", length = 60)
    private String respTechContact;

    @Column(name = "resp_tech_email", length = 60)
    private String respTechEmail;

    @Column(name = "resp_tech_phone", length = 14)
    private String respTechPhone;

    @Column(name = "protocol_number", length = 20)
    private String protocolNumber;

    @Column(name = "protocol_status", length = 10)
    private String protocolStatus;

    @Column(name = "protocol_message", columnDefinition = "TEXT")
    private String protocolMessage;

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

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "nfe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ElectronicNfeItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addItem(ElectronicNfeItem item) {
        item.setNfe(this);
        items.add(item);
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = "RASCUNHO";
        }
        if (environment == null || environment.isBlank()) {
            environment = "2";
        }
        if (tpNf == null || tpNf.isBlank()) tpNf = "1";
        if (idDest == null || idDest.isBlank()) idDest = "1";
        if (tpImp == null || tpImp.isBlank()) tpImp = "1";
        if (tpEmis == null || tpEmis.isBlank()) tpEmis = "1";
        if (finNfe == null || finNfe.isBlank()) finNfe = "1";
        if (indFinal == null || indFinal.isBlank()) indFinal = "1";
        if (indPres == null || indPres.isBlank()) indPres = "1";
        if (procEmi == null || procEmi.isBlank()) procEmi = "0";
        if (verProc == null || verProc.isBlank()) verProc = "FleetManager";
        if (paymentType == null || paymentType.isBlank()) {
            paymentType = "15";
        }
        if (paymentInd == null || paymentInd.isBlank()) {
            paymentInd = "0";
        }
        if (freightModality == null || freightModality.isBlank()) {
            freightModality = "9";
        }
        if (items == null) {
            items = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
