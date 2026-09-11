package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProspectingLeadDTO {

    private UUID id;

    // Identificação
    private String cnpj;
    private String companyName;
    private String tradeName;
    private String cnae;
    private String cnaeDescription;
    private String activity;

    // Endereço
    private String address;
    private String neighborhood;
    private String city;
    private String state;
    private String cep;

    // Contato
    private String phone;
    private String whatsapp;
    private String email;
    private String website;

    // Sócios / decisores
    private String partnerNames;
    private String purchasingContacts;

    // Google Maps
    private String googlePlaceId;
    private BigDecimal googleRating;
    private Integer googleReviews;
    private String googleTypes;

    // Origem / busca
    private String source;
    private String searchTerm;

    // Descrição livre para busca
    private String description;

    // Qualificação
    private String status;
    private Integer qualificationScore;
    private String qualificationNotes;

    // Referências CRM
    private UUID leadId;
    private UUID opportunityId;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getQualificationScore() { return qualificationScore; }
    public void setQualificationScore(Integer qualificationScore) { this.qualificationScore = qualificationScore; }

    public String getQualificationNotes() { return qualificationNotes; }
    public void setQualificationNotes(String qualificationNotes) { this.qualificationNotes = qualificationNotes; }

    public UUID getLeadId() { return leadId; }
    public void setLeadId(UUID leadId) { this.leadId = leadId; }

    public UUID getOpportunityId() { return opportunityId; }
    public void setOpportunityId(UUID opportunityId) { this.opportunityId = opportunityId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
