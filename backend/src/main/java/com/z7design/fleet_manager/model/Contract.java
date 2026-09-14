package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.ContractType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
public class Contract {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    @NotBlank(message = "NÃºmero do contrato Ã© obrigatÃ³rio")
    @Size(max = 50, message = "NÃºmero do contrato deve ter no mÃ¡ximo 50 caracteres")
    @Column(name = "contract_number", nullable = false, unique = true)
    private String contractNumber;
    
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    @Column(name = "description", nullable = false)
    private String description;
    
    @NotNull(message = "Data de inÃ­cio Ã© obrigatÃ³ria")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    @Column(name = "value", nullable = false, precision = 15, scale = 2)
    private BigDecimal value;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContractStatus status = ContractStatus.ACTIVE;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type")
    private ContractType contractType;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "obra_name")
    private String obraName;

    @Column(name = "vehicle_quantity")
    private Integer vehicleQuantity;

    @Column(name = "unit_vehicle_value", precision = 15, scale = 2)
    private BigDecimal unitVehicleValue;

    @Column(name = "service_type")
    private String serviceType;

    @Column(name = "vehicle_description")
    private String vehicleDescription;

    @Column(name = "vigencia_text", columnDefinition = "TEXT")
    private String vigenciaText;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
    
    // Constructors
    public Contract() {}
    
    public Contract(String contractNumber, String description, LocalDate startDate, BigDecimal value, Client client) {
        this.contractNumber = contractNumber;
        this.description = description;
        this.startDate = startDate;
        this.value = value;
        this.client = client;
    }
    
    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }
    
    public void setId(java.util.UUID id) {
        this.id = id;
    }
    
    public String getContractNumber() {
        return contractNumber;
    }
    
    public void setContractNumber(String contractNumber) {
        this.contractNumber = contractNumber;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public BigDecimal getValue() {
        return value;
    }
    
    public void setValue(BigDecimal value) {
        this.value = value;
    }
    
    public ContractStatus getStatus() {
        return status;
    }
    
    public void setStatus(ContractStatus status) {
        this.status = status;
    }
    
    public ContractType getContractType() {
        return contractType;
    }
    
    public void setContractType(ContractType contractType) {
        this.contractType = contractType;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Client getClient() {
        return client;
    }
    
    public void setClient(Client client) {
        this.client = client;
    }

    public String getObraName() {
        return obraName;
    }

    public void setObraName(String obraName) {
        this.obraName = obraName;
    }

    public Integer getVehicleQuantity() {
        return vehicleQuantity;
    }

    public void setVehicleQuantity(Integer vehicleQuantity) {
        this.vehicleQuantity = vehicleQuantity;
    }

    public BigDecimal getUnitVehicleValue() {
        return unitVehicleValue;
    }

    public void setUnitVehicleValue(BigDecimal unitVehicleValue) {
        this.unitVehicleValue = unitVehicleValue;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public String getVehicleDescription() {
        return vehicleDescription;
    }

    public void setVehicleDescription(String vehicleDescription) {
        this.vehicleDescription = vehicleDescription;
    }

    public String getVigenciaText() {
        return vigenciaText;
    }

    public void setVigenciaText(String vigenciaText) {
        this.vigenciaText = vigenciaText;
    }
} 
