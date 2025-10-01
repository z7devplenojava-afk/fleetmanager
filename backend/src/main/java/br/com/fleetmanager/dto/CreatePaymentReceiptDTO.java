package br.com.fleetmanager.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class CreatePaymentReceiptDTO {
    
    private UUID employeeId;
    
    @Size(max = 255, message = "Nome do funcionário deve ter no máximo 255 caracteres")
    private String employeeName;
    
    @NotNull(message = "Mês é obrigatório")
    @Min(value = 1, message = "Mês deve ser entre 1 e 12")
    @Max(value = 12, message = "Mês deve ser entre 1 e 12")
    private Integer month;
    
    @NotNull(message = "Ano é obrigatório")
    @Min(value = 2020, message = "Ano deve ser maior que 2020")
    @Max(value = 2030, message = "Ano deve ser menor que 2030")
    private Integer year;
    
    @Size(max = 50, message = "Número do recibo deve ter no máximo 50 caracteres")
    private String receiptNumber;
    
    private LocalDateTime paymentDate;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Salário bruto deve ser maior ou igual a zero")
    @Digits(integer = 8, fraction = 2, message = "Salário bruto deve ter no máximo 8 dígitos inteiros e 2 decimais")
    private BigDecimal grossSalary;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Salário líquido deve ser maior ou igual a zero")
    @Digits(integer = 8, fraction = 2, message = "Salário líquido deve ter no máximo 8 dígitos inteiros e 2 decimais")
    private BigDecimal netSalary;
    
    @Size(max = 500, message = "Caminho do arquivo deve ter no máximo 500 caracteres")
    private String filePath;
    
    @Size(max = 255, message = "Nome do arquivo deve ter no máximo 255 caracteres")
    private String fileName;
    
    private Long fileSize;
    
    @Size(max = 1000, message = "Notas devem ter no máximo 1000 caracteres")
    private String notes;
    
    private UUID createdBy;
    
    // Campos bancários
    @Size(max = 20, message = "Agência debitada deve ter no máximo 20 caracteres")
    private String debitedAgency;
    
    @Size(max = 50, message = "Conta debitada deve ter no máximo 50 caracteres")
    private String debitedAccount;
    
    @Size(max = 255, message = "Nome debitado deve ter no máximo 255 caracteres")
    private String debitedName;
    
    @Size(max = 20, message = "Agência creditada deve ter no máximo 20 caracteres")
    private String creditedAgency;
    
    @Size(max = 50, message = "Conta creditada deve ter no máximo 50 caracteres")
    private String creditedAccount;
    
    @Size(max = 255, message = "Nome creditado deve ter no máximo 255 caracteres")
    private String creditedName;
    
    @Size(max = 50, message = "Número de controle deve ter no máximo 50 caracteres")
    private String controlNumber;
    
    @Size(max = 100, message = "Código de autenticação deve ter no máximo 100 caracteres")
    private String authenticationCode;
    
    @Size(max = 50, message = "Data de transferência deve ter no máximo 50 caracteres")
    private String transferDate;
    
    @Size(max = 20, message = "Hora de transferência deve ter no máximo 20 caracteres")
    private String transferTime;
    
    @Size(max = 100, message = "Nome do banco deve ter no máximo 100 caracteres")
    private String bankName;
    
    @Size(max = 100, message = "Tipo de transação deve ter no máximo 100 caracteres")
    private String transactionType;
    
    @Size(max = 255, message = "Identificação do extrato deve ter no máximo 255 caracteres")
    private String statementIdentification;
    
    // Construtores
    public CreatePaymentReceiptDTO() {}
    
    public CreatePaymentReceiptDTO(UUID employeeId, String employeeName, Integer month, Integer year,
                                  String fileName, String filePath) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.month = month;
        this.year = year;
        this.fileName = fileName;
        this.filePath = filePath;
    }
    
    // Getters e Setters
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
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public UUID getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
    
    // Getters e Setters para campos bancários
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
    
    @Override
    public String toString() {
        return "CreatePaymentReceiptDTO{" +
                "employeeId=" + employeeId +
                ", employeeName='" + employeeName + '\'' +
                ", month=" + month +
                ", year=" + year +
                ", receiptNumber='" + receiptNumber + '\'' +
                ", paymentDate=" + paymentDate +
                ", grossSalary=" + grossSalary +
                ", netSalary=" + netSalary +
                ", filePath='" + filePath + '\'' +
                ", fileName='" + fileName + '\'' +
                ", fileSize=" + fileSize +
                ", notes='" + notes + '\'' +
                ", createdBy=" + createdBy +
                '}';
    }
}
