package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "prospected_leads")
public class ProspectingLead {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ── Identificação da empresa ──────────────────────────────
    @Column(name = "cnpj", length = 20)
    private String cnpj;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "trade_name", length = 255)
    private String tradeName;

    @Column(name = "cnae", length = 20)
    private String cnae;

    @Column(name = "cnae_description", length = 500)
    private String cnaeDescription;

    @Column(name = "activity", length = 255)
    private String activity;

    // ── Endereço ──────────────────────────────────────────────
    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "neighborhood", length = 255)
    private String neighborhood;

    @Column(name = "city", length = 255)
    private String city;

    @Column(name = "state", length = 50)
    private String state;

    @Column(name = "cep", length = 20)
    private String cep;

    // ── Contato ───────────────────────────────────────────────
    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "whatsapp", length = 30)
    private String whatsapp;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "website", length = 500)
    private String website;

    // ── Sócios / decisores / compras (JSON) ──────────────────
    @Column(name = "partner_names", columnDefinition = "TEXT")
    private String partnerNames;

    @Column(name = "purchasing_contacts", columnDefinition = "TEXT")
    private String purchasingContacts;

    // ── Dados Google Maps ────────────────────────────────────
    @Column(name = "google_place_id", length = 100)
    private String googlePlaceId;

    @Column(name = "google_rating")
    private BigDecimal googleRating;

    @Column(name = "google_reviews")
    private Integer googleReviews;

    @Column(name = "google_types", columnDefinition = "TEXT")
    private String googleTypes;

    // ── Origem / busca ───────────────────────────────────────
    @Column(name = "source", nullable = false, length = 50)
    private String source = "GOOGLE_MAPS";

    @Column(name = "search_term", length = 500)
    private String searchTerm;

    // ── Qualificação ─────────────────────────────────────────
    @Column(name = "status", nullable = false, length = 30)
    private String status = "FOUND";

    @Column(name = "qualification_score")
    private Integer qualificationScore;

    @Column(name = "qualification_notes", columnDefinition = "TEXT")
    private String qualificationNotes;

    // ── Referências ao CRM ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opportunity_id")
    private Opportunity opportunity;

    // ── Timestamps ────────────────────────────────────────────
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }

    public String getCnae() { return cnae; }
    public void setCnae(String cnae) { this.cnae = cnae; }

    public String getCnaeDescription() { return cnaeDescription; }
    public void setCnaeDescription(String cnaeDescription) { this.cnaeDescription = cnaeDescription; }

    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String neighborhood) { this.neighborhood = neighborhood; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getPartnerNames() { return partnerNames; }
    public void setPartnerNames(String partnerNames) { this.partnerNames = partnerNames; }

    public String getPurchasingContacts() { return purchasingContacts; }
    public void setPurchasingContacts(String purchasingContacts) { this.purchasingContacts = purchasingContacts; }

    public String getGooglePlaceId() { return googlePlaceId; }
    public void setGooglePlaceId(String googlePlaceId) { this.googlePlaceId = googlePlaceId; }

    public BigDecimal getGoogleRating() { return googleRating; }
    public void setGoogleRating(BigDecimal googleRating) { this.googleRating = googleRating; }

    public Integer getGoogleReviews() { return googleReviews; }
    public void setGoogleReviews(Integer googleReviews) { this.googleReviews = googleReviews; }

    public String getGoogleTypes() { return googleTypes; }
    public void setGoogleTypes(String googleTypes) { this.googleTypes = googleTypes; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSearchTerm() { return searchTerm; }
    public void setSearchTerm(String searchTerm) { this.searchTerm = searchTerm; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getQualificationScore() { return qualificationScore; }
    public void setQualificationScore(Integer qualificationScore) { this.qualificationScore = qualificationScore; }

    public String getQualificationNotes() { return qualificationNotes; }
    public void setQualificationNotes(String qualificationNotes) { this.qualificationNotes = qualificationNotes; }

    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }

    public Opportunity getOpportunity() { return opportunity; }
    public void setOpportunity(Opportunity opportunity) { this.opportunity = opportunity; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
