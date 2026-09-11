package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.enums.PaymentMethod;
import com.z7design.fleet_manager.model.enums.ReceivableCategory;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class AccountsReceivableDTO {
    
    private UUID id;
    
    @NotNull(message = "Cliente Ã© obrigatÃ³rio")
    private UUID clientId;
    
    private ClientDTO client;
    
    @NotBlank(message = "NÃºmero da fatura Ã© obrigatÃ³rio")
    @Size(max = 100, message = "NÃºmero da fatura deve ter no mÃ¡ximo 100 caracteres")
    private String invoiceNumber;
    
    @Size(max = 100, message = "NÃºmero da mediÃ§Ã£o deve ter no mÃ¡ximo 100 caracteres")
    private String measurementNumber;

    // Suporte a vinculaÃ§Ã£o por ID da mediÃ§Ã£o (opcional)
    private UUID measurementId;
    
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    private String description;
    
    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    private BigDecimal amount;
    
    private BigDecimal amountPaid = BigDecimal.ZERO;
    
    private BigDecimal pendingAmount;
    
    @NotNull(message = "Data de emissÃ£o Ã© obrigatÃ³ria")
    private LocalDate issueDate;
    
    @NotNull(message = "Data de vencimento Ã© obrigatÃ³ria")
    private LocalDate dueDate;
    
    private LocalDate paymentDate;
    
    private ReceivableStatus status = ReceivableStatus.PENDING;
    
    @NotNull(message = "Categoria Ã© obrigatÃ³ria")
    private ReceivableCategory category;
    
    @NotNull(message = "Forma de pagamento Ã© obrigatÃ³ria")
    private PaymentMethod paymentMethod;
    
    private Integer overdueDays = 0;
    
    private BigDecimal lateFee = BigDecimal.ZERO;
    
    private BigDecimal latePenalty = BigDecimal.ZERO;
    
    private String notes;
    
    private UUID unitId;
    
    private String centroCusto;
    
    // Constructors
    public AccountsReceivableDTO() {}
    
    public AccountsReceivableDTO(AccountsReceivable entity) {
        this.id = entity.getId();
        this.clientId = entity.getClient().getId();
        this.client = ClientDTO.fromEntity(entity.getClient());
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
    }
    
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

