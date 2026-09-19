package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para transferÃªncia de dados de fatura/despesa")
public class InvoiceDTO {
    private java.util.UUID id;
    
    @Schema(description = "NÃºmero da fatura", example = "FAT-2024-001")
    @Size(max = 50, message = "NÃºmero da fatura deve ter no mÃ¡ximo 50 caracteres")
    private String invoiceNumber;
    
    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Schema(description = "DescriÃ§Ã£o da fatura/despesa", example = "Pagamento de serviÃ§os de seguranÃ§a")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    private String description;
    
    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
    @Schema(description = "Valor da fatura", example = "1500.00")
    private BigDecimal amount;
    
    @Schema(description = "Tipo da despesa", example = "VARIAVEL")
    private ExpenseType type;
    
    @Schema(description = "Status da fatura", example = "PENDENTE")
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private ExpenseStatus status;
    
    @Schema(description = "Data de emissÃ£o da fatura", example = "2024-01-15")
    @NotNull(message = "Data de emissÃ£o Ã© obrigatÃ³ria")
    private LocalDate issueDate;
    
    @Schema(description = "Data de vencimento da fatura", example = "2024-02-15")
    @NotNull(message = "Data de vencimento Ã© obrigatÃ³ria")
    private LocalDate dueDate;
    
    @Schema(description = "Data de pagamento da fatura", example = "2024-02-10")
    private LocalDate paymentDate;
    
    @Schema(description = "Categoria da fatura", example = "ManutenÃ§Ã£o")
    @Size(max = 100, message = "Categoria deve ter no mÃ¡ximo 100 caracteres")
    private String category;
    
    @Schema(description = "Centro de custo", example = "Operacional")
    @Size(max = 100, message = "Centro de custo deve ter no mÃ¡ximo 100 caracteres")
    private String centroCusto;
    
    @Schema(description = "URL do comprovante de pagamento", example = "/api/uploads/comprovantes/abc123.pdf")
    @Size(max = 500, message = "URL do comprovante deve ter no mÃ¡ximo 500 caracteres")
    private String comprovanteUrl;
    
    @Schema(description = "CÃ³digo de barras do boleto", example = "12345678901234567890")
    @Size(max = 255, message = "CÃ³digo de barras deve ter no mÃ¡ximo 255 caracteres")
    private String barcode;
    
    @Schema(description = "Observações sobre a fatura")
    @Size(max = 1000, message = "Observações deve ter no máximo 1000 caracteres")
    private String notes;

    @Schema(description = "Sigla da empresa associada", example = "ADM")
    private String companySigla;

    private java.util.UUID supplierId;
    private java.util.UUID clientId;
    private java.util.UUID contractId;
    private java.util.UUID workPostId;
    private java.util.UUID unitId;
    private java.util.UUID garageId;
    
    private String supplierName;
    private String clientName;
    private String contractNumber;
    private String workPostName;
    private String garageName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public java.util.UUID getId() {
        return id;
    }
    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public java.util.UUID getSupplierId() {
        return supplierId;
    }
    public void setSupplierId(java.util.UUID supplierId) {
        this.supplierId = supplierId;
    }

    public java.util.UUID getClientId() {
        return clientId;
    }
    public void setClientId(java.util.UUID clientId) {
        this.clientId = clientId;
    }

    public java.util.UUID getContractId() {
        return contractId;
    }
    public void setContractId(java.util.UUID contractId) {
        this.contractId = contractId;
    }

    public java.util.UUID getWorkPostId() {
        return workPostId;
    }
    public void setWorkPostId(java.util.UUID workPostId) {
        this.workPostId = workPostId;
    }

    public String getWorkPostName() {
        return workPostName;
    }
    public void setWorkPostName(String workPostName) {
        this.workPostName = workPostName;
    }

    public java.util.UUID getUnitId() {
        return unitId;
    }
    public void setUnitId(java.util.UUID unitId) {
        this.unitId = unitId;
    }

    public static InvoiceDTO fromEntity(com.z7design.fleet_manager.model.Invoice invoice) {
        if (invoice == null) return null;
        try {
            InvoiceDTO dto = new InvoiceDTO();
            dto.setId(invoice.getId());
            dto.setInvoiceNumber(invoice.getInvoiceNumber());
            dto.setDescription(invoice.getDescription());
            dto.setAmount(invoice.getAmount());
            dto.setType(invoice.getType());
            dto.setStatus(invoice.getStatus());
            dto.setIssueDate(invoice.getIssueDate());
            dto.setDueDate(invoice.getDueDate());
            dto.setPaymentDate(invoice.getPaymentDate());
            dto.setCategory(invoice.getCategory());
            dto.setCentroCusto(invoice.getCentroCusto());
            dto.setComprovanteUrl(invoice.getComprovanteUrl());
            dto.setBarcode(invoice.getBarcode());
            dto.setNotes(invoice.getNotes());
            dto.setCompanySigla(invoice.getCompanySigla());
            
            // Tratamento seguro para relacionamentos (pode causar LazyInitializationException)
            try {
                dto.setSupplierId(invoice.getSupplier() != null ? invoice.getSupplier().getId() : null);
                dto.setSupplierName(invoice.getSupplier() != null ? invoice.getSupplier().getName() : null);
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao acessar supplier da invoice " + invoice.getId() + ": " + e.getMessage());
                dto.setSupplierId(null);
                dto.setSupplierName(null);
            }
            
            try {
                dto.setClientId(invoice.getClient() != null ? invoice.getClient().getId() : null);
                dto.setClientName(invoice.getClient() != null ? invoice.getClient().getName() : null);
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao acessar client da invoice " + invoice.getId() + ": " + e.getMessage());
                dto.setClientId(null);
                dto.setClientName(null);
            }
            
            try {
                dto.setContractId(invoice.getContract() != null ? invoice.getContract().getId() : null);
                dto.setContractNumber(invoice.getContract() != null ? invoice.getContract().getContractNumber() : null);
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao acessar contract da invoice " + invoice.getId() + ": " + e.getMessage());
                dto.setContractId(null);
                dto.setContractNumber(null);
            }

            try {
                dto.setWorkPostId(invoice.getWorkPost() != null ? invoice.getWorkPost().getId() : null);
                dto.setWorkPostName(invoice.getWorkPost() != null ? invoice.getWorkPost().getName() : null);
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao acessar workPost da invoice " + invoice.getId() + ": " + e.getMessage());
                dto.setWorkPostId(null);
                dto.setWorkPostName(null);
            }
            
            try {
                dto.setUnitId(invoice.getUnit() != null ? invoice.getUnit().getId() : null);
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao acessar unit da invoice " + invoice.getId() + ": " + e.getMessage());
                dto.setUnitId(null);
            }

            try {
                dto.setGarageId(invoice.getGarage() != null ? invoice.getGarage().getId() : null);
                dto.setGarageName(invoice.getGarage() != null ? invoice.getGarage().getName() : null);
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao acessar garage da invoice " + invoice.getId() + ": " + e.getMessage());
                dto.setGarageId(null);
                dto.setGarageName(null);
            }
            
            dto.setCreatedAt(invoice.getCreatedAt());
            dto.setUpdatedAt(invoice.getUpdatedAt());
            return dto;
        } catch (Exception e) {
            System.err.println("âŒ Erro ao converter Invoice para DTO: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao converter Invoice para DTO: " + e.getMessage(), e);
        }
    }
} 
