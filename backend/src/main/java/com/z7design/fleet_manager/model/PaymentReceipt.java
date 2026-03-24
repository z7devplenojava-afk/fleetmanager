package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "payment_receipts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class PaymentReceipt implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id")
    private UUID employeeId;

    @Column(name = "employee_name", length = 255)
    private String employeeName;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "company_cnpj", length = 20)
    private String companyCnpj;

    @Column(name = "company_sigla", length = 10)
    private String companySigla;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "gross_salary", precision = 10, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "net_salary", precision = 10, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PaymentReceiptStatus status;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    // Campos bancÃ¡rios (da migration V308)
    @Column(name = "debited_agency", length = 20)
    private String debitedAgency;

    @Column(name = "debited_account", length = 50)
    private String debitedAccount;

    @Column(name = "debited_name", length = 255)
    private String debitedName;

    @Column(name = "credited_agency", length = 20)
    private String creditedAgency;

    @Column(name = "credited_account", length = 50)
    private String creditedAccount;

    @Column(name = "credited_name", length = 255)
    private String creditedName;

    @Column(name = "control_number", length = 50)
    private String controlNumber;

    @Column(name = "authentication_code", length = 100)
    private String authenticationCode;

    @Column(name = "transfer_date", length = 50)
    private String transferDate;

    @Column(name = "transfer_time", length = 20)
    private String transferTime;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "transaction_type", length = 100)
    private String transactionType;

    @Column(name = "statement_identification", length = 255)
    private String statementIdentification;

    // Construtor personalizado para inicializaÃ§Ã£o
    public PaymentReceipt(UUID employeeId, String employeeName, Integer month, Integer year,
            String fileName, String filePath, PaymentReceiptStatus status) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.month = month;
        this.year = year;
        this.fileName = fileName;
        this.filePath = filePath;
        this.status = status;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters e Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyCnpj() {
        return companyCnpj;
    }

    public void setCompanyCnpj(String companyCnpj) {
        this.companyCnpj = companyCnpj;
    }

    public String getCompanySigla() {
        return companySigla;
    }

    public void setCompanySigla(String companySigla) {
        this.companySigla = companySigla;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public BigDecimal getGrossSalary() {
        return grossSalary;
    }

    public void setGrossSalary(BigDecimal grossSalary) {
        this.grossSalary = grossSalary;
    }

    public BigDecimal getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public PaymentReceiptStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentReceiptStatus status) {
        this.status = status;
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

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    // Getters e Setters para campos bancÃ¡rios
    public String getDebitedAgency() {
        return debitedAgency;
    }

    public void setDebitedAgency(String debitedAgency) {
        this.debitedAgency = debitedAgency;
    }

    public String getDebitedAccount() {
        return debitedAccount;
    }

    public void setDebitedAccount(String debitedAccount) {
        this.debitedAccount = debitedAccount;
    }

    public String getDebitedName() {
        return debitedName;
    }

    public void setDebitedName(String debitedName) {
        this.debitedName = debitedName;
    }

    public String getCreditedAgency() {
        return creditedAgency;
    }

    public void setCreditedAgency(String creditedAgency) {
        this.creditedAgency = creditedAgency;
    }

    public String getCreditedAccount() {
        return creditedAccount;
    }

    public void setCreditedAccount(String creditedAccount) {
        this.creditedAccount = creditedAccount;
    }

    public String getCreditedName() {
        return creditedName;
    }

    public void setCreditedName(String creditedName) {
        this.creditedName = creditedName;
    }

    public String getControlNumber() {
        return controlNumber;
    }

    public void setControlNumber(String controlNumber) {
        this.controlNumber = controlNumber;
    }

    public String getAuthenticationCode() {
        return authenticationCode;
    }

    public void setAuthenticationCode(String authenticationCode) {
        this.authenticationCode = authenticationCode;
    }

    public String getTransferDate() {
        return transferDate;
    }

    public void setTransferDate(String transferDate) {
        this.transferDate = transferDate;
    }

    public String getTransferTime() {
        return transferTime;
    }

    public void setTransferTime(String transferTime) {
        this.transferTime = transferTime;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getStatementIdentification() {
        return statementIdentification;
    }

    public void setStatementIdentification(String statementIdentification) {
        this.statementIdentification = statementIdentification;
    }

    /*
     * @JsonProperty("companyId")
     * public UUID getCompanyId() {
     * return company != null ? company.getId() : null;
     * }
     */

    // MÃ©todos de callback
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        // A data de processamento serÃ¡ definida manualmente quando o comprovante for
        // processado
        if (this.processedAt == null) {
            this.processedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "PaymentReceipt{" +
                "id=" + id +
                ", employeeId=" + employeeId +
                ", employeeName='" + employeeName + '\'' +
                ", companyName='" + companyName + '\'' +
                ", companySigla='" + companySigla + '\'' +
                ", companyCnpj='" + companyCnpj + '\'' +
                ", month=" + month +
                ", year=" + year +
                ", receiptNumber='" + receiptNumber + '\'' +
                ", paymentDate=" + paymentDate +
                ", grossSalary=" + grossSalary +
                ", netSalary=" + netSalary +
                ", filePath='" + filePath + '\'' +
                ", fileName='" + fileName + '\'' +
                ", fileSize=" + fileSize +
                ", status=" + status +
                ", notes='" + notes + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", createdBy=" + createdBy +
                ", updatedBy=" + updatedBy +
                '}';
    }
}
