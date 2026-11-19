package com.z7design.fleet_manager.dto.fiscal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** DTOs da emissão de NF-e modelo 55 (versão 4.00). */
public final class NfeEmissionDtos {

    private NfeEmissionDtos() {
    }

    public record NfeItemRequest(
            String code,
            String description,
            String ncm,
            String cfop,
            String unit,
            BigDecimal quantity,
            BigDecimal unitValue,
            String icmsOrig,
            String icmsCst,
            BigDecimal icmsRate,
            String pisCst,
            BigDecimal pisRate,
            String cofinsCst,
            BigDecimal cofinsRate
    ) {
    }

    public record NfeCreateRequest(
            String series,
            String natureOperation,
            String environment,
            String tpNf,
            String idDest,
            String tpImp,
            String tpEmis,
            String finNfe,
            String indFinal,
            String indPres,
            String procEmi,
            String verProc,

            String issuerStateRegistration,
            String issuerAddress,
            String issuerAddressNumber,
            String issuerNeighborhood,
            String issuerCity,
            String issuerState,
            String issuerZip,
            String issuerMunicipalityCode,
            String issuerPhone,
            String issuerEmail,
            String issuerCrt,

            String recipientName,
            String recipientTaxId,
            String recipientStateRegistration,
            String recipientIndIeDest,
            String recipientEmail,
            String recipientAddress,
            String recipientAddressNumber,
            String recipientNeighborhood,
            String recipientCity,
            String recipientState,
            String recipientZip,
            String recipientMunicipalityCode,

            String paymentType,
            String paymentInd,
            String freightModality,
            String notes,

            String respTechCnpj,
            String respTechContact,
            String respTechEmail,
            String respTechPhone,

            List<NfeItemRequest> items
    ) {
    }

    public record NfeResponse(
            UUID id,
            UUID fiscalDocumentId,
            String number,
            String series,
            String accessKey,
            String protocolNumber,
            String protocolStatus,
            String protocolMessage,
            LocalDateTime emissionDate,
            String environment,
            String natureOperation,
            String issuerName,
            String issuerTaxId,
            String recipientName,
            String recipientTaxId,
            BigDecimal totalAmount,
            BigDecimal icmsAmount,
            BigDecimal pisAmount,
            BigDecimal cofinsAmount,
            String status,
            String rejectionCode,
            String rejectionMessage,
            LocalDateTime cancelledAt,
            String cancellationReason,
            List<NfeItemResponse> items
    ) {
    }

    public record NfeItemResponse(
            Integer itemNumber,
            String code,
            String description,
            String ncm,
            String cfop,
            BigDecimal quantity,
            BigDecimal unitValue,
            BigDecimal totalValue,
            String icmsCst
    ) {
    }
}
