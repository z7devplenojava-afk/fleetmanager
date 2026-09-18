package com.z7design.fleet_manager.dto.procurement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementQuoteOptionDTO {
    private UUID id;
    private UUID comparisonId;

    @NotBlank(message = "Nome do fornecedor é obrigatório")
    private String supplierName;

    private String supplierCnpj;
    private String supplierContact;
    private String supplierPhone;

    @NotNull(message = "Preço unitário é obrigatório")
    private BigDecimal unitPrice;

    @NotNull(message = "Preço total é obrigatório")
    private BigDecimal totalPrice;

    @NotBlank(message = "Condições de pagamento são obrigatórias")
    private String paymentTerms; // À VISTA, 30 DIAS, 30/60 DIAS, 30/60/90 DIAS

    @Builder.Default
    private Integer paymentTermDays = 0; // 0, 30, 60, 90

    @NotNull(message = "Prazo de entrega em dias é obrigatório")
    @Builder.Default
    private Integer deliveryTimeDays = 1;

    @Builder.Default
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Builder.Default
    private Integer warrantyMonths = 3;

    private Boolean isWinner;
    private Boolean isSystemRecommended;
    private String proposalAttachmentUrl;
    private String notes;
}
