package com.z7design.fleet_manager.service.commercial;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class QuotationHeuristicParser {

    @Data
    @Builder
    public static class ParseResult {
        private boolean isQuotation;
        private int confidenceScore;
        private List<String> matchedKeywords;
        private String origin;
        private String destination;
        private String tripDate;
        private String returnDate;
        private Integer passengers;
        private String vehicleType;
        private String inferredClientName;
    }

    private static final String[] PRIMARY_KEYWORDS = {
            "cotação", "cotacao", "orçamento", "orcamento", "fretamento",
            "proposta comercial", "locação", "locacao", "preço de fretamento"
    };

    private static final String[] SECONDARY_KEYWORDS = {
            "itinerário", "itinerario", "passageiros", "translado", "transfer",
            "viagem", "ida e volta", "diária", "diaria", "micro-ônibus", "microonibus",
            "ônibus", "onibus", "van", "veículo dedicado", "veiculo dedicado", "solicitação de preço"
    };

    public ParseResult analyze(String subject, String bodyText, String senderEmail, String senderName, boolean hasAttachments) {
        String subj = (subject != null) ? subject.toLowerCase() : "";
        String body = (bodyText != null) ? bodyText.toLowerCase() : "";
        String fullText = subj + " " + body;

        List<String> matched = new ArrayList<>();
        int score = 0;

        for (String kw : PRIMARY_KEYWORDS) {
            if (subj.contains(kw)) {
                score += 45;
                matched.add("Assunto: " + kw);
            } else if (body.contains(kw)) {
                score += 25;
                matched.add("Corpo: " + kw);
            }
        }

        for (String kw : SECONDARY_KEYWORDS) {
            if (subj.contains(kw)) {
                score += 20;
                matched.add("Assunto: " + kw);
            } else if (body.contains(kw)) {
                score += 10;
                matched.add("Corpo: " + kw);
            }
        }

        if (hasAttachments) {
            score += 15;
            matched.add("Possui anexos");
        }

        // Extração de parâmetros
        String origin = extractRegex(bodyText, "(?i)(?:origem|de|sa[íi]da|embarque)[:\\s]+([A-Za-zÀ-ÿ0-9\\s\\-–/]+?)(?=(?:\\n|\\r|destino|para|chegada|data|\\.|,|$))");
        String destination = extractRegex(bodyText, "(?i)(?:destino|para|chegada|desembarque)[:\\s]+([A-Za-zÀ-ÿ0-9\\s\\-–/]+?)(?=(?:\\n|\\r|origem|de|data|hor[aá]rio|\\.|,|$))");
        String tripDate = extractRegex(bodyText, "(?i)(?:data(?:\\s+da\\s+viagem)?|ida|sa[íi]da|embarque em)[:\\s]+(\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)");
        String returnDate = extractRegex(bodyText, "(?i)(?:retorno|volta|data\\s+de\\s+volta)[:\\s]+(\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)");

        Integer passengers = null;
        String paxStr = extractRegex(bodyText, "(?i)(\\d{1,3})\\s*(?:passageiros|lugares|pessoas|pax|assentos)");
        if (StringUtils.hasText(paxStr)) {
            try {
                passengers = Integer.parseInt(paxStr.trim());
                score += 10;
                matched.add("Qtd Passageiros: " + passengers);
            } catch (Exception ignored) {}
        }

        String vehicleType = null;
        if (fullText.contains("micro-ônibus") || fullText.contains("microonibus") || fullText.contains("micro")) {
            vehicleType = "Micro-ônibus";
        } else if (fullText.contains("van") || fullText.contains("sprinter")) {
            vehicleType = "Van";
        } else if (fullText.contains("ônibus executivo") || fullText.contains("onibus executivo")) {
            vehicleType = "Ônibus Executivo";
        } else if (fullText.contains("ônibus") || fullText.contains("onibus") || fullText.contains("bus")) {
            vehicleType = "Ônibus Convencional";
        }

        // Inferir Nome do Cliente / Empresa a partir do Remetente
        String inferredClient = senderName;
        if (!StringUtils.hasText(inferredClient) && StringUtils.hasText(senderEmail) && senderEmail.contains("@")) {
            String domain = senderEmail.substring(senderEmail.indexOf("@") + 1);
            if (!domain.equalsIgnoreCase("gmail.com") && !domain.equalsIgnoreCase("hotmail.com") &&
                !domain.equalsIgnoreCase("outlook.com") && !domain.equalsIgnoreCase("yahoo.com.br")) {
                inferredClient = domain.replace(".com.br", "").replace(".com", "").toUpperCase();
            }
        }

        int normalizedScore = Math.min(score, 100);
        boolean isQuotation = normalizedScore >= 25;

        return ParseResult.builder()
                .isQuotation(isQuotation)
                .confidenceScore(normalizedScore)
                .matchedKeywords(matched)
                .origin(cleanString(origin))
                .destination(cleanString(destination))
                .tripDate(tripDate)
                .returnDate(returnDate)
                .passengers(passengers)
                .vehicleType(vehicleType)
                .inferredClientName(inferredClient)
                .build();
    }

    private String extractRegex(String text, String regex) {
        if (!StringUtils.hasText(text)) return null;
        try {
            Pattern pattern = Pattern.compile(regex, Pattern.MULTILINE);
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String cleanString(String input) {
        if (input == null) return null;
        String trimmed = input.trim();
        if (trimmed.length() > 200) {
            trimmed = trimmed.substring(0, 200);
        }
        return trimmed.isEmpty() ? null : trimmed;
    }
}
