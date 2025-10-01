package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.CompanyConfigDTO;
import br.com.fleetmanager.model.CompanyConfig;
import br.com.fleetmanager.repository.CompanyConfigRepository;
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
     * Busca a configuração ativa da empresa
     */
    public Optional<CompanyConfigDTO> getActiveConfig() {
        log.info("Buscando configuração ativa da empresa");
        return companyConfigRepository.findActiveConfig()
                .map(this::convertToDTO);
    }

    /**
     * Verifica se existe configuração ativa
     */
    public boolean hasActiveConfig() {
        return companyConfigRepository.existsActiveConfig();
    }

    /**
     * Salva ou atualiza configuração da empresa
     */
    public CompanyConfigDTO saveConfig(CompanyConfigDTO configDTO) {
        log.info("Salvando configuração da empresa: {}", configDTO.getName());

        // Verificar se CNPJ já existe para outra empresa
        if (configDTO.getId() != null) {
            if (companyConfigRepository.existsByCnpjAndIdNotAndActiveTrue(
                    configDTO.getCnpj(), configDTO.getId())) {
                throw new RuntimeException("CNPJ já cadastrado para outra empresa");
            }
        } else {
            if (companyConfigRepository.findByCnpjAndActiveTrue(configDTO.getCnpj()).isPresent()) {
                throw new RuntimeException("CNPJ já cadastrado");
            }
        }

        CompanyConfig config;
        
        if (configDTO.getId() != null) {
            // Atualizar configuração existente
            config = companyConfigRepository.findById(configDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Configuração não encontrada"));
            
            // Desativar todas as outras configurações
            deactivateAllConfigs();
            
            // Atualizar campos
            updateConfigFromDTO(config, configDTO);
        } else {
            // Criar nova configuração
            // Desativar todas as configurações existentes
            deactivateAllConfigs();
            
            config = new CompanyConfig();
            updateConfigFromDTO(config, configDTO);
            config.setActive(true);
        }

        config = companyConfigRepository.save(config);
        log.info("Configuração da empresa salva com ID: {}", config.getId());
        
        return convertToDTO(config);
    }

    /**
     * Busca configuração por ID
     */
    public Optional<CompanyConfigDTO> getConfigById(UUID id) {
        return companyConfigRepository.findById(id)
                .map(this::convertToDTO);
    }

    /**
     * Desativa uma configuração
     */
    public void deactivateConfig(UUID id) {
        log.info("Desativando configuração: {}", id);
        companyConfigRepository.findById(id)
                .ifPresent(config -> {
                    config.setActive(false);
                    companyConfigRepository.save(config);
                });
    }

    /**
     * Desativa todas as configurações
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
