package com.z7design.fleet_manager.util;

import java.util.regex.Pattern;

/**
 * Normalizacao de numeros de WhatsApp no formato aceito pelas APIs
 * (DDI + DDD + numero, somente digitos).
 */
public final class WhatsAppPhoneUtils {

    private static final Pattern NON_DIGITS = Pattern.compile("\\D");

    private WhatsAppPhoneUtils() {
    }

    /**
     * Normaliza um telefone brasileiro para o formato E.164 sem o "+".
     *
     * <p>Aceita numeros com DDD (10 ou 11 digitos) e numeros que ja possuem
     * o DDI 55 (12 ou 13 digitos). Retorna {@code null} quando o numero nao
     * tem tamanho valido.</p>
     */
    public static String normalizeBrazilian(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String digits = NON_DIGITS.matcher(raw).replaceAll("");
        if (digits.isEmpty()) {
            return null;
        }

        // Remove zeros de discagem no inicio (ex: 031...)
        digits = digits.replaceFirst("^0+", "");

        if (digits.length() == 10 || digits.length() == 11) {
            digits = "55" + digits;
        }

        if (digits.startsWith("55") && (digits.length() == 12 || digits.length() == 13)) {
            return digits;
        }

        return null;
    }

    public static boolean isValidBrazilian(String raw) {
        return normalizeBrazilian(raw) != null;
    }
}
