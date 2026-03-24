package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "company_id")
    private UUID companyId;
    
    @Column(name = "user_id")
    private UUID userId; // null = configuraÃ§Ãµes da empresa, nÃ£o null = configuraÃ§Ãµes do usuÃ¡rio
    
    // ConfiguraÃ§Ãµes de Email
    @Column(name = "email_enabled")
    private Boolean emailEnabled;
    
    @Column(name = "email_contract_updates")
    private Boolean emailContractUpdates;
    
    @Column(name = "email_payment_received")
    private Boolean emailPaymentReceived;
    
    @Column(name = "email_schedule_changes")
    private Boolean emailScheduleChanges;
    
    @Column(name = "email_daily_summary")
    private Boolean emailDailySummary;
    
    @Column(name = "email_weekly_report")
    private Boolean emailWeeklyReport;
    
    @Column(name = "email_system_alerts")
    private Boolean emailSystemAlerts;
    
    // ConfiguraÃ§Ãµes de SMTP
    @Column(name = "smtp_enabled")
    private Boolean smtpEnabled;
    
    @Column(name = "smtp_host")
    private String smtpHost;
    
    @Column(name = "smtp_port")
    private Integer smtpPort;
    
    @Column(name = "smtp_username")
    private String smtpUsername;
    
    @Column(name = "smtp_password")
    private String smtpPassword; // Deve ser criptografado
    
    @Column(name = "smtp_from_email")
    private String smtpFromEmail;
    
    @Column(name = "smtp_from_name")
    private String smtpFromName;
    
    @Column(name = "smtp_use_tls")
    private Boolean smtpUseTls;
    
    @Column(name = "smtp_use_ssl")
    private Boolean smtpUseSsl;
    
    // ConfiguraÃ§Ãµes de NotificaÃ§Ãµes Push
    @Column(name = "push_enabled")
    private Boolean pushEnabled;
    
    @Column(name = "push_contract_updates")
    private Boolean pushContractUpdates;
    
    @Column(name = "push_payment_received")
    private Boolean pushPaymentReceived;
    
    @Column(name = "push_schedule_changes")
    private Boolean pushScheduleChanges;
    
    @Column(name = "push_system_alerts")
    private Boolean pushSystemAlerts;
    
    // ConfiguraÃ§Ãµes de SMS
    @Column(name = "sms_enabled")
    private Boolean smsEnabled;
    
    @Column(name = "sms_urgent_only")
    private Boolean smsUrgentOnly;
    
    @Column(name = "sms_provider")
    private String smsProvider; // TWILIO, AWS_SNS, etc
    
    @Column(name = "sms_api_key")
    private String smsApiKey; // Deve ser criptografado
    
    // ConfiguraÃ§Ãµes de WhatsApp
    @Column(name = "whatsapp_enabled")
    private Boolean whatsappEnabled;
    
    @Column(name = "whatsapp_contract_updates")
    private Boolean whatsappContractUpdates;
    
    @Column(name = "whatsapp_payment_received")
    private Boolean whatsappPaymentReceived;
    
    @Column(name = "whatsapp_schedule_changes")
    private Boolean whatsappScheduleChanges;
    
    // ConfiguraÃ§Ãµes de horÃ¡rios
    @Column(name = "quiet_hours_enabled")
    private Boolean quietHoursEnabled;
    
    @Column(name = "quiet_hours_start")
    private String quietHoursStart; // HH:mm
    
    @Column(name = "quiet_hours_end")
    private String quietHoursEnd; // HH:mm
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

