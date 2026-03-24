package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ScheduledPayment;
import com.z7design.fleet_manager.model.enums.PaymentMethod;
import com.z7design.fleet_manager.model.enums.ScheduledPaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Data
public class ScheduledPaymentReportDTO {
    
    private String id;
    private String clientName;
    private String clientDocument;
    private String description;
    private BigDecimal amount;
    private String scheduledDate;
    private String executionDate;
    private String status;
    private String paymentMethod;
    private String invoiceNumber;
    private String notes;
    private String alertSent;
    private String alertSentDate;
    private String createdAt;
    private String updatedAt;
    
    // Campos calculados para relatÃ³rio
    private String statusDescription;
    private String paymentMethodDescription;
    private String isOverdue;
    private String daysUntilDue;
    private String alertStatus;
    
    public static ScheduledPaymentReportDTO fromEntity(ScheduledPayment entity) {
        ScheduledPaymentReportDTO dto = new ScheduledPaymentReportDTO();
        
        dto.setId(entity.getId().toString());
        dto.setClientName(entity.getClient().getName());
        dto.setClientDocument(entity.getClient().getCnpj());
        dto.setDescription(entity.getDescription());
        dto.setAmount(entity.getAmount());
        
        // Formatar datas
        dto.setScheduledDate(entity.getScheduledDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        dto.setExecutionDate(entity.getExecutionDate() != null ? 
                entity.getExecutionDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
        
        dto.setStatus(entity.getStatus().toString());
        dto.setPaymentMethod(entity.getPaymentMethod().toString());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setNotes(entity.getNotes());
        dto.setAlertSent(entity.getAlertSent() ? "Sim" : "NÃ£o");
        
        dto.setAlertSentDate(entity.getAlertSentDate() != null ? 
                entity.getAlertSentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "");
        
        dto.setCreatedAt(entity.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        dto.setUpdatedAt(entity.getUpdatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        
        // Campos calculados
        dto.setStatusDescription(entity.getStatus().getDescription());
        dto.setPaymentMethodDescription(entity.getPaymentMethod().getDescription());
        dto.setIsOverdue(entity.isOverdue() ? "Sim" : "NÃ£o");
        
        // Calcular dias atÃ© vencimento
        long daysUntilDue = entity.getDaysUntilDue();
        dto.setDaysUntilDue(daysUntilDue > 0 ? String.valueOf(daysUntilDue) : 
                (daysUntilDue < 0 ? "Vencido (" + Math.abs(daysUntilDue) + " dias)" : "Vence hoje"));
        
        // Status do alerta
        if (entity.getAlertSent()) {
            dto.setAlertStatus("Alerta enviado");
        } else if (entity.isDueInDays(3)) {
            dto.setAlertStatus("Alerta pendente (3 dias)");
        } else {
            dto.setAlertStatus("Sem alerta");
        }
        
        return dto;
    }
}

