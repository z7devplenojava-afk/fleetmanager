package com.z7design.fleet_manager.dto.fiscal;

/**
 * DTOs dos eventos da NFS-e Nacional (cancelamento e consulta).
 */
public final class NfseEventDtos {

    private NfseEventDtos() {
    }

    /**
     * Pedido de cancelamento.
     *
     * @param reasonCode   código do motivo: 1 (erro na emissão), 2 (serviço não prestado)
     *                    ou 9 (outros)
     * @param justification descrição do motivo (15 a 255 caracteres)
     */
    public record NfseCancelRequest(String reasonCode, String justification) {
    }

    /**
     * Resultado do registro/consulta de um evento.
     *
     * @param id          identificador do evento (Id de infEvento) ou do pedido
     * @param status      código de situação do processamento (cStat)
     * @param message     mensagem de retorno (xMotivo)
     * @param protocol    número do protocolo (nProt)
     * @param responseXml XML bruto devolvido pela SEFIN (quando aplicável)
     * @param success     se o evento foi registrado com sucesso
     */
    public record NfseEventResponse(
            String id,
            String status,
            String message,
            String protocol,
            String responseXml,
            boolean success
    ) {

        /** Construtor de conveniência: sucesso deduzido do código cStat. */
        public NfseEventResponse(String id, String status, String message,
                                 String protocol, String responseXml) {
            this(id, status, message, protocol, responseXml, isSuccessCode(status));
        }

        private static boolean isSuccessCode(String status) {
            if (status == null || status.isBlank()) {
                return false;
            }
            String code = status.trim();
            return code.equals("100") || code.equals("135") || code.equals("200");
        }
    }
}
