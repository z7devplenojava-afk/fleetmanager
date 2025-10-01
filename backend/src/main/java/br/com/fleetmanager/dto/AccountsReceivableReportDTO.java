package br.com.fleetmanager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import br.com.fleetmanager.model.AccountsReceivable;
import br.com.fleetmanager.model.enums.PaymentMethod;
import br.com.fleetmanager.model.enums.ReceivableCategory;
import br.com.fleetmanager.model.enums.ReceivableStatus;

@Data
public class AccountsReceivableReportDTO {
    
    private String id;
    private String clientName;
    private String clientDocument;
    private String invoiceNumber;
    private String measurementNumber;
    private String description;
    private BigDecimal amount;
    private BigDecimal amountPaid;
    private BigDecimal pendingAmount;
    private String issueDate;
    private String dueDate;
    private String paymentDate;
    private String status;
    private String category;
    private String paymentMethod;
    private Integer overdueDays;
    private BigDecimal lateFee;
    private BigDecimal latePenalty;
    private String notes;
    private String createdAt;
    private String updatedAt;
    
    // Campos calculados para relatório
    private String statusDescription;
    private String categoryDescription;
    private String paymentMethodDescription;
    private String isOverdue;
    private String daysUntilDue;
    
    public static AccountsReceivableReportDTO fromEntity(AccountsReceivable entity) {
        AccountsReceivableReportDTO dto = new AccountsReceivableReportDTO();
        
        dto.setId(entity.getId().toString());
        dto.setClientName(entity.getClient().getName());
        dto.setClientDocument(entity.getClient().getCnpj());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setMeasurementNumber(entity.getMeasurementNumber());
        dto.setDescription(entity.getDescription());
        dto.setAmount(entity.getAmount());
        dto.setAmountPaid(entity.getAmountPaid());
        dto.setPendingAmount(entity.getPendingAmount());
        
        // Formatar datas
        dto.setIssueDate(entity.getIssueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        dto.setDueDate(entity.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        dto.setPaymentDate(entity.getPaymentDate() != null ? 
                entity.getPaymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
        
        dto.setStatus(entity.getStatus().toString());
        dto.setCategory(entity.getCategory().toString());
        dto.setPaymentMethod(entity.getPaymentMethod().toString());
        dto.setOverdueDays(entity.getOverdueDays());
        dto.setLateFee(entity.getLateFee());
        dto.setLatePenalty(entity.getLatePenalty());
        dto.setNotes(entity.getNotes());
        
        dto.setCreatedAt(entity.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        dto.setUpdatedAt(entity.getUpdatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        
        // Campos calculados
        dto.setStatusDescription(entity.getStatus().getDescription());
        dto.setCategoryDescription(entity.getCategory().getDescription());
        dto.setPaymentMethodDescription(entity.getPaymentMethod().getDescription());
        dto.setIsOverdue(entity.isOverdue() ? "Sim" : "Não");
        
        // Calcular dias até vencimento
        long daysUntilDue = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), entity.getDueDate());
        dto.setDaysUntilDue(daysUntilDue > 0 ? String.valueOf(daysUntilDue) : 
                (daysUntilDue < 0 ? "Vencido (" + Math.abs(daysUntilDue) + " dias)" : "Vence hoje"));
        
        return dto;
    }
}
