package com.z7design.fleet_manager.fiscal;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Chave de acesso da NF-e/CT-e (44 dígitos) com dígito verificador módulo 11.
 *
 * <p>Composição: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + série(3) + nNF(9) +
 * tpEmis(1) + cNF(8) + cDV(1).</p>
 */
public final class NfeAccessKey {

    private static final Map<String, String> UF_CODE = Map.ofEntries(
            Map.entry("AC", "12"), Map.entry("AL", "27"), Map.entry("AP", "16"), Map.entry("AM", "13"),
            Map.entry("BA", "29"), Map.entry("CE", "23"), Map.entry("DF", "53"), Map.entry("ES", "32"),
            Map.entry("GO", "52"), Map.entry("MA", "21"), Map.entry("MT", "51"), Map.entry("MS", "50"),
            Map.entry("MG", "31"), Map.entry("PA", "15"), Map.entry("PB", "25"), Map.entry("PR", "41"),
            Map.entry("PE", "26"), Map.entry("PI", "22"), Map.entry("RJ", "33"), Map.entry("RN", "24"),
            Map.entry("RS", "43"), Map.entry("RO", "11"), Map.entry("RR", "14"), Map.entry("SC", "42"),
            Map.entry("SP", "35"), Map.entry("SE", "28"), Map.entry("TO", "17"));

    private NfeAccessKey() {
    }

    public static String ufCode(String state) {
        if (state == null || state.isBlank()) {
            return "31";
        }
        return UF_CODE.getOrDefault(state.trim().toUpperCase(), "31");
    }

    /** Gera a chave com um código numérico (cNF) aleatório de 8 dígitos. */
    public static String generate(String state, LocalDateTime emission, String cnpj,
                                  String series, String number, String tpEmis) {
        String cNF = String.format("%08d", ThreadLocalRandom.current().nextInt(100_000_000));
        return generate(state, emission, cnpj, series, number, tpEmis, cNF);
    }

    public static String generate(String state, LocalDateTime emission, String cnpj,
                                  String series, String number, String tpEmis, String cNF) {
        String base = base(state, emission, cnpj, series, number, tpEmis, cNF);
        return base + checkDigit(base);
    }

    /** Retorna a base de 43 dígitos (sem o dígito verificador). */
    public static String base(String state, LocalDateTime emission, String cnpj,
                              String series, String number, String tpEmis, String cNF) {
        String cUf = ufCode(state);
        String aamm = String.format("%02d%02d", emission.getYear() % 100, emission.getMonthValue());
        String cnpjDigits = leftPad(digits(cnpj, 14), 14);
        String serie = leftPad(digits(series, 3), 3);
        String nNF = leftPad(digits(number, 9), 9);
        String emiss = leftPad(digits(tpEmis, 1), 1);
        String numericCode = leftPad(digits(cNF, 8), 8);
        String base = cUf + aamm + cnpjDigits + "55" + serie + nNF + emiss + numericCode;
        if (base.length() != 43 || !base.matches("\\d{43}")) {
            throw new IllegalArgumentException("Não foi possível montar a base da chave da NF-e: " + base);
        }
        return base;
    }

    /** Dígito verificador módulo 11, pesos de 2 a 9 da direita para a esquerda. */
    public static int checkDigit(String fortyThreeDigits) {
        if (fortyThreeDigits == null || !fortyThreeDigits.matches("\\d{43}")) {
            throw new IllegalArgumentException("A base da chave deve conter exatamente 43 dígitos.");
        }
        int weight = 2;
        int sum = 0;
        for (int i = fortyThreeDigits.length() - 1; i >= 0; i--) {
            sum += (fortyThreeDigits.charAt(i) - '0') * weight;
            weight = weight == 9 ? 2 : weight + 1;
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    public static boolean valid(String key) {
        if (key == null || !key.matches("\\d{44}")) {
            return false;
        }
        return checkDigit(key.substring(0, 43)) == (key.charAt(43) - '0');
    }

    /** Código numérico (cNF) extraído de uma chave de 44 dígitos. */
    public static String cnf(String key) {
        requireKey(key);
        return key.substring(35, 43);
    }

    public static String digitVerifier(String key) {
        requireKey(key);
        return key.substring(43);
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
        return only.length() > max ? only.substring(0, max) : only;
    }

    public static String leftPad(String value, int size) {
        String v = value == null ? "" : value;
        if (v.length() >= size) {
            return v.substring(v.length() - size);
        }
        return "0".repeat(size - v.length()) + v;
    }

    private static void requireKey(String key) {
        if (key == null || key.length() != 44) {
            throw new IllegalArgumentException("Chave de acesso inválida: informe 44 dígitos.");
        }
    }
}
