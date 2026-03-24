package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CompanyConfigDTO;
import com.z7design.fleet_manager.model.CompanyConfig;
import com.z7design.fleet_manager.repository.CompanyConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CompanyConfigService {

    private final CompanyConfigRepository companyConfigRepository;

    /**
     * Busca a configuraÃ§Ã£o ativa da empresa
     */
    public Optional<CompanyConfigDTO> getActiveConfig() {
        log.info("Buscando configuraÃ§Ã£o ativa da empresa");
        return companyConfigRepository.findActiveConfig()
                .map(this::convertToDTO);
    }

    /**
     * Verifica se existe configuraÃ§Ã£o ativa
     */
    public boolean hasActiveConfig() {
        return companyConfigRepository.existsActiveConfig();
    }

    /**
     * Salva ou atualiza configuraÃ§Ã£o da empresa
     */
    public CompanyConfigDTO saveConfig(CompanyConfigDTO configDTO) {
        log.info("Salvando configuraÃ§Ã£o da empresa: {}", configDTO.getName());

        // Verificar se CNPJ jÃ¡ existe para outra empresa
        if (configDTO.getId() != null) {
            if (companyConfigRepository.existsByCnpjAndIdNotAndActiveTrue(
                    configDTO.getCnpj(), configDTO.getId())) {
                throw new RuntimeException("CNPJ jÃ¡ cadastrado para outra empresa");
            }
        } else {
            if (companyConfigRepository.findByCnpjAndActiveTrue(configDTO.getCnpj()).isPresent()) {
                throw new RuntimeException("CNPJ jÃ¡ cadastrado");
            }
        }

        CompanyConfig config;
        
        if (configDTO.getId() != null) {
            // Atualizar configuraÃ§Ã£o existente
            config = companyConfigRepository.findById(configDTO.getId())
                    .orElseThrow(() -> new RuntimeException("ConfiguraÃ§Ã£o nÃ£o encontrada"));
            
            // Desativar todas as outras configuraÃ§Ãµes
            deactivateAllConfigs();
            
            // Atualizar campos
            updateConfigFromDTO(config, configDTO);
        } else {
            // Criar nova configuraÃ§Ã£o
            // Desativar todas as configuraÃ§Ãµes existentes
            deactivateAllConfigs();
            
            config = new CompanyConfig();
            updateConfigFromDTO(config, configDTO);
            config.setActive(true);
        }

        config = companyConfigRepository.save(config);
        log.info("ConfiguraÃ§Ã£o da empresa salva com ID: {}", config.getId());
        
        return convertToDTO(config);
    }

    /**
     * Busca configuraÃ§Ã£o por ID
     */
    public Optional<CompanyConfigDTO> getConfigById(UUID id) {
        return companyConfigRepository.findById(id)
                .map(this::convertToDTO);
    }

    /**
     * Desativa uma configuraÃ§Ã£o
     */
    public void deactivateConfig(UUID id) {
        log.info("Desativando configuraÃ§Ã£o: {}", id);
        companyConfigRepository.findById(id)
                .ifPresent(config -> {
                    config.setActive(false);
                    companyConfigRepository.save(config);
                });
    }

    /**
     * Desativa todas as configuraÃ§Ãµes
     */
    private void deactivateAllConfigs() {
        companyConfigRepository.findAll()
                .forEach(config -> {
                    config.setActive(false);
                    companyConfigRepository.save(config);
                });
    }

    /**
     * Atualiza entidade com dados do DTO
     */
    private void updateConfigFromDTO(CompanyConfig config, CompanyConfigDTO dto) {
        config.setName(dto.getName());
        config.setCnpj(dto.getCnpj());
        config.setAddress(dto.getAddress());
        config.setCity(dto.getCity());
        config.setState(dto.getState());
        config.setZipCode(dto.getZipCode());
        config.setPhone(dto.getPhone());
        config.setEmail(dto.getEmail());
        config.setWebsite(dto.getWebsite());
        config.setLogoUrl(dto.getLogoUrl());
        config.setHeaderText(dto.getHeaderText());
        config.setFooterText(dto.getFooterText());
        config.setContractTerms(dto.getContractTerms());
        config.setActive(true);
    }

    /**
     * Converte entidade para DTO
     */
    private CompanyConfigDTO convertToDTO(CompanyConfig config) {
        CompanyConfigDTO dto = new CompanyConfigDTO();
        BeanUtils.copyProperties(config, dto);
        return dto;
    }
}

