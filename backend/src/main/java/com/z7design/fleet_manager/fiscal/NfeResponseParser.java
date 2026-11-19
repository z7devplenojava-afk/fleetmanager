package com.z7design.fleet_manager.fiscal;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Extrai o protocolo (protNFe/infProt) e o retorno de eventos (retEvento/infEvento)
 * das respostas SOAP da SEFAZ. Não depende do prefixo used no envelope.
 */
public final class NfeResponseParser {

    private static final List<String> EVENT_SUCCESS_CODES =
            List.of("135", "136", "137", "143", "153", "155", "170");

    private NfeResponseParser() {
    }

    public static ParsedResponse parse(SefazSoapClient.SoapResponse response) {
        String body = response == null || response.body() == null ? "" : response.body().trim();
        int httpStatus = response == null ? 0 : response.status();

        if (body.startsWith("<")) {
            ParsedResponse parsed = parseXml(body, httpStatus);
            if (parsed != null) {
                return parsed;
            }
        }
        String message = body.isBlank() ? "Resposta vazia da SEFAZ."
                : "HTTP " + httpStatus + ": " + abbreviate(stripHtml(body), 1900);
        return new ParsedResponse(false, false, null, null, null, null,
                "HTTP " + httpStatus, abbreviate(message, 1900));
    }

    private static ParsedResponse parseXml(String body, int httpStatus) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            Document document = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));

            Element infProt = first(document, "infProt");
            Element infEvento = first(document, "infEvento");
            Element target = infProt != null ? infProt : infEvento;
            if (target == null) {
                String fault = firstNonBlank(text(first(document, "faultstring")), text(first(document, "faultcode")));
                if (fault == null) {
                    fault = text(first(document, "xMotivo"));
                }
                if (fault == null) {
                    return null;
                }
                return new ParsedResponse(false, false, null, null, null, null,
                        "SOAP-FAULT", abbreviate(fault, 1900));
            }

            String statusCode = text(child(target, "cStat"));
            String protocol = firstNonBlank(text(child(target, "nProt")), text(child(target, "nRec")));
            String message = text(child(target, "xMotivo"));
            String accessKey = text(child(target, "chNFe"));
            String tpEvento = text(child(target, "tpEvento"));

            boolean processing = "101".equals(statusCode);
            boolean authorized = "100".equals(statusCode)
                    || (statusCode != null && statusCode.startsWith("1")
                    && (infEvento != null && "111111".equals(tpEvento) || protocol != null && !protocol.isBlank()));
            if (infEvento != null && statusCode != null && EVENT_SUCCESS_CODES.contains(statusCode)) {
                authorized = true;
            }
            boolean success = authorized || processing;
            String rejectionCode = success ? null : statusCode;
            String rejectionMessage = success ? null
                    : firstNonBlank(message, "A SEFAZ não autorizou o documento (HTTP " + httpStatus + ").");
            return new ParsedResponse(success, processing, protocol, statusCode, message, accessKey,
                    rejectionCode, rejectionMessage);
        } catch (Exception e) {
            return null;
        }
    }

    private static Element first(Document document, String localName) {
        NodeList all = document.getElementsByTagNameNS("*", localName);
        if (all.getLength() > 0) {
            return (Element) all.item(0);
        }
        NodeList any = document.getElementsByTagName(localName);
        return any.getLength() > 0 ? (Element) any.item(0) : null;
    }

    private static Element child(Element parent, String localName) {
        NodeList nodes = parent.getElementsByTagNameNS("*", localName);
        return nodes.getLength() > 0 ? (Element) nodes.item(0) : null;
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
                return value.trim();
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

    public record ParsedResponse(
            boolean success,
            boolean processing,
            String protocolNumber,
            String statusCode,
            String message,
            String accessKey,
            String rejectionCode,
            String rejectionMessage
    ) {
    }
}
