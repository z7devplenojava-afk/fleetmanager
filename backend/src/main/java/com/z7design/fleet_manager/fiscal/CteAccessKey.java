package com.z7design.fleet_manager.fiscal;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Chave de acesso do CT-e (44 dígitos), módulo 11, conforme o layout da NF-e/CT-e.
 */
public final class CteAccessKey {

    private static final Map<String, String> UF_CODE = Map.ofEntries(
            Map.entry("AC", "12"), Map.entry("AL", "27"), Map.entry("AP", "16"), Map.entry("AM", "13"),
            Map.entry("BA", "29"), Map.entry("CE", "23"), Map.entry("DF", "53"), Map.entry("ES", "32"),
            Map.entry("GO", "52"), Map.entry("MA", "21"), Map.entry("MT", "51"), Map.entry("MS", "50"),
            Map.entry("MG", "31"), Map.entry("PA", "15"), Map.entry("PB", "25"), Map.entry("PR", "41"),
            Map.entry("PE", "26"), Map.entry("PI", "22"), Map.entry("RJ", "33"), Map.entry("RN", "24"),
            Map.entry("RS", "43"), Map.entry("RO", "11"), Map.entry("RR", "14"), Map.entry("SC", "42"),
            Map.entry("SP", "35"), Map.entry("SE", "28"), Map.entry("TO", "17"));

    private CteAccessKey() {
    }

    public static String ufCode(String state) {
        if (state == null) {
            return "31";
        }
        return UF_CODE.getOrDefault(state.trim().toUpperCase(), "31");
    }

    public static String generate(String state, LocalDateTime emission, String cnpj, String series, String number) {
        String cUf = ufCode(state);
        String aamm = String.format("%02d%02d", emission.getYear() % 100, emission.getMonthValue());
        String cnpjDigits = digits(cnpj, 14);
        String serie = leftPad(digits(series, 3), 3);
        String nCt = leftPad(digits(number, 9), 9);
        String cCt = String.format("%08d", ThreadLocalRandom.current().nextInt(100_000_000));
        String base = cUf + aamm + cnpjDigits + "57" + serie + nCt + "1" + cCt;
        if (base.length() != 43) {
            throw new IllegalStateException("Base da chave do CT-e com tamanho inválido: " + base.length());
        }
        return base + checkDigit(base);
    }

    public static int checkDigit(String fortyThreeDigits) {
        int weight = 2;
        int sum = 0;
        for (int i = fortyThreeDigits.length() - 1; i >= 0; i--) {
            sum += (fortyThreeDigits.charAt(i) - '0') * weight;
            weight = weight == 9 ? 2 : weight + 1;
        }
        int dv = 11 - (sum % 11);
        return dv >= 10 ? 0 : dv;
    }

    public static String grouped(String key) {
        if (key == null) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < key.length(); i++) {
            if (i > 0 && i % 4 == 0) {
                out.append(' ');
            }
            out.append(key.charAt(i));
        }
        return out.toString();
    }

    public static String digits(String value, int max) {
        String only = value == null ? "" : value.replaceAll("\\D", "");
        if (only.length() > max) {
            only = only.substring(0, max);
        }
        return only;
    }

    public static String leftPad(String value, int size) {
        String v = value == null ? "" : value;
        if (v.length() >= size) {
            return v.substring(v.length() - size);
        }
        return "0".repeat(size - v.length()) + v;
    }
}
