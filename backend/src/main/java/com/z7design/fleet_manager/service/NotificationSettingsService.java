package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.NotificationSettingsDTO;
import com.z7design.fleet_manager.model.NotificationSettings;
import com.z7design.fleet_manager.repository.NotificationSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationSettingsService {
    
    private final NotificationSettingsRepository notificationSettingsRepository;
    
    public NotificationSettingsDTO getCompanyNotificationSettings(UUID companyId) {
        log.info("Buscando configuraÃ§Ãµes de notificaÃ§Ã£o para empresa: {}", companyId);
        
        Optional<NotificationSettings> settings = notificationSettingsRepository.findByCompanyIdAndUserIdIsNull(companyId);
        
        if (settings.isPresent()) {
            return convertToDTO(settings.get());
        } else {
            // Retornar configuraÃ§Ãµes padrÃ£o se nÃ£o existir
            return getDefaultNotificationSettings(companyId);
        }
    }
    
    public NotificationSettingsDTO getUserNotificationSettings(UUID companyId, UUID userId) {
        log.info("Buscando configuraÃ§Ãµes de notificaÃ§Ã£o para usuÃ¡rio: {} da empresa: {}", userId, companyId);
        
        Optional<NotificationSettings> settings = notificationSettingsRepository.findByCompanyIdAndUserId(companyId, userId);
        
        if (settings.isPresent()) {
            return convertToDTO(settings.get());
        } else {
            // Retornar configuraÃ§Ãµes padrÃ£o da empresa
            return getCompanyNotificationSettings(companyId);
        }
    }
    
    public NotificationSettingsDTO createNotificationSettings(NotificationSettingsDTO dto) {
        log.info("Criando configuraÃ§Ãµes de notificaÃ§Ã£o para empresa: {}", dto.getCompanyId());
        
        NotificationSettings settings = convertToEntity(dto);
        NotificationSettings savedSettings = notificationSettingsRepository.save(settings);
        
        log.info("ConfiguraÃ§Ãµes de notificaÃ§Ã£o criadas com ID: {}", savedSettings.getId());
        return convertToDTO(savedSettings);
    }
    
    public NotificationSettingsDTO updateCompanyNotificationSettings(UUID companyId, NotificationSettingsDTO dto) {
        log.info("Atualizando configuraÃ§Ãµes de notificaÃ§Ã£o para empresa: {}", companyId);
        
        Optional<NotificationSettings> existingSettings = notificationSettingsRepository.findByCompanyIdAndUserIdIsNull(companyId);
        
        if (existingSettings.isPresent()) {
            NotificationSettings settings = existingSettings.get();
            updateEntityFromDTO(settings, dto);
            NotificationSettings savedSettings = notificationSettingsRepository.save(settings);
            
            log.info("ConfiguraÃ§Ãµes de notificaÃ§Ã£o atualizadas com ID: {}", savedSettings.getId());
            return convertToDTO(savedSettings);
        } else {
            // Criar novas configuraÃ§Ãµes se nÃ£o existir
            dto.setCompanyId(companyId.toString());
            dto.setUserId(null);
            return createNotificationSettings(dto);
        }
    }
    
    public NotificationSettingsDTO updateUserNotificationSettings(UUID companyId, UUID userId, NotificationSettingsDTO dto) {
        log.info("Atualizando configuraÃ§Ãµes de notificaÃ§Ã£o para usuÃ¡rio: {} da empresa: {}", userId, companyId);
        
        Optional<NotificationSettings> existingSettings = notificationSettingsRepository.findByCompanyIdAndUserId(companyId, userId);
        
        if (existingSettings.isPresent()) {
            NotificationSettings settings = existingSettings.get();
            updateEntityFromDTO(settings, dto);
            NotificationSettings savedSettings = notificationSettingsRepository.save(settings);
            
            log.info("ConfiguraÃ§Ãµes de notificaÃ§Ã£o do usuÃ¡rio atualizadas com ID: {}", savedSettings.getId());
            return convertToDTO(savedSettings);
        } else {
            // Criar novas configuraÃ§Ãµes se nÃ£o existir
            dto.setCompanyId(companyId.toString());
            dto.setUserId(userId.toString());
            return createNotificationSettings(dto);
        }
    }
    
    public void deleteNotificationSettings(UUID companyId) {
        log.info("Deletando configuraÃ§Ãµes de notificaÃ§Ã£o para empresa: {}", companyId);
        
        Optional<NotificationSettings> settings = notificationSettingsRepository.findByCompanyIdAndUserIdIsNull(companyId);
        if (settings.isPresent()) {
            notificationSettingsRepository.delete(settings.get());
            log.info("ConfiguraÃ§Ãµes de notificaÃ§Ã£o deletadas para empresa: {}", companyId);
        }
    }
    
    public List<NotificationSettingsDTO> getAllNotificationSettings() {
        log.info("Buscando todas as configuraÃ§Ãµes de notificaÃ§Ã£o");
        
        List<NotificationSettings> settings = notificationSettingsRepository.findAll();
        return settings.stream()
                .map(this::convertToDTO)
                .toList();
    }
    
    private NotificationSettingsDTO getDefaultNotificationSettings(UUID companyId) {
        return NotificationSettingsDTO.builder()
                .companyId(companyId.toString())
                .emailEnabled(true)
                .emailContractUpdates(true)
                .emailPaymentReceived(true)
                .emailScheduleChanges(true)
                .emailDailySummary(false)
                .emailWeeklyReport(false)
                .emailSystemAlerts(true)
                .smtpEnabled(false)
                .smtpHost("smtp.gmail.com")
                .smtpPort(587)
                .smtpUseTls(true)
                .smtpUseSsl(false)
                .pushEnabled(false)
                .pushContractUpdates(true)
                .pushPaymentReceived(true)
                .pushScheduleChanges(true)
                .pushSystemAlerts(true)
                .smsEnabled(false)
                .smsUrgentOnly(true)
                .whatsappEnabled(false)
                .whatsappContractUpdates(true)
                .whatsappPaymentReceived(true)
                .whatsappScheduleChanges(true)
                .quietHoursEnabled(false)
                .quietHoursStart("22:00")
                .quietHoursEnd("08:00")
                .build();
    }
    
    private NotificationSettingsDTO convertToDTO(NotificationSettings settings) {
        return NotificationSettingsDTO.builder()
                .id(settings.getId().toString())
                .companyId(settings.getCompanyId().toString())
                .userId(settings.getUserId() != null ? settings.getUserId().toString() : null)
                .emailEnabled(settings.getEmailEnabled())
                .emailContractUpdates(settings.getEmailContractUpdates())
                .emailPaymentReceived(settings.getEmailPaymentReceived())
                .emailScheduleChanges(settings.getEmailScheduleChanges())
                .emailDailySummary(settings.getEmailDailySummary())
                .emailWeeklyReport(settings.getEmailWeeklyReport())
                .emailSystemAlerts(settings.getEmailSystemAlerts())
                .smtpEnabled(settings.getSmtpEnabled())
                .smtpHost(settings.getSmtpHost())
                .smtpPort(settings.getSmtpPort())
                .smtpUsername(settings.getSmtpUsername())
                .smtpPassword(settings.getSmtpPassword()) // TODO: Descriptografar
                .smtpFromEmail(settings.getSmtpFromEmail())
                .smtpFromName(settings.getSmtpFromName())
                .smtpUseTls(settings.getSmtpUseTls())
                .smtpUseSsl(settings.getSmtpUseSsl())
                .pushEnabled(settings.getPushEnabled())
                .pushContractUpdates(settings.getPushContractUpdates())
                .pushPaymentReceived(settings.getPushPaymentReceived())
                .pushScheduleChanges(settings.getPushScheduleChanges())
                .pushSystemAlerts(settings.getPushSystemAlerts())
                .smsEnabled(settings.getSmsEnabled())
                .smsUrgentOnly(settings.getSmsUrgentOnly())
                .smsProvider(settings.getSmsProvider())
                .smsApiKey(settings.getSmsApiKey()) // TODO: Descriptografar
                .whatsappEnabled(settings.getWhatsappEnabled())
                .whatsappContractUpdates(settings.getWhatsappContractUpdates())
                .whatsappPaymentReceived(settings.getWhatsappPaymentReceived())
                .whatsappScheduleChanges(settings.getWhatsappScheduleChanges())
                .quietHoursEnabled(settings.getQuietHoursEnabled())
                .quietHoursStart(settings.getQuietHoursStart())
                .quietHoursEnd(settings.getQuietHoursEnd())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
    
    private NotificationSettings convertToEntity(NotificationSettingsDTO dto) {
        return NotificationSettings.builder()
                .id(dto.getId() != null ? UUID.fromString(dto.getId()) : null)
                .companyId(UUID.fromString(dto.getCompanyId()))
                .userId(dto.getUserId() != null ? UUID.fromString(dto.getUserId()) : null)
                .emailEnabled(dto.getEmailEnabled())
                .emailContractUpdates(dto.getEmailContractUpdates())
                .emailPaymentReceived(dto.getEmailPaymentReceived())
                .emailScheduleChanges(dto.getEmailScheduleChanges())
                .emailDailySummary(dto.getEmailDailySummary())
                .emailWeeklyReport(dto.getEmailWeeklyReport())
                .emailSystemAlerts(dto.getEmailSystemAlerts())
                .smtpEnabled(dto.getSmtpEnabled())
                .smtpHost(dto.getSmtpHost())
                .smtpPort(dto.getSmtpPort())
                .smtpUsername(dto.getSmtpUsername())
                .smtpPassword(dto.getSmtpPassword()) // TODO: Criptografar
                .smtpFromEmail(dto.getSmtpFromEmail())
                .smtpFromName(dto.getSmtpFromName())
                .smtpUseTls(dto.getSmtpUseTls())
                .smtpUseSsl(dto.getSmtpUseSsl())
                .pushEnabled(dto.getPushEnabled())
                .pushContractUpdates(dto.getPushContractUpdates())
                .pushPaymentReceived(dto.getPushPaymentReceived())
                .pushScheduleChanges(dto.getPushScheduleChanges())
                .pushSystemAlerts(dto.getPushSystemAlerts())
                .smsEnabled(dto.getSmsEnabled())
                .smsUrgentOnly(dto.getSmsUrgentOnly())
                .smsProvider(dto.getSmsProvider())
                .smsApiKey(dto.getSmsApiKey()) // TODO: Criptografar
                .whatsappEnabled(dto.getWhatsappEnabled())
                .whatsappContractUpdates(dto.getWhatsappContractUpdates())
                .whatsappPaymentReceived(dto.getWhatsappPaymentReceived())
                .whatsappScheduleChanges(dto.getWhatsappScheduleChanges())
                .quietHoursEnabled(dto.getQuietHoursEnabled())
                .quietHoursStart(dto.getQuietHoursStart())
                .quietHoursEnd(dto.getQuietHoursEnd())
                .build();
    }
    
    private void updateEntityFromDTO(NotificationSettings settings, NotificationSettingsDTO dto) {
        settings.setEmailEnabled(dto.getEmailEnabled());
        settings.setEmailContractUpdates(dto.getEmailContractUpdates());
        settings.setEmailPaymentReceived(dto.getEmailPaymentReceived());
        settings.setEmailScheduleChanges(dto.getEmailScheduleChanges());
        settings.setEmailDailySummary(dto.getEmailDailySummary());
        settings.setEmailWeeklyReport(dto.getEmailWeeklyReport());
        settings.setEmailSystemAlerts(dto.getEmailSystemAlerts());
        settings.setSmtpEnabled(dto.getSmtpEnabled());
        settings.setSmtpHost(dto.getSmtpHost());
        settings.setSmtpPort(dto.getSmtpPort());
        settings.setSmtpUsername(dto.getSmtpUsername());
        if (dto.getSmtpPassword() != null && !dto.getSmtpPassword().isEmpty()) {
            settings.setSmtpPassword(dto.getSmtpPassword()); // TODO: Criptografar
        }
        settings.setSmtpFromEmail(dto.getSmtpFromEmail());
        settings.setSmtpFromName(dto.getSmtpFromName());
        settings.setSmtpUseTls(dto.getSmtpUseTls());
        settings.setSmtpUseSsl(dto.getSmtpUseSsl());
        settings.setPushEnabled(dto.getPushEnabled());
        settings.setPushContractUpdates(dto.getPushContractUpdates());
        settings.setPushPaymentReceived(dto.getPushPaymentReceived());
        settings.setPushScheduleChanges(dto.getPushScheduleChanges());
        settings.setPushSystemAlerts(dto.getPushSystemAlerts());
        settings.setSmsEnabled(dto.getSmsEnabled());
        settings.setSmsUrgentOnly(dto.getSmsUrgentOnly());
        settings.setSmsProvider(dto.getSmsProvider());
        if (dto.getSmsApiKey() != null && !dto.getSmsApiKey().isEmpty()) {
            settings.setSmsApiKey(dto.getSmsApiKey()); // TODO: Criptografar
        }
        settings.setWhatsappEnabled(dto.getWhatsappEnabled());
        settings.setWhatsappContractUpdates(dto.getWhatsappContractUpdates());
        settings.setWhatsappPaymentReceived(dto.getWhatsappPaymentReceived());
        settings.setWhatsappScheduleChanges(dto.getWhatsappScheduleChanges());
        settings.setQuietHoursEnabled(dto.getQuietHoursEnabled());
        settings.setQuietHoursStart(dto.getQuietHoursStart());
        settings.setQuietHoursEnd(dto.getQuietHoursEnd());
    }
}

