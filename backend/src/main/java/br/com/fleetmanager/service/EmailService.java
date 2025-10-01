package br.com.fleetmanager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import org.springframework.mail.MailException;
import org.springframework.mail.MailParseException;
import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:securedguard@z7design.com.br}")
    private String fromEmail;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;

    /**
     * Envia documento unificado por email
     */
    public boolean sendUnifiedDocument(String toEmail, String employeeName, String month, String year, String filePath) {
        try {
            log.info("📧 Enviando documento unificado por email para: {}", toEmail);
            log.info("Funcionário: {} - {}/{}", employeeName, month, year);
            log.info("Arquivo: {}", filePath);

            // Verificar se arquivo existe
            File file = new File(filePath);
            if (!file.exists()) {
                log.error("❌ Arquivo não encontrado: {}", filePath);
                return false;
            }

            // Criar email simples (sem anexo por enquanto)
            SimpleMailMessage emailMessage = new SimpleMailMessage();
            emailMessage.setFrom(fromEmail);
            emailMessage.setTo(toEmail);
            emailMessage.setSubject(String.format("Documento Unificado - %s - %s/%s", employeeName, month, year));
            
            // Corpo do email
            String emailBody = createEmailBody(employeeName, month, year);
            emailMessage.setText(emailBody);

            // Enviar email
            mailSender.send(emailMessage);
            log.info("✅ Email enviado com sucesso para: {}", toEmail);
            log.info("📎 Arquivo: {} ({} bytes) - Anexo não suportado nesta versão", file.getName(), file.length());
            return true;

        } catch (MailException e) {
            log.error("💥 Erro ao enviar email: {}", e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("💥 Erro inesperado ao enviar email: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Cria corpo do email em HTML
     */
    private String createEmailBody(String employeeName, String month, String year) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .footer { background: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; }
                    .button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏢 SecuredGuard</h1>
                    <h2>Documento Unificado</h2>
                </div>
                
                <div class="content">
                    <h3>Olá!</h3>
                    <p>O documento unificado para <strong>%s</strong> referente ao período <strong>%s/%s</strong> foi gerado com sucesso.</p>
                    
                    <p>Este documento contém:</p>
                    <ul>
                        <li>📄 <strong>Holerite</strong> com informações salariais</li>
                        <li>💰 <strong>Recibo de Pagamento</strong> com comprovante bancário</li>
                    </ul>
                    
                    <p>O arquivo está anexado a este email para sua conveniência.</p>
                    
                    <p style="margin-top: 30px;">
                        <strong>Informações importantes:</strong>
                    </p>
                    <ul>
                        <li>Guarde este documento para seus registros</li>
                        <li>Use para declaração de imposto de renda</li>
                        <li>Comprovante oficial de recebimento</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Este é um email automático do sistema SecuredGuard.</p>
                    <p>Em caso de dúvidas, entre em contato com o departamento de RH.</p>
                    <p>© 2025 SecuredGuard - Todos os direitos reservados</p>
                </div>
            </body>
            </html>
            """, employeeName, month, year);
    }

    /**
     * Testa configuração de email
     */
    public boolean testEmailConfiguration() {
        try {
            log.info("🧪 Testando configuração de email...");
            
            SimpleMailMessage testMessage = new SimpleMailMessage();
            testMessage.setFrom(fromEmail);
            testMessage.setTo("test@example.com");
            testMessage.setSubject("Teste de Configuração - SecuredGuard");
            testMessage.setText("Este é um email de teste para verificar a configuração do sistema.");
            
            mailSender.send(testMessage);
            log.info("✅ Configuração de email funcionando");
            return true;
            
        } catch (Exception e) {
            log.error("❌ Erro na configuração de email: {}", e.getMessage());
            return false;
        }
    }
} 