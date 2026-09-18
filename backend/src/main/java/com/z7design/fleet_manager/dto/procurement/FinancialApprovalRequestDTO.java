package com.z7design.fleet_manager.dto.procurement;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialApprovalRequestDTO {

    @NotNull(message = "ID da ordem de compra é obrigatório")
    private UUID purchaseOrderId;

    @NotNull(message = "Decisão de aprovação é obrigatória")
    private Boolean approved;

    private String financialNotes;

    // Detalhes da Programação de Pagamento
    private String paymentMethod; // CARTAO_CREDITO, CARTAO_DEBITO, BOLETO, PIX, TRANSFERENCIA, DINHEIRO
    private Integer installmentsCount; // Quantidade de parcelas (ex: 1 a 12)
    private String cardNumber; // Ex: Final 4821 - Cartão Corporativo Bradesco
    private String cardFlag; // MASTERCARD, VISA, ELO, AMEX
    private String paymentReference; // Chave PIX, NSU/Autorização, Banco/Agência/Conta
    private LocalDate paymentScheduledDate;
    private LocalDate paymentDueDate;
    private String installmentDetails; // JSON com detalhamento das parcelas
}

