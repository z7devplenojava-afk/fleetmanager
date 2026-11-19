package com.z7design.fleet_manager.fiscal;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.math.BigDecimal;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Interpreta a resposta da SEFIN sem depender de um envelope rígido: o sucesso é
 * identificado pela presença de infNFSe e as rejeições pelos campos de erro/mensagem.
 */
public final class NfseResponseParser {

    private static final Pattern JSON_CODE = Pattern.compile("\"codigo\"\\s*:\\s*\"?([0-9A-Za-z_.-]+)\"?");
    private static final Pattern JSON_MESSAGE = Pattern.compile(
            "\"(?:mensagem|message|descricao|detail|erro)\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");

    private NfseResponseParser() {
    }

    public static ParsedResponse parse(NfseSefinClient.SefinResponse response) {
        String body = response.body() == null ? "" : response.body().trim();
        String contentType = response.contentType() == null ? "" : response.contentType().toLowerCase();

        if (body.contains("<") && (contentType.contains("xml") || body.startsWith("<"))) {
            ParsedResponse parsed = parseXml(body);
            if (parsed != null) {
                return parsed;
            }
        }
        if (body.startsWith("{") || body.startsWith("[")) {
            return parseJson(body, response.status());
        }

        // Respostas textuais (inclusive HTML de erro de proxy/WAF).
        String message = body.isBlank() ? "Resposta vazia da SEFIN." : stripHtml(body);
        return new ParsedResponse(false, null, null, null, null,
                "HTTP " + response.status() + ": " + abbreviate(message, 1900));
    }

    private static ParsedResponse parseXml(String body) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            Document document = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));

            Element infNfse = first(document, "infNFSe");
            if (infNfse != null) {
                String id = infNfse.getAttribute("Id");
                String key = id != null && id.startsWith("NFS") && id.length() == 53 ? id.substring(3) : null;
                String number = text(first(document, "nNFSe"));
                String processedAt = text(first(document, "dhProc"));
                return new ParsedResponse(true, key, number, processedAt, null, null);
            }

            String code = firstNonBlank(text(first(document, "codigo")), text(first(document, "code")));
            String message = firstNonBlank(
                    text(first(document, "descricao")),
                    text(first(document, "mensagem")),
                    text(first(document, "message")),
                    text(first(document, "detail")),
                    text(first(document, "erro")),
                    text(first(document, "faultstring")));
            if (code == null && message == null) {
                message = body;
            }
            return new ParsedResponse(false, null, null, null, code, abbreviate(message, 1900));
        } catch (Exception e) {
            return null;
        }
    }

    private static ParsedResponse parseJson(String body, int status) {
        String code = firstMatch(JSON_CODE, body);
        String message = firstMatch(JSON_MESSAGE, body);
        if (message == null) {
            message = body;
        }
        return new ParsedResponse(false, null, null, null, code,
                abbreviate("HTTP " + status + ": " + message, 1900));
    }

    private static Element first(Document document, String localName) {
        NodeList all = document.getElementsByTagNameNS("*", localName);
        if (all.getLength() > 0) {
            return (Element) all.item(0);
        }
        NodeList any = document.getElementsByTagName(localName);
        return any.getLength() > 0 ? (Element) any.item(0) : null;
    }

    private static String text(Element element) {
        if (element == null) {
            return null;
        }
        String value = element.getTextContent();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String firstMatch(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? matcher.group(1) : null;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String stripHtml(String value) {
        return value.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    private static String abbreviate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max) + "...";
    }

    /**
     * Extrai os valores de IBS/CBS publicados na NFS-e autorizada
     * (grupo {@code IBSCBS} do leiaute da NFS-e, tipos {@code TCRTCIBSCBS} e
     * {@code TCRTCTotalCIBS}). Não altera o contrato de {@link #parse(NfseSefinClient.SefinResponse)}.
     *
     * @return os totais encontrados, ou {@code null} quando a resposta não contém o grupo
     */
    public static IbscbsTotals parseIbscbs(String responseXml) {
        if (responseXml == null || responseXml.isBlank()) {
            return null;
        }
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            Document document = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(responseXml.getBytes(StandardCharsets.UTF_8)));

            NodeList groups = document.getElementsByTagNameNS("*", "IBSCBS");
            Element ibscbs = null;
            // A NFS-e traz totCIBS; a DPS (quando ecada na resposta) traz apenas valores.
            for (int i = 0; i < groups.getLength(); i++) {
                Element candidate = (Element) groups.item(i);
                if (child(candidate, "totCIBS") != null) {
                    ibscbs = candidate;
                    break;
                }
            }
            if (ibscbs == null) {
                return null;
            }

            Element valores = child(ibscbs, "valores");
            Element uf = child(valores, "uf");
            Element mun = child(valores, "mun");
            Element fed = child(valores, "fed");
            Element tot = child(ibscbs, "totCIBS");
            Element gIbs = child(tot, "gIBS");
            Element gIbsUf = child(gIbs, "gIBSUFTot");
            Element gIbsMun = child(gIbs, "gIBSMunTot");
            Element gCbs = child(tot, "gCBS");

            return new IbscbsTotals(
                    decimal(child(valores, "vBC")),
                    decimal(child(uf, "pIBSUF")),
                    decimal(child(uf, "pAliqEfetUF")),
                    decimal(child(mun, "pIBSMun")),
                    decimal(child(mun, "pAliqEfetMun")),
                    decimal(child(fed, "pCBS")),
                    decimal(child(fed, "pAliqEfetCBS")),
                    decimal(child(tot, "vTotNF")),
                    decimal(child(gIbs, "vIBSTot")),
                    decimal(child(gIbsUf, "vIBSUF")),
                    decimal(child(gIbsMun, "vIBSMun")),
                    decimal(child(gCbs, "vCBS"))
            );
        } catch (Exception e) {
            return null;
        }
    }

    /** Apenas filhos diretos, para não confundir vIBSUF com vIBSTot etc. */
    private static Element child(Element parent, String localName) {
        if (parent == null || localName == null) {
            return null;
        }
        NodeList children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node node = children.item(i);
            if (node.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }
            String name = node.getLocalName() == null ? node.getNodeName() : node.getLocalName();
            if (localName.equals(name)) {
                return (Element) node;
            }
        }
        return null;
    }

    private static BigDecimal decimal(Element element) {
        String value = text(element);
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value.replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Totais de IBS/CBS extraídos da NFS-e autorizada. */
    public record IbscbsTotals(
            BigDecimal vBC,
            BigDecimal pIBSUF,
            BigDecimal pAliqEfetUF,
            BigDecimal pIBSMun,
            BigDecimal pAliqEfetMun,
            BigDecimal pCBS,
            BigDecimal pAliqEfetCBS,
            BigDecimal vTotNF,
            BigDecimal vIBSTot,
            BigDecimal vIBSUF,
            BigDecimal vIBSMun,
            BigDecimal vCBS
    ) {
    }

    public record ParsedResponse(
            boolean success,
            String nfseKey,
            String number,
            String processedAt,
            String rejectionCode,
            String rejectionMessage
    ) {
    }
}
