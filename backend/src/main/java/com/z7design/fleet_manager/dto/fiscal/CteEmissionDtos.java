package com.z7design.fleet_manager.dto.fiscal;

import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.CteCreateRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTOs exclusivos da emissão real de CT-e (modelo 57).
 *Os campos de {@link CteCreateRequest} são replicados aqui para que o corpo
 * enviado pelo frontend continue "flat" e, ao mesmo tempo, possa transportar
 * os códigos IBGE exigidos pelo leiaute 4.00 (nunca placeholders).
 */
public final class CteEmissionDtos {

    private CteEmissionDtos() {
    }

    /**
     * Corpo aceito por POST /api/fiscal/cte. Quando os códigos de município não
     * são informados, o serviço aplica os fallbacks documentados no
     * ElectronicCteService (empresa para emissão/envio, origem para remetente e
     * destino para destinatário).
     */
    public record CteEmissionRequest(
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
            UUID clientId,
            String originMunicipalityCode,
            String destinationMunicipalityCode,
            String senderMunicipalityCode,
            String recipientMunicipalityCode,
            String environment
    ) {
        public CteCreateRequest toCreateRequest() {
            return new CteCreateRequest(
                    series, cfop, natureOperation, serviceTaker, issuerStateRegistration,
                    senderName, senderTaxId, senderAddress, senderCity, senderState, senderZip,
                    senderStateRegistration, recipientName, recipientTaxId, recipientAddress,
                    recipientCity, recipientState, recipientZip, recipientStateRegistration,
                    originCity, originState, destinationCity, destinationState, vehiclePlate,
                    rntrc, cargoDescription, cargoWeight, cargoValue, freightValue, icmsRate,
                    notes, clientId);
        }

        public static CteEmissionRequest from(CteCreateRequest request) {
            if (request == null) {
                return null;
            }
            return new CteEmissionRequest(
                    request.series(), request.cfop(), request.natureOperation(), request.serviceTaker(),
                    request.issuerStateRegistration(), request.senderName(), request.senderTaxId(),
                    request.senderAddress(), request.senderCity(), request.senderState(), request.senderZip(),
                    request.senderStateRegistration(), request.recipientName(), request.recipientTaxId(),
                    request.recipientAddress(), request.recipientCity(), request.recipientState(),
                    request.recipientZip(), request.recipientStateRegistration(), request.originCity(),
                    request.originState(), request.destinationCity(), request.destinationState(),
                    request.vehiclePlate(), request.rntrc(), request.cargoDescription(), request.cargoWeight(),
                    request.cargoValue(), request.freightValue(), request.icmsRate(), request.notes(),
                    request.clientId(), null, null, null, null, null);
        }
    }

    /** Corpo de POST /api/fiscal/cte/{id}/cancelar. */
    public record CteCancelRequest(String motivo) {
    }

    /** Dados fiscais que não existem na entidade ElectronicCte (fixa, por contrato). */
    public record CteFiscalContext(
            String issuerMunicipalityCode,
            String originMunicipalityCode,
            String destinationMunicipalityCode,
            String senderMunicipalityCode,
            String recipientMunicipalityCode,
            String environment,
            String crt
    ) {
    }

    /** Colunas adicionadas pela migration V4718, lidas via JDBC. */
    public record CteTransmission(
            String protocolNumber,
            String responseXml,
            String rejectionCode,
            String rejectionMessage,
            String environment,
            String cancellationReason,
            LocalDateTime cancelledAt,
            String signedXml
    ) {
        public boolean hasSignedXml() {
            return signedXml != null && !signedXml.isBlank();
        }
    }
}
