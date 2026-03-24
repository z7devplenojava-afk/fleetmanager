package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.SecuritySettingsDTO;
import com.z7design.fleet_manager.model.SecuritySettings;
import com.z7design.fleet_manager.repository.SecuritySettingsRepository;
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
public class SecuritySettingsService {
    
    private final SecuritySettingsRepository securitySettingsRepository;
    
    public SecuritySettingsDTO getSecuritySettings(UUID companyId) {
        log.info("Buscando configuraÃ§Ãµes de seguranÃ§a para empresa: {}", companyId);
        
        Optional<SecuritySettings> settings = securitySettingsRepository.findByCompanyId(companyId);
        
        if (settings.isPresent()) {
            return convertToDTO(settings.get());
        } else {
            // Retornar configuraÃ§Ãµes padrÃ£o se nÃ£o existir
            return getDefaultSecuritySettings(companyId);
        }
    }
    
    public SecuritySettingsDTO createSecuritySettings(SecuritySettingsDTO dto) {
        log.info("Criando configuraÃ§Ãµes de seguranÃ§a para empresa: {}", dto.getCompanyId());
        
        SecuritySettings settings = convertToEntity(dto);
        SecuritySettings savedSettings = securitySettingsRepository.save(settings);
        
        log.info("ConfiguraÃ§Ãµes de seguranÃ§a criadas com ID: {}", savedSettings.getId());
        return convertToDTO(savedSettings);
    }
    
    public SecuritySettingsDTO updateSecuritySettings(UUID companyId, SecuritySettingsDTO dto) {
        log.info("Atualizando configuraÃ§Ãµes de seguranÃ§a para empresa: {}", companyId);
        
        Optional<SecuritySettings> existingSettings = securitySettingsRepository.findByCompanyId(companyId);
        
        if (existingSettings.isPresent()) {
            SecuritySettings settings = existingSettings.get();
            updateEntityFromDTO(settings, dto);
            SecuritySettings savedSettings = securitySettingsRepository.save(settings);
            
            log.info("ConfiguraÃ§Ãµes de seguranÃ§a atualizadas com ID: {}", savedSettings.getId());
            return convertToDTO(savedSettings);
        } else {
            // Criar novas configuraÃ§Ãµes se nÃ£o existir
            dto.setCompanyId(companyId.toString());
            return createSecuritySettings(dto);
        }
    }
    
    public void deleteSecuritySettings(UUID companyId) {
        log.info("Deletando configuraÃ§Ãµes de seguranÃ§a para empresa: {}", companyId);
        
        Optional<SecuritySettings> settings = securitySettingsRepository.findByCompanyId(companyId);
        if (settings.isPresent()) {
            securitySettingsRepository.delete(settings.get());
            log.info("ConfiguraÃ§Ãµes de seguranÃ§a deletadas para empresa: {}", companyId);
        }
    }
    
    public List<SecuritySettingsDTO> getAllSecuritySettings() {
        log.info("Buscando todas as configuraÃ§Ãµes de seguranÃ§a");
        
        List<SecuritySettings> settings = securitySettingsRepository.findAll();
        return settings.stream()
                .map(this::convertToDTO)
                .toList();
    }
    
    private SecuritySettingsDTO getDefaultSecuritySettings(UUID companyId) {
        return SecuritySettingsDTO.builder()
                .companyId(companyId.toString())
                .twoFactorEnabled(false)
                .twoFactorMethod("EMAIL")
                .passwordExpiryEnabled(true)
                .passwordExpiryDays(90)
                .passwordMinLength(8)
                .passwordRequireUppercase(true)
                .passwordRequireLowercase(true)
                .passwordRequireNumbers(true)
                .passwordRequireSymbols(false)
                .accountLockoutEnabled(true)
                .maxFailedAttempts(5)
                .lockoutDurationMinutes(30)
                .sessionTimeoutMinutes(60)
                .ipWhitelistEnabled(false)
                .auditLogEnabled(true)
                .build();
    }
    
    private SecuritySettingsDTO convertToDTO(SecuritySettings settings) {
        return SecuritySettingsDTO.builder()
                .id(settings.getId().toString())
                .companyId(settings.getCompanyId().toString())
                .twoFactorEnabled(settings.getTwoFactorEnabled())
                .twoFactorMethod(settings.getTwoFactorMethod())
                .passwordExpiryEnabled(settings.getPasswordExpiryEnabled())
                .passwordExpiryDays(settings.getPasswordExpiryDays())
                .passwordMinLength(settings.getPasswordMinLength())
                .passwordRequireUppercase(settings.getPasswordRequireUppercase())
                .passwordRequireLowercase(settings.getPasswordRequireLowercase())
                .passwordRequireNumbers(settings.getPasswordRequireNumbers())
                .passwordRequireSymbols(settings.getPasswordRequireSymbols())
                .accountLockoutEnabled(settings.getAccountLockoutEnabled())
                .maxFailedAttempts(settings.getMaxFailedAttempts())
                .lockoutDurationMinutes(settings.getLockoutDurationMinutes())
                .sessionTimeoutMinutes(settings.getSessionTimeoutMinutes())
                .ipWhitelistEnabled(settings.getIpWhitelistEnabled())
                .ipWhitelist(settings.getIpWhitelist() != null ? 
                    List.of(settings.getIpWhitelist().split(",")) : List.of())
                .auditLogEnabled(settings.getAuditLogEnabled())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
    
    private SecuritySettings convertToEntity(SecuritySettingsDTO dto) {
        return SecuritySettings.builder()
                .id(dto.getId() != null ? UUID.fromString(dto.getId()) : null)
                .companyId(UUID.fromString(dto.getCompanyId()))
                .twoFactorEnabled(dto.getTwoFactorEnabled())
                .twoFactorMethod(dto.getTwoFactorMethod())
                .passwordExpiryEnabled(dto.getPasswordExpiryEnabled())
                .passwordExpiryDays(dto.getPasswordExpiryDays())
                .passwordMinLength(dto.getPasswordMinLength())
                .passwordRequireUppercase(dto.getPasswordRequireUppercase())
                .passwordRequireLowercase(dto.getPasswordRequireLowercase())
                .passwordRequireNumbers(dto.getPasswordRequireNumbers())
                .passwordRequireSymbols(dto.getPasswordRequireSymbols())
                .accountLockoutEnabled(dto.getAccountLockoutEnabled())
                .maxFailedAttempts(dto.getMaxFailedAttempts())
                .lockoutDurationMinutes(dto.getLockoutDurationMinutes())
                .sessionTimeoutMinutes(dto.getSessionTimeoutMinutes())
                .ipWhitelistEnabled(dto.getIpWhitelistEnabled())
                .ipWhitelist(dto.getIpWhitelist() != null ? 
                    String.join(",", dto.getIpWhitelist()) : null)
                .auditLogEnabled(dto.getAuditLogEnabled())
                .build();
    }
    
    private void updateEntityFromDTO(SecuritySettings settings, SecuritySettingsDTO dto) {
        settings.setTwoFactorEnabled(dto.getTwoFactorEnabled());
        settings.setTwoFactorMethod(dto.getTwoFactorMethod());
        settings.setPasswordExpiryEnabled(dto.getPasswordExpiryEnabled());
        settings.setPasswordExpiryDays(dto.getPasswordExpiryDays());
        settings.setPasswordMinLength(dto.getPasswordMinLength());
        settings.setPasswordRequireUppercase(dto.getPasswordRequireUppercase());
        settings.setPasswordRequireLowercase(dto.getPasswordRequireLowercase());
        settings.setPasswordRequireNumbers(dto.getPasswordRequireNumbers());
        settings.setPasswordRequireSymbols(dto.getPasswordRequireSymbols());
        settings.setAccountLockoutEnabled(dto.getAccountLockoutEnabled());
        settings.setMaxFailedAttempts(dto.getMaxFailedAttempts());
        settings.setLockoutDurationMinutes(dto.getLockoutDurationMinutes());
        settings.setSessionTimeoutMinutes(dto.getSessionTimeoutMinutes());
        settings.setIpWhitelistEnabled(dto.getIpWhitelistEnabled());
        settings.setIpWhitelist(dto.getIpWhitelist() != null ? 
            String.join(",", dto.getIpWhitelist()) : null);
        settings.setAuditLogEnabled(dto.getAuditLogEnabled());
    }
}

