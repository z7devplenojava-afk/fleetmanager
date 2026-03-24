package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class CreatePaymentReceiptDTO {
    
    private UUID employeeId;

    private UUID companyId;
    
    @Size(max = 255, message = "Nome do funcionÃ¡rio deve ter no mÃ¡ximo 255 caracteres")
    private String employeeName;

    @Size(max = 255, message = "Nome da empresa deve ter no mÃ¡ximo 255 caracteres")
    private String companyName;

    @Size(max = 20, message = "CNPJ da empresa deve ter no mÃ¡ximo 20 caracteres")
    private String companyCnpj;

    @Size(max = 10, message = "Sigla da empresa deve ter no mÃ¡ximo 10 caracteres")
    private String companySigla;
    
    @NotNull(message = "MÃªs Ã© obrigatÃ³rio")
    @Min(value = 1, message = "MÃªs deve ser entre 1 e 12")
    @Max(value = 12, message = "MÃªs deve ser entre 1 e 12")
    private Integer month;
    
    @NotNull(message = "Ano Ã© obrigatÃ³rio")
    @Min(value = 2020, message = "Ano deve ser maior que 2020")
    @Max(value = 2030, message = "Ano deve ser menor que 2030")
    private Integer year;
    
    @Size(max = 50, message = "NÃºmero do recibo deve ter no mÃ¡ximo 50 caracteres")
    private String receiptNumber;
    
    private LocalDateTime paymentDate;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "SalÃ¡rio bruto deve ser maior ou igual a zero")
    @Digits(integer = 8, fraction = 2, message = "SalÃ¡rio bruto deve ter no mÃ¡ximo 8 dÃ­gitos inteiros e 2 decimais")
    private BigDecimal grossSalary;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "SalÃ¡rio lÃ­quido deve ser maior ou igual a zero")
    @Digits(integer = 8, fraction = 2, message = "SalÃ¡rio lÃ­quido deve ter no mÃ¡ximo 8 dÃ­gitos inteiros e 2 decimais")
    private BigDecimal netSalary;
    
    @Size(max = 500, message = "Caminho do arquivo deve ter no mÃ¡ximo 500 caracteres")
    private String filePath;
    
    @Size(max = 255, message = "Nome do arquivo deve ter no mÃ¡ximo 255 caracteres")
    private String fileName;
    
    private Long fileSize;
    
    @Size(max = 1000, message = "Notas devem ter no mÃ¡ximo 1000 caracteres")
    private String notes;
    
    private UUID createdBy;
    
    // Campos bancÃ¡rios
    @Size(max = 20, message = "AgÃªncia debitada deve ter no mÃ¡ximo 20 caracteres")
    private String debitedAgency;
    
    @Size(max = 50, message = "Conta debitada deve ter no mÃ¡ximo 50 caracteres")
    private String debitedAccount;
    
    @Size(max = 255, message = "Nome debitado deve ter no mÃ¡ximo 255 caracteres")
    private String debitedName;
    
    @Size(max = 20, message = "AgÃªncia creditada deve ter no mÃ¡ximo 20 caracteres")
    private String creditedAgency;
    
    @Size(max = 50, message = "Conta creditada deve ter no mÃ¡ximo 50 caracteres")
    private String creditedAccount;
    
    @Size(max = 255, message = "Nome creditado deve ter no mÃ¡ximo 255 caracteres")
    private String creditedName;
    
    @Size(max = 50, message = "NÃºmero de controle deve ter no mÃ¡ximo 50 caracteres")
    private String controlNumber;
    
    @Size(max = 100, message = "CÃ³digo de autenticaÃ§Ã£o deve ter no mÃ¡ximo 100 caracteres")
    private String authenticationCode;
    
    @Size(max = 50, message = "Data de transferÃªncia deve ter no mÃ¡ximo 50 caracteres")
    private String transferDate;
    
    @Size(max = 20, message = "Hora de transferÃªncia deve ter no mÃ¡ximo 20 caracteres")
    private String transferTime;
    
    @Size(max = 100, message = "Nome do banco deve ter no mÃ¡ximo 100 caracteres")
    private String bankName;
    
    @Size(max = 100, message = "Tipo de transaÃ§Ã£o deve ter no mÃ¡ximo 100 caracteres")
    private String transactionType;
    
    @Size(max = 255, message = "IdentificaÃ§Ã£o do extrato deve ter no mÃ¡ximo 255 caracteres")
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

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
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
    
    @Override
    public String toString() {
        return "CreatePaymentReceiptDTO{" +
                "employeeId=" + employeeId +
                ", companyId=" + companyId +
                ", employeeName='" + employeeName + '\'' +
                ", companyName='" + companyName + '\'' +
                ", companyCnpj='" + companyCnpj + '\'' +
                ", companySigla='" + companySigla + '\'' +
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

