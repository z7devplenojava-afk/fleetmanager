package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDTO {
    
    private String id;
    private String companyId;
    private String userId;
    
    // ConfiguraÃ§Ãµes de Email
    @NotNull(message = "Email habilitado Ã© obrigatÃ³rio")
    private Boolean emailEnabled;
    
    @NotNull(message = "NotificaÃ§Ã£o de contratos Ã© obrigatÃ³ria")
    private Boolean emailContractUpdates;
    
    @NotNull(message = "NotificaÃ§Ã£o de pagamentos Ã© obrigatÃ³ria")
    private Boolean emailPaymentReceived;
    
    @NotNull(message = "NotificaÃ§Ã£o de escalas Ã© obrigatÃ³ria")
    private Boolean emailScheduleChanges;
    
    @NotNull(message = "Resumo diÃ¡rio Ã© obrigatÃ³rio")
    private Boolean emailDailySummary;
    
    @NotNull(message = "RelatÃ³rio semanal Ã© obrigatÃ³rio")
    private Boolean emailWeeklyReport;
    
    @NotNull(message = "Alertas do sistema sÃ£o obrigatÃ³rios")
    private Boolean emailSystemAlerts;
    
    // ConfiguraÃ§Ãµes de SMTP
    @NotNull(message = "SMTP habilitado Ã© obrigatÃ³rio")
    private Boolean smtpEnabled;
    
    private String smtpHost;
    
    @Min(value = 1, message = "Porta SMTP deve ser maior que 0")
    @Max(value = 65535, message = "Porta SMTP deve ser menor que 65536")
    private Integer smtpPort;
    
    private String smtpUsername;
    
    private String smtpPassword;
    
    @Email(message = "Email de origem invÃ¡lido")
    private String smtpFromEmail;
    
    private String smtpFromName;
    
    @NotNull(message = "TLS Ã© obrigatÃ³rio")
    private Boolean smtpUseTls;
    
    @NotNull(message = "SSL Ã© obrigatÃ³rio")
    private Boolean smtpUseSsl;
    
    // ConfiguraÃ§Ãµes de NotificaÃ§Ãµes Push
    @NotNull(message = "Push habilitado Ã© obrigatÃ³rio")
    private Boolean pushEnabled;
    
    @NotNull(message = "Push de contratos Ã© obrigatÃ³rio")
    private Boolean pushContractUpdates;
    
    @NotNull(message = "Push de pagamentos Ã© obrigatÃ³rio")
    private Boolean pushPaymentReceived;
    
    @NotNull(message = "Push de escalas Ã© obrigatÃ³rio")
    private Boolean pushScheduleChanges;
    
    @NotNull(message = "Push de alertas Ã© obrigatÃ³rio")
    private Boolean pushSystemAlerts;
    
    // ConfiguraÃ§Ãµes de SMS
    @NotNull(message = "SMS habilitado Ã© obrigatÃ³rio")
    private Boolean smsEnabled;
    
    @NotNull(message = "SMS urgente Ã© obrigatÃ³rio")
    private Boolean smsUrgentOnly;
    
    private String smsProvider;
    private String smsApiKey;
    
    // ConfiguraÃ§Ãµes de WhatsApp
    @NotNull(message = "WhatsApp habilitado Ã© obrigatÃ³rio")
    private Boolean whatsappEnabled;
    
    @NotNull(message = "WhatsApp contratos Ã© obrigatÃ³rio")
    private Boolean whatsappContractUpdates;
    
    @NotNull(message = "WhatsApp pagamentos Ã© obrigatÃ³rio")
    private Boolean whatsappPaymentReceived;
    
    @NotNull(message = "WhatsApp escalas Ã© obrigatÃ³rio")
    private Boolean whatsappScheduleChanges;
    
    // ConfiguraÃ§Ãµes de horÃ¡rios
    @NotNull(message = "HorÃ¡rio silencioso Ã© obrigatÃ³rio")
    private Boolean quietHoursEnabled;
    
    private String quietHoursStart;
    private String quietHoursEnd;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

