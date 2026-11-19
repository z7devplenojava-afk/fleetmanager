package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Cliente SOAP para WebServices da SEFAZ (CT-e/NF-e) com autenticação mTLS por certificado A1.
 * Os endpoints são configuráveis por UF/ambiente — a SEFAZ exige que o contribuinte use o
 * WebService da sua jurisdição (SVRS, SVAN, SVC-AN, etc.).
 */
@Component
@Slf4j
public class SefazSoapClient {

    public record SoapResponse(int status, String contentType, String body) {
        public boolean success() {
            return status >= 200 && status < 300;
        }
    }

    /**
     * @param soap12 true usa SOAP 1.2 (application/soap+xml, action no Content-Type);
     *               false usa SOAP 1.1 (text/xml + cabeçalho SOAPAction).
     */
    public SoapResponse send(String url, String action, String envelope,
                             FiscalCertificateMaterial material, Duration timeout, boolean soap12) {
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "Endpoint da SEFAZ não configurado. Defina a URL do WebService para a UF e o ambiente.");
        }
        HttpClient client = HttpClient.newBuilder()
                .sslContext(material.sslContext())
                .connectTimeout(Duration.ofSeconds(20))
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url.trim()))
                .timeout(timeout)
                .POST(HttpRequest.BodyPublishers.ofString(envelope, StandardCharsets.UTF_8));
        if (soap12) {
            String ct = "application/soap+xml; charset=UTF-8";
            if (action != null && !action.isBlank()) {
                ct += "; action=\"" + action + "\"";
            }
            builder.header("Content-Type", ct);
        } else {
            builder.header("Content-Type", "text/xml; charset=UTF-8");
            if (action != null && !action.isBlank()) {
                builder.header("SOAPAction", "\"" + action + "\"");
            }
        }
        try {
            HttpResponse<String> response = client.send(builder.build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            log.info("SEFAZ SOAP {} -> HTTP {}", url, response.statusCode());
            if (response.statusCode() >= 400) {
                log.warn("Resposta SEFAZ (HTTP {}): {}", response.statusCode(), abbreviate(response.body()));
            }
            return new SoapResponse(response.statusCode(),
                    response.headers().firstValue("Content-Type").orElse(""), response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Comunicação com a SEFAZ interrompida.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Falha de comunicação com a SEFAZ: " + e.getMessage(), e);
        }
    }

    /** Envelopa o XML do documento/consulta no envelope SOAP 1.2 padrão da SEFAZ. */
    public static String envelope(String body) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\">"
                + "<soap:Header/>"
                + "<soap:Body>" + body + "</soap:Body>"
                + "</soap:Envelope>";
    }

    private static String abbreviate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 2000 ? value : value.substring(0, 2000) + "...";
    }
}
