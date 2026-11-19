package com.z7design.fleet_manager.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Cliente da API SEFIN Nacional (emissão/consulta de NFS-e) com autenticação mTLS
 * pelo certificado A1 da empresa.
 */
@Component
@Slf4j
public class NfseSefinClient {

    private final String homologationUrl;
    private final String productionUrl;
    private final String eventoPath;
    private final Duration timeout;

    /** Construtor mantido para compatibilidade (usa o caminho padrão /eventos). */
    public NfseSefinClient(String homologationUrl, String productionUrl, long timeoutSeconds) {
        this(homologationUrl, productionUrl, "/eventos", timeoutSeconds);
    }

    @Autowired
    public NfseSefinClient(
            @Value("${fiscal.nfse.sefin-url-homologacao:https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional}")
            String homologationUrl,
            @Value("${fiscal.nfse.sefin-url-producao:https://sefin.nfse.gov.br/SefinNacional}")
            String productionUrl,
            @Value("${fiscal.nfse.evento-path:/eventos}") String eventoPath,
            @Value("${fiscal.nfse.timeout-seconds:90}") long timeoutSeconds) {
        this.homologationUrl = stripTrailingSlash(homologationUrl);
        this.productionUrl = stripTrailingSlash(productionUrl);
        this.eventoPath = normalizeEventPath(eventoPath);
        this.timeout = Duration.ofSeconds(timeoutSeconds);
    }

    public SefinResponse enviarDps(String xml, FiscalCertificateMaterial material, String environment) {
        HttpClient client = client(material);
        HttpRequest request = HttpRequest.newBuilder(path(environment, "/nfse"))
                .timeout(timeout)
                .header("Content-Type", "application/xml; charset=UTF-8")
                .header("Accept", "application/xml, application/json, text/plain")
                .POST(HttpRequest.BodyPublishers.ofString(xml, StandardCharsets.UTF_8))
                .build();
        return send(client, request);
    }

    public SefinResponse consultarNfse(String chave, FiscalCertificateMaterial material, String environment) {
        HttpClient client = client(material);
        HttpRequest request = HttpRequest.newBuilder(path(environment, "/nfse/" + chave))
                .timeout(timeout)
                .header("Accept", "application/xml, application/json, text/plain")
                .GET()
                .build();
        return send(client, request);
    }

    public SefinResponse consultarDps(String dpsId, FiscalCertificateMaterial material, String environment) {
        HttpClient client = client(material);
        HttpRequest request = HttpRequest.newBuilder(path(environment, "/dps/" + dpsId))
                .timeout(timeout)
                .header("Accept", "application/xml, application/json, text/plain")
                .GET()
                .build();
        return send(client, request);
    }

    /** Registra um evento (por exemplo, cancelamento) na SEFIN Nacional. */
    public SefinResponse enviarEvento(String xml, FiscalCertificateMaterial material, String environment) {
        HttpClient client = client(material);
        HttpRequest request = HttpRequest.newBuilder(eventPath(environment))
                .timeout(timeout)
                .header("Content-Type", "application/xml; charset=UTF-8")
                .header("Accept", "application/xml, application/json, text/plain")
                .POST(HttpRequest.BodyPublishers.ofString(xml, StandardCharsets.UTF_8))
                .build();
        return send(client, request);
    }

    /** Consulta um evento já registrado pelo identificador do pedido/evento. */
    public SefinResponse consultarEvento(String id, FiscalCertificateMaterial material, String environment) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Informe o identificador do evento a consultar.");
        }
        HttpClient client = client(material);
        HttpRequest request = HttpRequest.newBuilder(
                URI.create(eventPath(environment) + "/" + id.trim()))
                .timeout(timeout)
                .header("Accept", "application/xml, application/json, text/plain")
                .GET()
                .build();
        return send(client, request);
    }

    private HttpClient client(FiscalCertificateMaterial material) {
        return HttpClient.newBuilder()
                .sslContext(material.sslContext())
                .connectTimeout(Duration.ofSeconds(20))
                .version(HttpClient.Version.HTTP_1_1)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    private SefinResponse send(HttpClient client, HttpRequest request) {
        try {
            HttpResponse<String> response = client.send(request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            log.info("SEFIN {} {} -> HTTP {}", request.method(), request.uri(), response.statusCode());
            if (response.statusCode() >= 400) {
                log.warn("Resposta SEFIN (HTTP {}): {}", response.statusCode(), abbreviate(response.body()));
            }
            return new SefinResponse(response.statusCode(),
                    response.headers().firstValue("Content-Type").orElse(""),
                    response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Consulta à SEFIN interrompida.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Falha de comunicação com a SEFIN Nacional: " + e.getMessage(), e);
        }
    }

    private URI path(String environment, String suffix) {
        String base = "1".equals(environment) ? productionUrl : homologationUrl;
        return URI.create(base + suffix);
    }

    private URI eventPath(String environment) {
        if (eventoPath == null || eventoPath.isBlank()) {
            throw new IllegalStateException(
                    "Caminho do recurso de eventos da SEFIN não configurado. "
                            + "Defina a propriedade fiscal.nfse.evento-path (por exemplo: /eventos).");
        }
        String base = "1".equals(environment) ? productionUrl : homologationUrl;
        return URI.create(base + eventoPath);
    }

    private static String normalizeEventPath(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String path = value.trim();
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return stripTrailingSlash(path);
    }

    private static String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static String abbreviate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 2000 ? value : value.substring(0, 2000) + "...";
    }

    public record SefinResponse(int status, String contentType, String body) {
        public boolean success() {
            return status >= 200 && status < 300;
        }
    }
}
