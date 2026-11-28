package com.z7design.fleet_manager.service.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Cliente da API admin do Mailcow (VPS) para criação de domínios e caixas.
 * Desabilitado por padrão: defina app.mailcow.enabled=true, url e api-token.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailcowProvisioningService {

    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${app.mailcow.enabled:false}")
    private boolean enabled;

    @Value("${app.mailcow.url:}")
    private String baseUrl;

    @Value("${app.mailcow.api-token:}")
    private String apiToken;

    @Value("${app.mailcow.default-quota-mb:1024}")
    private int defaultQuotaMb;

    private RestTemplate client() {
        return restTemplateBuilder
                .setConnectTimeout(java.time.Duration.ofSeconds(10))
                .setReadTimeout(java.time.Duration.ofSeconds(20))
                .additionalInterceptors((request, body, execution) -> {
                    request.getHeaders().set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                    request.getHeaders().set("X-API-Key", apiToken);
                    return execution.execute(request, body);
                })
                .build();
    }

    private void assertEnabled() {
        if (!enabled || baseUrl == null || baseUrl.isBlank() || apiToken == null || apiToken.isBlank()) {
            throw new IllegalStateException(
                    "Provisionamento de caixas não habilitado. Configure app.mailcow.enabled/url/api-token na VPS.");
        }
    }

    /** Garante que o domínio existe no Mailcow (idempotente). */
    public void ensureDomain(String domain) {
        assertEnabled();
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("domain", domain);
            body.put("description", "Domínio corporativo provisionado pelo FleetManager");
            ResponseEntity<String> res = client().postForEntity(baseUrl + "/api/v1/add/domain", body, String.class);
            log.info("Mailcow add/domain {}: {}", domain, res.getStatusCode());
        } catch (HttpClientErrorException e) {
            // 409/400 quando o domínio já existe — aceitável.
            if (e.getStatusCode() == HttpStatus.CONFLICT || e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                log.debug("Domínio {} já existe no Mailcow", domain);
            } else {
                throw new IllegalStateException("Falha ao garantir domínio no Mailcow: " + e.getMessage(), e);
            }
        }
    }

    /** Cria a caixa no Mailcow. */
    public void createMailbox(String domain, String localPart, String displayName, String password, Integer quotaMb) {
        assertEnabled();
        Map<String, Object> body = new HashMap<>();
        body.put("domain", domain);
        body.put("local_part", localPart);
        body.put("name", displayName != null ? displayName : localPart);
        body.put("password", password);
        body.put("quota", quotaMb != null && quotaMb > 0 ? quotaMb : defaultQuotaMb);
        try {
            ResponseEntity<String> res = client().postForEntity(baseUrl + "/api/v1/add/mailbox", body, String.class);
            log.info("Mailcow add/mailbox {}@{}: {}", localPart, domain, res.getStatusCode());
        } catch (HttpClientErrorException e) {
            throw new IllegalStateException("Falha ao criar caixa no Mailcow: " + e.getMessage(), e);
        }
    }

    /** Retorna o registro DKIM gerado pelo Mailcow para o domínio. */
    public Map<String, String> getDkimRecord(String domain) {
        assertEnabled();
        try {
            ResponseEntity<Map[]> res = client().getForEntity(
                    baseUrl + "/api/v1/get/dkim/" + domain, Map[].class);
            Map[] arr = res.getBody();
            if (arr != null && arr.length > 0) {
                Map<String, Object> first = arr[0];
                Map<String, String> result = new HashMap<>();
                Object selector = first.get("selector");
                Object dkim = first.containsKey("dkim") ? first.get("dkim") : first.get("public_key");
                if (selector != null) result.put("selector", String.valueOf(selector));
                if (dkim != null) result.put("value", String.valueOf(dkim));
                return result;
            }
        } catch (Exception e) {
            log.warn("Não foi possível obter DKIM do Mailcow para {}: {}", domain, e.getMessage());
        }
        return Map.of();
    }
}
