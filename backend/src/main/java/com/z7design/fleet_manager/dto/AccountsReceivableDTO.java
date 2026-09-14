package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.enums.PaymentMethod;
import com.z7design.fleet_manager.model.enums.ReceivableCategory;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class AccountsReceivableDTO {
    
    private UUID id;
    
    @NotNull(message = "Cliente é obrigatório")
    private UUID clientId;
    
    private ClientDTO client;
    
    @NotBlank(message = "Número da fatura é obrigatório")
    @Size(max = 100, message = "Número da fatura deve ter no máximo 100 caracteres")
    private String invoiceNumber;
    
    @Size(max = 100, message = "Número da medição deve ter no máximo 100 caracteres")
    private String measurementNumber;

    // Suporte a vinculação por ID da medição (opcional)
    private UUID measurementId;
    
    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
    private String description;
    
    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    private BigDecimal amount;
    
    private BigDecimal amountPaid = BigDecimal.ZERO;
    
    private BigDecimal pendingAmount;
    
    @NotNull(message = "Data de emissão é obrigatória")
    private LocalDate issueDate;
    
    @NotNull(message = "Data de vencimento é obrigatória")
    private LocalDate dueDate;
    
    private LocalDate paymentDate;
    
    private ReceivableStatus status = ReceivableStatus.PENDING;
    
    @NotNull(message = "Categoria é obrigatória")
    private ReceivableCategory category;
    
    @NotNull(message = "Forma de pagamento é obrigatória")
    private PaymentMethod paymentMethod;
    
    private Integer overdueDays = 0;
    
    private BigDecimal lateFee = BigDecimal.ZERO;
    
    private BigDecimal latePenalty = BigDecimal.ZERO;
    
    private String notes;
    
    private UUID unitId;
    
    private String centroCusto;

    private UUID contractId;
    private String contractNumber;
    private UUID workPostId;
    private String workPostName;
    
    // Constructors
    public AccountsReceivableDTO() {}
    
    public AccountsReceivableDTO(AccountsReceivable entity) {
        this.id = entity.getId();
        this.clientId = entity.getClient() != null ? entity.getClient().getId() : null;
        this.client = entity.getClient() != null ? ClientDTO.fromEntity(entity.getClient()) : null;
        this.invoiceNumber = entity.getInvoiceNumber();
        this.measurementNumber = entity.getMeasurementNumber();
        this.measurementId = entity.getMeasurement() != null ? entity.getMeasurement().getId() : null;
        this.description = entity.getDescription();
        this.amount = entity.getAmount();
        this.amountPaid = entity.getAmountPaid();
        this.pendingAmount = entity.getPendingAmount();
        this.issueDate = entity.getIssueDate();
        this.dueDate = entity.getDueDate();
        this.paymentDate = entity.getPaymentDate();
        this.status = entity.getStatus();
        this.category = entity.getCategory();
        this.paymentMethod = entity.getPaymentMethod();
        this.overdueDays = entity.getOverdueDays();
        this.lateFee = entity.getLateFee();
        this.latePenalty = entity.getLatePenalty();
        this.notes = entity.getNotes();
        this.unitId = entity.getUnit() != null ? entity.getUnit().getId() : null;
        this.centroCusto = entity.getCentroCusto();

        if (entity.getContract() != null) {
            this.contractId = entity.getContract().getId();
            this.contractNumber = entity.getContract().getContractNumber();
        }
        if (entity.getWorkPost() != null) {
            this.workPostId = entity.getWorkPost().getId();
            this.workPostName = entity.getWorkPost().getName();
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }

    public ClientDTO getClient() { return client; }
    public void setClient(ClientDTO client) { this.client = client; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getMeasurementNumber() { return measurementNumber; }
    public void setMeasurementNumber(String measurementNumber) { this.measurementNumber = measurementNumber; }

    public UUID getMeasurementId() { return measurementId; }
    public void setMeasurementId(UUID measurementId) { this.measurementId = measurementId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    public BigDecimal getPendingAmount() { return pendingAmount; }
    public void setPendingAmount(BigDecimal pendingAmount) { this.pendingAmount = pendingAmount; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

    public ReceivableStatus getStatus() { return status; }
    public void setStatus(ReceivableStatus status) { this.status = status; }

    public ReceivableCategory getCategory() { return category; }
    public void setCategory(ReceivableCategory category) { this.category = category; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public Integer getOverdueDays() { return overdueDays; }
    public void setOverdueDays(Integer overdueDays) { this.overdueDays = overdueDays; }

    public BigDecimal getLateFee() { return lateFee; }
    public void setLateFee(BigDecimal lateFee) { this.lateFee = lateFee; }

    public BigDecimal getLatePenalty() { return latePenalty; }
    public void setLatePenalty(BigDecimal latePenalty) { this.latePenalty = latePenalty; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getUnitId() { return unitId; }
    public void setUnitId(UUID unitId) { this.unitId = unitId; }

    public String getCentroCusto() { return centroCusto; }
    public void setCentroCusto(String centroCusto) { this.centroCusto = centroCusto; }

    public UUID getContractId() { return contractId; }
    public void setContractId(UUID contractId) { this.contractId = contractId; }

    public String getContractNumber() { return contractNumber; }
    public void setContractNumber(String contractNumber) { this.contractNumber = contractNumber; }

    public UUID getWorkPostId() { return workPostId; }
    public void setWorkPostId(UUID workPostId) { this.workPostId = workPostId; }

    public String getWorkPostName() { return workPostName; }
    public void setWorkPostName(String workPostName) { this.workPostName = workPostName; }
    
    // Static factory method
    public static AccountsReceivableDTO fromEntity(AccountsReceivable entity) {
        return new AccountsReceivableDTO(entity);
    }
    
    // Helper methods
    public boolean isOverdue() {
        return LocalDate.now().isAfter(dueDate) && status != ReceivableStatus.PAID;
    }
    
    public boolean isPaid() {
        return status == ReceivableStatus.PAID;
    }
    
    public boolean isPending() {
        return status == ReceivableStatus.PENDING;
    }
}
