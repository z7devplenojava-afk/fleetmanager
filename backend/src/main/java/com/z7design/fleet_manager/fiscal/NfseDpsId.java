package com.z7design.fleet_manager.fiscal;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;

/**
 * Regras do identificador da DPS (45 posições):
 * "DPS" + Cód.Mun (7) + Tipo Inscrição (1) + Inscrição (14) + Série (5) + Nº DPS (15).
 */
public final class NfseDpsId {

    private NfseDpsId() {
    }

    public static String build(String municipalityCode, String taxId, String series, long dpsNumber) {
        String municipality = digits(municipalityCode);
        if (municipality.length() != 7) {
            throw new IllegalArgumentException("O código IBGE do município deve ter 7 dígitos.");
        }
        String inscription = digits(taxId);
        String tipoInscricao;
        if (inscription.length() == 14) {
            tipoInscricao = "2"; // CNPJ
        } else if (inscription.length() == 11) {
            tipoInscricao = "1"; // CPF
            inscription = pad(inscription, 14, '0');
        } else {
            throw new IllegalArgumentException("CNPJ/CPF do prestador inválido para o Id da DPS.");
        }
        String serie = pad(digits(series), 5, '0');
        String numero = pad(String.valueOf(dpsNumber), 15, '0');
        return "DPS" + municipality + tipoInscricao + inscription + serie + numero;
    }

    public static LocalDate competenceDate(String competence) {
        if (competence == null || competence.isBlank()) {
            return LocalDate.now().withDayOfMonth(1);
        }
        String value = competence.trim();
        try {
            if (value.length() == 7) {
                return YearMonth.parse(value).atDay(1);
            }
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Competência inválida. Use AAAA-MM ou AAAA-MM-DD.");
        }
    }

    public static String competenceLabel(String competence) {
        if (competence == null || competence.isBlank()) {
            return "";
        }
        String value = competence.trim();
        if (value.length() >= 7) {
            return value.substring(5, 7) + "/" + value.substring(0, 4);
        }
        return value;
    }

    public static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    public static String pad(String value, int length, char fill) {
        String safe = value == null ? "" : value;
        if (safe.length() >= length) {
            return safe.substring(safe.length() - length);
        }
        return String.valueOf(fill).repeat(length - safe.length()) + safe;
    }

    public static String leftPadZeros(String value, int length) {
        return pad(value, length, '0');
    }
}
