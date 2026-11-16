package com.z7design.fleet_manager.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.BillingEvent;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.repository.BillingEventRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.security.BillingGuardFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/webhooks/billing")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhooks Financeiros", description = "Endpoints para recepção de eventos de pagamento e assinaturas (Asaas, Stripe, etc.)")
public class BillingWebhookController {

    private final BillingEventRepository billingEventRepository;
    private final CompanyRepository companyRepository;
    private final BillingGuardFilter billingGuardFilter;
    private final ObjectMapper objectMapper;

    @Value("${fluxbus.billing.webhook-secret:fluxbus_webhook_secret_2026}")
    private String configuredWebhookSecret;

    @PostMapping("/asaas")
    @Operation(summary = "Webhook do Asaas", description = "Recebe eventos de pagamento, cobrança e assinatura do Asaas")
    public ResponseEntity<?> handleAsaasWebhook(
            @RequestHeader(value = "asaas-access-token", required = false) String accessToken,
            @RequestBody String rawPayload) {

        log.info("🔔 Webhook Asaas recebido");

        // 1. Validação de token de segurança (se configurado)
        if (configuredWebhookSecret != null && !configuredWebhookSecret.isBlank()) {
            if (accessToken != null && !accessToken.equals(configuredWebhookSecret)) {
                log.warn("⚠️ Token do webhook Asaas inválido rejeitado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido"));
            }
        }

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String event = root.path("event").asText("");
            JsonNode payment = root.path("payment");
            String paymentId = payment.path("id").asText("");
            String customerId = payment.path("customer").asText("");
            double value = payment.path("value").asDouble(0.0);
            int amountCents = (int) Math.round(value * 100);

            if (event.isBlank() || paymentId.isBlank()) {
                log.warn("⚠️ Payload Asaas sem evento ou id de pagamento válido");
                return ResponseEntity.badRequest().body(Map.of("error", "Payload inválido"));
            }

            // 2. Garantir idempotência: se o evento já foi processado, responder 200 OK imediatamente
            String eventId = paymentId + "_" + event;
            Optional<BillingEvent> existingEvent = billingEventRepository.findByGatewayNameAndGatewayEventId("ASAAS", eventId);
            if (existingEvent.isPresent()) {
                log.info("ℹ️ Evento Asaas {} já processado anteriormente. Ignorando reprocessamento.", eventId);
                return ResponseEntity.ok(Map.of("status", "ALREADY_PROCESSED"));
            }

            // 3. Localizar empresa correspondente pelo gateway_customer_id
            Company company = null;
            if (!customerId.isBlank()) {
                company = companyRepository.findAll().stream()
                        .filter(c -> customerId.equalsIgnoreCase(c.getGatewayCustomerId()))
                        .findFirst()
                        .orElse(null);
            }

            // 4. Gravar evento de faturamento
            BillingEvent billingEvent = BillingEvent.builder()
                    .company(company)
                    .gatewayName("ASAAS")
                    .gatewayEventId(eventId)
                    .eventType(event)
                    .status(event)
                    .amountCents(amountCents)
                    .payload(rawPayload)
                    .build();
            billingEventRepository.save(billingEvent);

            // 5. Aplicar máquina de estados na empresa
            if (company != null) {
                switch (event) {
                    case "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED" -> {
                        company.setSubscriptionStatus("active");
                        // Renova data de vencimento em +30 dias a partir de hoje (ou do vencimento anterior se for futuro)
                        LocalDate currentDue = company.getDueDate() != null ? company.getDueDate() : LocalDate.now();
                        LocalDate newDue = currentDue.isAfter(LocalDate.now()) ? currentDue.plusMonths(1) : LocalDate.now().plusMonths(1);
                        company.setDueDate(newDue);
                        companyRepository.save(company);
                        billingGuardFilter.invalidateCompanyCache(company.getId());
                        log.info("✅ Assinatura da empresa {} reativada/renovada até {}", company.getName(), newDue);
                    }
                    case "PAYMENT_OVERDUE" -> {
                        company.setSubscriptionStatus("past_due");
                        companyRepository.save(company);
                        billingGuardFilter.invalidateCompanyCache(company.getId());
                        log.warn("⚠️ Pagamento em atraso para a empresa {}. Status definido para past_due.", company.getName());
                    }
                    case "SUBSCRIPTION_CANCELED", "PAYMENT_DELETED" -> {
                        company.setSubscriptionStatus("canceled");
                        companyRepository.save(company);
                        billingGuardFilter.invalidateCompanyCache(company.getId());
                        log.warn("🛑 Assinatura da empresa {} cancelada.", company.getName());
                    }
                    default -> log.debug("ℹ️ Evento Asaas {} registrado sem alteração direta de status.", event);
                }
            }

            return ResponseEntity.ok(Map.of("status", "SUCCESS", "event", event));
        } catch (Exception e) {
            log.error("❌ Erro ao processar webhook Asaas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro interno ao processar webhook"));
        }
    }

    @PostMapping("/manual-simulation")
    @Operation(summary = "Simulação Manual de Regularização/Bloqueio (Ambiente Administrativo)")
    public ResponseEntity<?> simulateStatusChange(
            @RequestParam UUID companyId,
            @RequestParam String newStatus,
            @RequestParam(required = false) Integer addDays) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

        company.setSubscriptionStatus(newStatus.toLowerCase());
        if (addDays != null) {
            company.setDueDate(LocalDate.now().plusDays(addDays));
        }
        companyRepository.save(company);
        billingGuardFilter.invalidateCompanyCache(companyId);

        log.info("🔧 Simulação administrativa: Empresa {} atualizada para status {} (vencimento: {})",
                company.getName(), company.getSubscriptionStatus(), company.getDueDate());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "companyName", company.getName(),
                "subscriptionStatus", company.getSubscriptionStatus(),
                "dueDate", company.getDueDate(),
                "isOverdue", company.isSubscriptionOverdue()
        ));
    }
}
