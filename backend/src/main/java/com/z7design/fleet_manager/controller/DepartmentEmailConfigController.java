package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "ConfiguraÃ§Ã£o de Emails dos Departamentos", description = "API para gerenciar configuraÃ§Ãµes de email dos departamentos")
public class DepartmentEmailConfigController {

    private final EmailService emailService;

    // ConfiguraÃ§Ã£o padrÃ£o dos departamentos
    private final Map<String, String> departmentEmails = new HashMap<String, String>() {
        {
            put("operacional", "operacional@empresa.com");
            put("pessoal", "pessoal@empresa.com");
            put("rh", "rh@empresa.com");
            put("financeiro", "financeiro@empresa.com");
        }
    };

    @GetMapping("/department-emails")
    @Operation(summary = "Obter configuraÃ§Ã£o de emails dos departamentos")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','FINANCEIRO','OPERACIONAL','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH','ROLE_FINANCEIRO','ROLE_OPERACIONAL','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')")
    public ResponseEntity<Map<String, String>> getDepartmentEmails() {
        try {
            log.info("ðŸ“§ Buscando configuraÃ§Ã£o de emails dos departamentos");
            return ResponseEntity.ok(departmentEmails);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar configuraÃ§Ã£o de emails: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/department-emails")
    @Operation(summary = "Salvar configuraÃ§Ã£o de emails dos departamentos")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')")
    public ResponseEntity<Map<String, Object>> saveDepartmentEmails(@RequestBody Map<String, String> emails) {
        Map<String, Object> response = new HashMap<>();

        try {
            log.info("ðŸ’¾ Salvando configuraÃ§Ã£o de emails dos departamentos: {}", emails);

            // Validar emails
            for (Map.Entry<String, String> entry : emails.entrySet()) {
                String email = entry.getValue();
                if (email == null || email.trim().isEmpty()) {
                    response.put("sucesso", false);
                    response.put("mensagem", "Email nÃ£o pode estar vazio para o departamento: " + entry.getKey());
                    return ResponseEntity.badRequest().body(response);
                }

                // ValidaÃ§Ã£o bÃ¡sica de email
                if (!email.contains("@") || !email.contains(".")) {
                    response.put("sucesso", false);
                    response.put("mensagem", "Email invÃ¡lido para o departamento: " + entry.getKey());
                    return ResponseEntity.badRequest().body(response);
                }
            }

            // Atualizar configuraÃ§Ã£o
            departmentEmails.clear();
            departmentEmails.putAll(emails);

            response.put("sucesso", true);
            response.put("mensagem", "ConfiguraÃ§Ã£o de emails salva com sucesso");
            response.put("emails", departmentEmails);

            log.info("âœ… ConfiguraÃ§Ã£o de emails salva com sucesso");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("âŒ Erro ao salvar configuraÃ§Ã£o de emails: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao salvar configuraÃ§Ã£o: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/test-email")
    @Operation(summary = "Enviar email de teste")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestBody Map<String, String> emailData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String to = emailData.get("to");
            String subject = emailData.get("subject");
            String body = emailData.get("body");

            if (to == null || to.trim().isEmpty()) {
                response.put("sucesso", false);
                response.put("mensagem", "Email de destino Ã© obrigatÃ³rio");
                return ResponseEntity.badRequest().body(response);
            }

            log.info("ðŸ“§ Enviando email de teste para: {}", to);

            boolean emailSent = emailService.sendEmailWithAttachment(to, subject, body, null, null);

            if (emailSent) {
                response.put("sucesso", true);
                response.put("mensagem", "Email de teste enviado com sucesso");
                response.put("to", to);
                log.info("âœ… Email de teste enviado com sucesso para: {}", to);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Erro ao enviar email de teste");
                log.error("âŒ Falha ao enviar email de teste para: {}", to);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("âŒ Erro ao enviar email de teste: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao enviar email de teste: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/notify-departments")
    @Operation(summary = "Notificar todos os departamentos sobre novo contrato")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_COMPANY_ADMIN','ROLE_FLEX_ADMIN')")
    public ResponseEntity<Map<String, Object>> notifyDepartments(@RequestBody Map<String, Object> contractData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String cliente = (String) contractData.get("cliente");
            String contrato = (String) contractData.get("contrato");
            Double valor = (Double) contractData.get("valor");
            String dataInicio = (String) contractData.get("dataInicio");
            String dataFim = (String) contractData.get("dataFim");

            log.info("ðŸ“¢ Notificando departamentos sobre novo contrato: {} - {}", cliente, contrato);

            int emailsEnviados = 0;
            int emailsFalharam = 0;

            for (Map.Entry<String, String> entry : departmentEmails.entrySet()) {
                String departamento = entry.getKey();
                String email = entry.getValue();

                try {
                    String subject = String.format("Novo Contrato - %s", cliente);
                    String body = String.format("""
                            <h2>Novo Contrato Registrado</h2>
                            <p><strong>Cliente:</strong> %s</p>
                            <p><strong>Contrato:</strong> %s</p>
                            <p><strong>Valor:</strong> R$ %.2f</p>
                            <p><strong>Data de InÃ­cio:</strong> %s</p>
                            <p><strong>Data de Fim:</strong> %s</p>
                            <p><strong>Departamento:</strong> %s</p>

                            <p>Este Ã© um alerta automÃ¡tico do sistema FluxBus.</p>
                            """, cliente, contrato, valor, dataInicio, dataFim, departamento);

                    boolean enviado = emailService.sendEmailWithAttachment(email, subject, body, null, null);
                    if (enviado) {
                        emailsEnviados++;
                        log.info("âœ… Email enviado para {} ({})", departamento, email);
                    } else {
                        emailsFalharam++;
                        log.error("âŒ Falha ao enviar email para {} ({})", departamento, email);
                    }
                } catch (Exception e) {
                    emailsFalharam++;
                    log.error("âŒ Erro ao enviar email para {} ({}): {}", departamento, email, e.getMessage());
                }
            }

            response.put("sucesso", emailsEnviados > 0);
            response.put("mensagem",
                    String.format("Emails enviados: %d, Falharam: %d", emailsEnviados, emailsFalharam));
            response.put("emailsEnviados", emailsEnviados);
            response.put("emailsFalharam", emailsFalharam);

            log.info("ðŸ“Š Resultado da notificaÃ§Ã£o: {} enviados, {} falharam", emailsEnviados, emailsFalharam);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("âŒ Erro ao notificar departamentos: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao notificar departamentos: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
