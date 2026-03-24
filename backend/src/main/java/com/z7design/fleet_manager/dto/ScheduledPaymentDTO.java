package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ScheduledPayment;
import com.z7design.fleet_manager.model.enums.PaymentMethod;
import com.z7design.fleet_manager.model.enums.ScheduledPaymentStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ScheduledPaymentDTO {
    
    private UUID id;
    
    @NotNull(message = "Cliente Ã© obrigatÃ³rio")
    private UUID clientId;
    
    private ClientDTO client;
    
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    private String description;
    
    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    private BigDecimal amount;
    
    @NotNull(message = "Data de agendamento Ã© obrigatÃ³ria")
    private LocalDate scheduledDate;
    
    private LocalDate executionDate;
    
    private ScheduledPaymentStatus status = ScheduledPaymentStatus.SCHEDULED;
    
    @NotNull(message = "Forma de pagamento Ã© obrigatÃ³ria")
    private PaymentMethod paymentMethod;
    
    @Size(max = 100, message = "NÃºmero da fatura deve ter no mÃ¡ximo 100 caracteres")
    private String invoiceNumber;
    
    private String notes;
    
    private Boolean alertSent = false;
    
    private LocalDateTime alertSentDate;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Business fields
    private Integer daysUntilDue;
    
    private Boolean isOverdue;
    
    // Static methods
    public static ScheduledPaymentDTO fromEntity(ScheduledPayment entity) {
        ScheduledPaymentDTO dto = new ScheduledPaymentDTO();
        dto.setId(entity.getId());
        dto.setClientId(entity.getClient().getId());
        dto.setClient(ClientDTO.fromEntity(entity.getClient()));
        dto.setDescription(entity.getDescription());
        dto.setAmount(entity.getAmount());
        dto.setScheduledDate(entity.getScheduledDate());
        dto.setExecutionDate(entity.getExecutionDate());
        dto.setStatus(entity.getStatus());
        dto.setPaymentMethod(entity.getPaymentMethod());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setNotes(entity.getNotes());
        dto.setAlertSent(entity.getAlertSent());
        dto.setAlertSentDate(entity.getAlertSentDate());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        
        // Business fields
        dto.setDaysUntilDue(entity.getDaysUntilDue());
        dto.setIsOverdue(entity.isOverdue());
        
        return dto;
    }
    
    public ScheduledPayment toEntity() {
        ScheduledPayment entity = new ScheduledPayment();
        entity.setId(this.id);
        entity.setDescription(this.description);
        entity.setAmount(this.amount);
        entity.setScheduledDate(this.scheduledDate);
        entity.setExecutionDate(this.executionDate);
        entity.setStatus(this.status != null ? this.status : ScheduledPaymentStatus.SCHEDULED);
        entity.setPaymentMethod(this.paymentMethod);
        entity.setInvoiceNumber(this.invoiceNumber);
        entity.setNotes(this.notes);
        entity.setAlertSent(this.alertSent != null ? this.alertSent : false);
        entity.setAlertSentDate(this.alertSentDate);
        
        return entity;
    }
}

