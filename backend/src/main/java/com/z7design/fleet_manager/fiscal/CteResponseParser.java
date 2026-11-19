package com.z7design.fleet_manager.fiscal;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Interpreta o retorno SOAP da SEFAZ (retCTe, retConsSitCTe e retEventoCTe)
 * independentemente do namespace do envelope.
 */
public final class CteResponseParser {

    private static final Set<String> APPROVED_CODES = Set.of("100", "101", "135", "136");
    private static final Set<String> AUTHORIZED_CODES = Set.of("100", "101");

    private CteResponseParser() {
    }

    public static ParsedResponse parse(SefazSoapClient.SoapResponse response) {
        if (response == null) {
            return failure("WEB SERVICE", "Resposta vazia da SEFAZ.");
        }
        String body = response.body() == null ? "" : response.body().trim();
        if (body.isEmpty()) {
            return failure("HTTP " + response.status(), "Resposta vazia da SEFAZ.");
        }
        if (body.contains("<")) {
            ParsedResponse parsed = parseXml(body, response.status());
            if (parsed != null) {
                return parsed;
            }
        }
        return failure("HTTP " + response.status(),
                abbreviate(body.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim()));
    }

    private static ParsedResponse parseXml(String body, int httpStatus) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            Document document = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));

            String fault = firstNonBlank(text(first(document, "faultstring")), text(first(document, "faultcode")));
            if (fault != null) {
                return failure("SOAP-FAULT", fault);
            }

            Element infProt = first(document, "infProt");
            Element infEvento = first(document, "infEvento");
            Element source = infProt != null ? infProt : infEvento;
            String statusCode = firstNonBlank(
                    childText(source, "cStat"),
                    text(first(document, "cStat")));
            String message = firstNonBlank(
                    childText(source, "xMotivo"),
                    text(first(document, "xMotivo")));
            String protocol = firstNonBlank(
                    childText(source, "nProt"),
                    text(first(document, "nProt")));
            String accessKey = firstNonBlank(
                    childText(source, "chCTe"),
                    text(first(document, "chCTe")));
            String processedAt = firstNonBlank(
                    childText(source, "dhRecbto"),
                    childText(source, "dhRegEvento"),
                    text(first(document, "dhRecbto")));

            if (statusCode == null && message == null && protocol == null) {
                return null;
            }
            boolean approved = statusCode != null && APPROVED_CODES.contains(statusCode);
            boolean authorized = statusCode != null && AUTHORIZED_CODES.contains(statusCode);
            if (message == null) {
                message = httpStatus >= 400
                        ? "A SEFAZ retornou HTTP " + httpStatus + "."
                        : "A SEFAZ não informou motivo (cStat=" + statusCode + ").";
            }
            return new ParsedResponse(approved, authorized, protocol, statusCode,
                    abbreviate(message), accessKey, processedAt);
        } catch (ParserConfigurationException | SAXException | IOException e) {
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private static ParsedResponse failure(String code, String message) {
        return new ParsedResponse(false, false, null, code, abbreviate(message), null, null);
    }

    private static Element first(Document document, String localName) {
        NodeList all = document.getElementsByTagNameNS("*", localName);
        if (all.getLength() > 0) {
            return (Element) all.item(0);
        }
        NodeList any = document.getElementsByTagName(localName);
        return any.getLength() > 0 ? (Element) any.item(0) : null;
    }

    private static String childText(Element parent, String localName) {
        if (parent == null) {
            return null;
        }
        NodeList all = parent.getElementsByTagNameNS("*", localName);
        if (all.getLength() > 0) {
            return text((Element) all.item(0));
        }
        NodeList any = parent.getElementsByTagName(localName);
        return any.getLength() > 0 ? text((Element) any.item(0)) : null;
    }

    private static String text(Element element) {
        if (element == null) {
            return null;
        }
        String value = element.getTextContent();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String abbreviate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 1900 ? value : value.substring(0, 1900) + "...";
    }

    public record ParsedResponse(
            boolean success,
            boolean authorized,
            String protocolNumber,
            String statusCode,
            String message,
            String accessKey,
            String processedAt
    ) {
    }
}
