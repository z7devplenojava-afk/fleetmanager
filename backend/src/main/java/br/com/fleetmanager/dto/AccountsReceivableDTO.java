package br.com.fleetmanager.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.fleetmanager.model.AccountsReceivable;
import br.com.fleetmanager.model.enums.PaymentMethod;
import br.com.fleetmanager.model.enums.ReceivableCategory;
import br.com.fleetmanager.model.enums.ReceivableStatus;

@Data
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
    
    // Constructors
    public AccountsReceivableDTO() {}
    
    public AccountsReceivableDTO(AccountsReceivable entity) {
        this.id = entity.getId();
        this.clientId = entity.getClient().getId();
        this.client = ClientDTO.fromEntity(entity.getClient());
        this.invoiceNumber = entity.getInvoiceNumber();
        this.measurementNumber = entity.getMeasurementNumber();
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
