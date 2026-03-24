package com.z7design.fleet_manager.config.jackson;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.util.UUID;

/**
 * Evita 400 quando o front envia {@code "id": ""} em objetos aninhados (cargo, unidade, etc.).
 */
public class BlankStringToNullUuidDeserializer extends JsonDeserializer<UUID> {

    @Override
    public UUID deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonToken t = p.currentToken();
        if (t == null || t == JsonToken.VALUE_NULL) {
            return null;
        }
        String s = p.getValueAsString();
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(s.trim());
        } catch (IllegalArgumentException ex) {
            throw ctxt.weirdStringException(s, UUID.class, "UUID inválido");
        }
    }
}
