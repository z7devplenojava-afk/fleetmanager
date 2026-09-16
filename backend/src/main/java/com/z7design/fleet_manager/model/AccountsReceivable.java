package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.PaymentMethod;
import com.z7design.fleet_manager.model.enums.ReceivableCategory;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "accounts_receivable")
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class AccountsReceivable implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = true)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measurement_id", nullable = true)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private MeasurementBulletin measurement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = true)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id", nullable = true)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private WorkPost workPost;

    @Size(max = 100, message = "Centro de custo deve ter no mÃ¡ximo 100 caracteres")
    @Column(name = "centro_custo", length = 100)
    private String centroCusto;

    @NotBlank(message = "NÃºmero da fatura Ã© obrigatÃ³rio")
    @Size(max = 100, message = "NÃºmero da fatura deve ter no mÃ¡ximo 100 caracteres")
    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Size(max = 100, message = "NÃºmero da mediÃ§Ã£o deve ter no mÃ¡ximo 100 caracteres")
    @Column(name = "measurement_number")
    private String measurementNumber;

    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    @Column(name = "description", nullable = false)
    private String description;

    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "amount_paid", precision = 15, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @NotNull(message = "Data de emissÃ£o Ã© obrigatÃ³ria")
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @NotNull(message = "Data de vencimento Ã© obrigatÃ³ria")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReceivableStatus status = ReceivableStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ReceivableCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "overdue_days")
    private Integer overdueDays = 0;

    @Column(name = "late_fee", precision = 15, scale = 2)
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(name = "late_penalty", precision = 15, scale = 2)
    private BigDecimal latePenalty = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ── Boleto Bancário registrado (M7 / RF-07.4) ──────────────
    @Column(name = "boleto_url", length = 500)
    private String boletoUrl;

    @Column(name = "boleto_bar_code", length = 100)
    private String boletoBarCode;

    @Column(name = "boleto_digitable_line", length = 60)
    private String boletoDigitableLine;

    @Column(name = "boleto_generation_date")
    private LocalDateTime boletoGenerationDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "company_id")
    private UUID companyId;

    // Constructors
    public AccountsReceivable() {
    }

    public AccountsReceivable(Client client, String invoiceNumber, String description,
            BigDecimal amount, LocalDate issueDate, LocalDate dueDate,
            ReceivableCategory category, PaymentMethod paymentMethod) {
        this.client = client;
        this.invoiceNumber = invoiceNumber;
        this.description = description;
        this.amount = amount;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.category = category;
        this.paymentMethod = paymentMethod;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public Unit getUnit() {
        return unit;
    }

    public void setUnit(Unit unit) {
        this.unit = unit;
    }

    public Contract getContract() {
        return contract;
    }

    public void setContract(Contract contract) {
        this.contract = contract;
    }

    public WorkPost getWorkPost() {
        return workPost;
    }

    public void setWorkPost(WorkPost workPost) {
        this.workPost = workPost;
    }

    public String getCentroCusto() {
        return centroCusto;
    }

    public void setCentroCusto(String centroCusto) {
        this.centroCusto = centroCusto;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getMeasurementNumber() {
        return measurementNumber;
    }

    public void setMeasurementNumber(String measurementNumber) {
        this.measurementNumber = measurementNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public ReceivableStatus getStatus() {
        return status;
    }

    public void setStatus(ReceivableStatus status) {
        this.status = status;
    }

    public ReceivableCategory getCategory() {
        return category;
    }

    public void setCategory(ReceivableCategory category) {
        this.category = category;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Integer getOverdueDays() {
        return overdueDays;
    }

    public void setOverdueDays(Integer overdueDays) {
        this.overdueDays = overdueDays;
    }

    public BigDecimal getLateFee() {
        return lateFee;
    }

    public void setLateFee(BigDecimal lateFee) {
        this.lateFee = lateFee;
    }

    public BigDecimal getLatePenalty() {
        return latePenalty;
    }

    public void setLatePenalty(BigDecimal latePenalty) {
        this.latePenalty = latePenalty;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public MeasurementBulletin getMeasurement() {
        return measurement;
    }

    public void setMeasurement(MeasurementBulletin measurement) {
        this.measurement = measurement;
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

    // Business methods
    public BigDecimal getPendingAmount() {
        return amount.subtract(amountPaid);
    }

    public boolean isOverdue() {
        return LocalDate.now().isAfter(dueDate) && status != ReceivableStatus.PAID;
    }

    public void calculateOverdueDays() {
        if (isOverdue()) {
            this.overdueDays = (int) java.time.temporal.ChronoUnit.DAYS.between(dueDate, LocalDate.now());
        } else {
            this.overdueDays = 0;
        }
    }

    // ── Getters/Setters Boleto (M7 / RF-07.4) ─────────────────
    public String getBoletoUrl() {
        return boletoUrl;
    }

    public void setBoletoUrl(String boletoUrl) {
        this.boletoUrl = boletoUrl;
    }

    public String getBoletoBarCode() {
        return boletoBarCode;
    }

    public void setBoletoBarCode(String boletoBarCode) {
        this.boletoBarCode = boletoBarCode;
    }

    public String getBoletoDigitableLine() {
        return boletoDigitableLine;
    }

    public void setBoletoDigitableLine(String boletoDigitableLine) {
        this.boletoDigitableLine = boletoDigitableLine;
    }

    public LocalDateTime getBoletoGenerationDate() {
        return boletoGenerationDate;
    }

    public void setBoletoGenerationDate(LocalDateTime boletoGenerationDate) {
        this.boletoGenerationDate = boletoGenerationDate;
    }

    @Override
    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }
}
