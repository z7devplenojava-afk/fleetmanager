package br.com.fleetmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import br.com.fleetmanager.model.enums.PaymentMethod;
import br.com.fleetmanager.model.enums.ScheduledPaymentStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "scheduled_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledPayment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Client client;
    
    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
    @Column(name = "description", nullable = false)
    private String description;
    
    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @NotNull(message = "Data de agendamento é obrigatória")
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;
    
    @Column(name = "execution_date")
    private LocalDate executionDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ScheduledPaymentStatus status = ScheduledPaymentStatus.SCHEDULED;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;
    
    @Size(max = 100, message = "Número da fatura deve ter no máximo 100 caracteres")
    @Column(name = "invoice_number")
    private String invoiceNumber;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "alert_sent")
    @Builder.Default
    private Boolean alertSent = false;
    
    @Column(name = "alert_sent_date")
    private LocalDateTime alertSentDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Business methods
    public boolean isDueInDays(int days) {
        LocalDate targetDate = LocalDate.now().plusDays(days);
        return scheduledDate.equals(targetDate) && status == ScheduledPaymentStatus.SCHEDULED;
    }
    
    public boolean isOverdue() {
        return LocalDate.now().isAfter(scheduledDate) && status == ScheduledPaymentStatus.SCHEDULED;
    }
    
    public int getDaysUntilDue() {
        return (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), scheduledDate);
    }
}
