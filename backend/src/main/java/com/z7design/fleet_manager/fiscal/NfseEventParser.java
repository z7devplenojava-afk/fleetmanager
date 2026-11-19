package com.z7design.fleet_manager.fiscal;

import com.z7design.fleet_manager.dto.fiscal.NfseEventDtos.NfseEventResponse;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Interpreta a resposta da SEFIN ao registro/consulta de eventos (XML ou JSON),
 * extraindo cStat, xMotivo, nProt e o identificador do evento.
 */
public final class NfseEventParser {

    private static final Pattern JSON_STRING = Pattern.compile(
            "\"%s\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
    private static final Pattern JSON_NUMBER = Pattern.compile(
            "\"%s\"\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)");

    private NfseEventParser() {
    }

    /** Interpreta o corpo bruto devolvido pela SEFIN (XML ou JSON). */
    public static NfseEventResponse parse(String response) {
        String body = response == null ? "" : response.trim();
        if (body.isEmpty()) {
            return new NfseEventResponse(null, null, "Resposta vazia da SEFIN.", null, body, false);
        }
        if (body.startsWith("{") || body.startsWith("[")) {
            return parseJson(body);
        }
        if (body.contains("<")) {
            NfseEventResponse parsed = parseXml(body);
            if (parsed != null) {
                return parsed;
            }
        }
        return new NfseEventResponse(null, null, abbreviate(stripHtml(body), 1900), null, body, false);
    }

    /** Sobrecarga para uso direto com a resposta do cliente HTTP. */
    public static NfseEventResponse parse(NfseSefinClient.SefinResponse response) {
        if (response == null) {
            return parse((String) null);
        }
        NfseEventResponse parsed = parse(response.body());
        if (!response.success() && (parsed.status() == null || parsed.status().isBlank())) {
            String message = "HTTP " + response.status() + ": " +
                    (parsed.message() == null ? "" : parsed.message());
            return new NfseEventResponse(parsed.id(), parsed.status(), abbreviate(message.trim(), 1900),
                    parsed.protocol(), parsed.responseXml(), false);
        }
        return parsed;
    }

    private static NfseEventResponse parseXml(String body) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            Document document = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));

            String status = firstText(document,
                    "cStat", "codigo", "codStatus", "status", "codigoStatus");
            String message = firstText(document,
                    "xMotivo", "mensagem", "message", "descricao", "motivo", "detail", "faultstring");
            String protocol = firstText(document,
                    "nProt", "protocolo", "numeroProtocolo", "prot", "numProtocolo");
            String id = firstAttribute(document, "infEvento", "Id");
            if (id == null) {
                id = firstAttribute(document, "infPedReg", "Id");
            }
            if (id == null) {
                id = firstText(document, "id", "idEvento", "idPedido", "identificador");
            }
            if (status == null && message == null) {
                message = body;
            }
            return new NfseEventResponse(id, status, abbreviate(message, 1900), protocol, body);
        } catch (Exception e) {
            return null;
        }
    }

    private static NfseEventResponse parseJson(String body) {
        String status = firstJsonValue(body, "cStat", "codigo", "codStatus", "status", "codigoStatus");
        String message = firstJsonValue(body, "xMotivo", "mensagem", "message", "descricao",
                "motivo", "detail", "erro");
        String protocol = firstJsonValue(body, "nProt", "protocolo", "numeroProtocolo", "prot", "numProtocolo");
        String id = firstJsonValue(body, "id", "idEvento", "idPedido", "identificador");
        if (message == null) {
            message = body;
        }
        return new NfseEventResponse(id, status, abbreviate(message, 1900), protocol, body);
    }

    private static String firstText(Document document, String... localNames) {
        for (String name : localNames) {
            NodeList nodes = document.getElementsByTagNameNS("*", name);
            if (nodes.getLength() > 0) {
                String value = nodes.item(0).getTextContent();
                if (value != null && !value.isBlank()) {
                    return value.trim();
                }
            }
            NodeList any = document.getElementsByTagName(name);
            if (any.getLength() > 0) {
                String value = any.item(0).getTextContent();
                if (value != null && !value.isBlank()) {
                    return value.trim();
                }
            }
        }
        return null;
    }

    private static String firstAttribute(Document document, String elementName, String attribute) {
        NodeList nodes = document.getElementsByTagNameNS("*", elementName);
        for (int i = 0; i < nodes.getLength(); i++) {
            Element element = (Element) nodes.item(i);
            String value = element.getAttribute(attribute);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static String firstJsonValue(String body, String... keys) {
        for (String key : keys) {
            String value = firstMatch(Pattern.compile(String.format(JSON_STRING.pattern(), key)), body);
            if (value != null) {
                return unescapeJson(value);
            }
            value = firstMatch(Pattern.compile(String.format(JSON_NUMBER.pattern(), key)), body);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static String firstMatch(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? matcher.group(1) : null;
    }

    private static String unescapeJson(String value) {
        return value.replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
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
}
