package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NfseParsedDataDTO {
    private String nfseNumber;
    private String nfseKey;
    private LocalDateTime issueDate;
    private String tomadorCnpjCpf;
    private String tomadorName;
    private String prestadorCnpjCpf;
    private String prestadorName;
    private BigDecimal grossAmount;
    private BigDecimal netAmount;
    private BigDecimal issqnRetido;
    private BigDecimal inssRetido;
    private BigDecimal irRetido;
    private BigDecimal pisRetido;
    private BigDecimal cofinsRetido;
    private BigDecimal csllRetido;
    private BigDecimal ibsCbsAmount;
    private String serviceDescription;
    private String cnaeCode;
    private String municipality;
    private String xmlUrl;
    private String pdfUrl;
    private String faturaLocacaoNumber;
    private String pedidoNumber;
    private String periodoLocacao;
    private String placasVeiculos;
    private String dadosBancarios;
}
