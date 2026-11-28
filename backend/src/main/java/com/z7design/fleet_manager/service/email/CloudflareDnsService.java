package com.z7design.fleet_manager.service.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

/**
 * Garante os registros DNS da zone no Cloudflare. Requer token com permissão
 * Zone:DNS:Edit e o zone_id do domínio. Registros de e-mail são SEMPRE
 * "DNS only" (proxied=false) — Cloudflare não faz proxy de SMTP/IMAP.
 *
 * Observação: o PTR reverso é configurado no provedor da VPS, não aqui.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudflareDnsService {

    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${app.cloudflare.enabled:false}")
    private boolean enabled;

    @Value("${app.cloudflare.api-token:}")
    private String apiToken;

    @Value("${app.cloudflare.zone-id:}")
    private String zoneId;

    @Value("${app.mail.host:mail.fluxbus.com.br}")
    private String mailHost;

    @Value("${app.mail.server-ip:}")
    private String serverIp;

    private static final String API = "https://api.cloudflare.com/client/v4/zones/";

    private RestTemplate client() {
        return restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(20))
                .additionalInterceptors((request, body, execution) -> {
                    request.getHeaders().set(HttpHeaders.AUTHORIZATION, "Bearer " + apiToken);
                    request.getHeaders().set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                    return execution.execute(request, body);
                })
                .build();
    }

    private void assertEnabled() {
        if (!enabled || apiToken.isBlank() || zoneId.isBlank()) {
            throw new IllegalStateException(
                    "DNS automático não habilitado. Configure app.cloudflare.enabled/api-token/zone-id.");
        }
    }

    /** Cria ou atualiza um registro, de forma idempotente. */
    @SuppressWarnings("unchecked")
    private void upsert(String type, String name, String content, Integer priority) {
        assertEnabled();
        String url = API + zoneId + "/dns_records";
        try {
            RestTemplate http = client();
            Map<String, Object> query = new HashMap<>();
            query.put("type", type);
            query.put("name", name);
            ResponseEntity<Map> existing = http.exchange(
                    url + "?type={type}&name={name}", HttpMethod.GET, HttpEntity.EMPTY, Map.class, query);
            List<Map<String, Object>> result = (List<Map<String, Object>>) existing.getBody().get("result");

            Map<String, Object> record = new HashMap<>();
            record.put("type", type);
            record.put("name", name);
            record.put("content", content);
            record.put("ttl", 1);
            record.put("proxied", false);
            if (priority != null) record.put("priority", priority);

            if (result != null && !result.isEmpty()) {
                String id = String.valueOf(result.get(0).get("id"));
                http.exchange(url + "/" + id, HttpMethod.PUT, new HttpEntity<>(record), Map.class);
                log.info("DNS Cloudflare atualizado: {} {} -> {}", type, name, content);
            } else {
                http.postForEntity(url, record, Map.class);
                log.info("DNS Cloudflare criado: {} {} -> {}", type, name, content);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao configurar DNS " + name + ": " + e.getMessage(), e);
        }
    }

    /** Garante A(mail), MX, CNAMEs de IMAP/SMTP, SPF, DKIM e DMARC. */
    public void ensureMailRecords(String domain, Map<String, String> dkim) {
        assertEnabled();
        if (serverIp == null || serverIp.isBlank()) {
            throw new IllegalStateException("app.mail.server-ip não configurado (IP da VPS).");
        }
        upsert("A", mailHost, serverIp, null);
        upsert("MX", domain, mailHost, 10);
        upsert("CNAME", "imap." + domain, mailHost, null);
        upsert("CNAME", "smtp." + domain, mailHost, null);
        upsert("CNAME", "autoconfig." + domain, mailHost, null);
        upsert("CNAME", "autodiscover." + domain, mailHost, null);
        upsert("TXT", domain, "v=spf1 a mx ip4:" + serverIp + " ~all", null);
        upsert("TXT", "_dmarc." + domain,
                "v=DMARC1; p=none; rua=mailto:dpo@" + domain + "; pct=100", null);
        if (dkim != null && dkim.containsKey("selector") && dkim.containsKey("value")) {
            upsert("TXT", dkim.get("selector") + "._domainkey." + domain, dkim.get("value"), null);
        } else {
            log.warn("DKIM não retornado pelo Mailcow; copie o registro manualmente para o Cloudflare.");
        }
    }
}
