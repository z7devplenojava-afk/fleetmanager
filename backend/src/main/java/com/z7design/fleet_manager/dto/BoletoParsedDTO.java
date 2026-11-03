package com.z7design.fleet_manager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO com os dados extraídos de um boleto bancário em PDF")
public class BoletoParsedDTO {

    @Schema(description = "Código de barras do boleto (44 dígitos)", example = "34191123450000015000123456789012345678901234")
    private String barcode;

    @Schema(description = "Linha digitável formatada ou limpa (47 ou 48 dígitos)", example = "34191.23454 00000.150003 12345.678902 1 95400000015000")
    private String linhaDigitavel;

    @Schema(description = "Valor nominal do documento", example = "150.00")
    private BigDecimal amount;

    @Schema(description = "Data de vencimento do boleto", example = "2026-11-28")
    private LocalDate dueDate;

    @Schema(description = "CNPJ ou CPF do beneficiário / cedente", example = "12.345.678/0001-90")
    private String beneficiaryCnpjCpf;

    @Schema(description = "Nome ou razão social do beneficiário / cedente")
    private String beneficiaryName;

    @Schema(description = "CNPJ ou CPF do pagador / sacado")
    private String payerCnpjCpf;

    @Schema(description = "Nome do pagador / sacado")
    private String payerName;

    @Schema(description = "Código de compensação do banco", example = "341")
    private String bankCode;

    @Schema(description = "Nome da instituição bancária", example = "Itaú Unibanco S.A.")
    private String bankName;

    @Schema(description = "Nome original do arquivo PDF enviado", example = "Boleto_Parcela_1.pdf")
    private String originalFileName;

    @Schema(description = "URL do arquivo armazenado", example = "/uploads/maintenance/uuid-boleto.pdf")
    private String fileUrl;

    @Schema(description = "Alerta ou detalhes de divergência detectados")
    private String divergenceDetails;

    @Schema(description = "Número da parcela vinculada no rateio da NF", example = "1")
    private Integer matchedInstallmentNumber;

    @Builder.Default
    private boolean parseSuccess = true;

    private String errorMessage;
}

