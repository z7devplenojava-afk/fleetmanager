package com.z7design.fleet_manager.service.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Conta (sessao) do AstraCalls.
 *
 * @param id      identificador da sessao
 * @param name    nome da conta
 * @param jid     JID do numero conectado
 * @param lastJid ultimo numero conectado (mantem apos desconectar)
 * @param state   connecting, open, logged_out, qr, pairing_code, passkey_request
 * @param paired  indica se a conta esta pareada
 */
public record AstraCallsSession(
        String id,
        String name,
        String jid,
        String lastJid,
        String state,
        boolean paired) {

    public static AstraCallsSession from(JsonNode node) {
        if (node == null) {
            return null;
        }
        return new AstraCallsSession(
                text(node, "id"),
                text(node, "name"),
                text(node, "jid"),
                text(node, "lastJid"),
                text(node, "state"),
                node.hasNonNull("paired") && node.get("paired").asBoolean(false));
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    /** Numero exibido ao usuario (jid ou ultimo jid conhecido). */
    public String phoneNumber() {
        if (jid != null && !jid.isBlank()) {
            int at = jid.indexOf(':');
            return at > 0 ? jid.substring(0, at) : jid;
        }
        if (lastJid != null && !lastJid.isBlank()) {
            int at = lastJid.indexOf(':');
            return at > 0 ? lastJid.substring(0, at) : lastJid;
        }
        return null;
    }

    /** Estado simplificado usado pela interface. */
    public String displayState() {
        if (state != null && !state.isBlank()) {
            return state;
        }
        return paired ? "open" : "desconectado";
    }
}
