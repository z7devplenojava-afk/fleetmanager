package com.z7design.fleet_manager.dto.fiscal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class FiscalEmissionDtos {

    private FiscalEmissionDtos() {
    }

    public record CteCreateRequest(
            String series,
            String cfop,
            String natureOperation,
            String serviceTaker,
            String issuerStateRegistration,
            String senderName,
            String senderTaxId,
            String senderAddress,
            String senderCity,
            String senderState,
            String senderZip,
            String senderStateRegistration,
            String recipientName,
            String recipientTaxId,
            String recipientAddress,
            String recipientCity,
            String recipientState,
            String recipientZip,
            String recipientStateRegistration,
            String originCity,
            String originState,
            String destinationCity,
            String destinationState,
            String vehiclePlate,
            String rntrc,
            String cargoDescription,
            BigDecimal cargoWeight,
            BigDecimal cargoValue,
            BigDecimal freightValue,
            BigDecimal icmsRate,
            String notes,
            UUID clientId
    ) {
    }

    public record CteResponse(
            UUID id,
            UUID fiscalDocumentId,
            String number,
            String series,
            String accessKey,
            LocalDateTime emissionDate,
            String senderName,
            String recipientName,
            String originCity,
            String originState,
            String destinationCity,
            String destinationState,
            BigDecimal freightValue,
            String status
    ) {
    }

    public record NfseItemRequest(
            String description,
            BigDecimal quantity,
            BigDecimal unitValue
    ) {
    }

    /**
     * Classificação IBS/CBS declarada na DPS. O leiaute v1.01 não admite valores ou
     * alíquotas nesse grupo — eles são parametrizados e publicados pela SEFIN na NFS-e.
     */
    public record NfseIbscbsRequest(
            String finNFSe,
            String indFinal,
            String cIndOp,
            String tpOper,
            String tpEnteGov,
            String indDest,
            String cst,
            String cClassTrib,
            String cCredPres
    ) {
    }

    public record NfseCreateRequest(
            String series,
            String competence,
            UUID clientId,
            String municipalityCode,
            String serviceLocationCode,
            String issuerMunicipalRegistration,
            String takerName,
            String takerTaxId,
            String takerMunicipalRegistration,
            String takerAddress,
            String takerAddressNumber,
            String takerNeighborhood,
            String takerMunicipalityCode,
            String takerCity,
            String takerState,
            String takerZip,
            String takerEmail,
            String serviceCode,
            String municipalTaxCode,
            String nbsCode,
            String serviceDescription,
            String discrimination,
            BigDecimal grossAmount,
            String issTaxation,
            String issWithholdingType,
            String opSimpNac,
            String regEspTrib,
            BigDecimal deductionAmount,
            BigDecimal issRate,
            Boolean issWithheld,
            BigDecimal inssAmount,
            BigDecimal irrfAmount,
            BigDecimal csllAmount,
            LocalDate dueDate,
            String notes,
            List<NfseItemRequest> items,
            NfseIbscbsRequest ibscbs
    ) {
    }

    public record NfseResponse(
            UUID id,
            UUID fiscalDocumentId,
            Long dpsNumber,
            String dpsId,
            String nfseKey,
            String number,
            String series,
            String verificationCode,
            LocalDateTime emissionDate,
            String competence,
            String competenceLabel,
            String environment,
            String takerName,
            String takerTaxId,
            BigDecimal grossAmount,
            BigDecimal issAmount,
            BigDecimal issRetainedAmount,
            BigDecimal inssAmount,
            BigDecimal netAmount,
            String status,
            String rejectionCode,
            String rejectionMessage,
            BigDecimal ibscbsVTotNf,
            BigDecimal ibscbsVIbs,
            BigDecimal ibscbsVCbs
    ) {
    }

    public record NfsePreviewResponse(
            String dpsId,
            String xml,
            boolean schemaValid,
            List<String> messages,
            BigDecimal grossAmount,
            BigDecimal issAmount,
            BigDecimal netAmount
    ) {
    }

    public record NfseConfigRequest(
            String inscricaoEstadual,
            String inscricaoMunicipal,
            String codigoMunicipio,
            String regimeTributario
    ) {
    }

    public record NfseConfigResponse(
            UUID companyId,
            String name,
            String cnpj,
            String inscricaoEstadual,
            String inscricaoMunicipal,
            String codigoMunicipio,
            String regimeTributario,
            String address,
            String addressNumber,
            String neighborhood,
            String city,
            String state,
            String zipCode,
            String phone,
            String email,
            boolean certificateConfigured,
            LocalDateTime certificateValidUntil
    ) {
    }

    public record FiscalCertificateResponse(
            UUID id,
            String alias,
            String fileName,
            String subject,
            String cnpj,
            String serialNumber,
            LocalDateTime validFrom,
            LocalDateTime validUntil,
            boolean active,
            boolean expired,
            LocalDateTime createdAt
    ) {
    }

    public record GeneratedFiscalFile(String filename, byte[] content, String contentType) {
    }
}
