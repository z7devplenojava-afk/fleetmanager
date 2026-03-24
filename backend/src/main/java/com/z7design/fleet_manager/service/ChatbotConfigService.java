package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ChatbotConfigDTO;
import com.z7design.fleet_manager.dto.CreateChatbotConfigRequest;
import com.z7design.fleet_manager.dto.UpdateChatbotConfigRequest;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.ChatbotConfig;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.ChatbotConfigRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatbotConfigService {
    
    @Autowired
    private ChatbotConfigRepository chatbotConfigRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public ChatbotConfigDTO createConfig(CreateChatbotConfigRequest request, String username) {
        // Verificar se jÃ¡ existe um config com o mesmo nome
        if (request.getName() != null && chatbotConfigRepository.existsByName(request.getName())) {
            throw new BusinessException("JÃ¡ existe uma configuraÃ§Ã£o com o nome: " + request.getName());
        }
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado: " + username));
        
        ChatbotConfig config = new ChatbotConfig();
        config.setName(request.getName());
        config.setWelcomeMessage(request.getWelcomeMessage());
        config.setDefaultResponse(request.getDefaultResponse());
        config.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        config.setAutoRespond(request.getAutoRespond() != null ? request.getAutoRespond() : true);
        config.setTransferToHumanEnabled(request.getTransferToHumanEnabled() != null ? request.getTransferToHumanEnabled() : true);
        config.setWorkingHoursEnabled(request.getWorkingHoursEnabled() != null ? request.getWorkingHoursEnabled() : false);
        config.setWorkingHoursStart(request.getWorkingHoursStart());
        config.setWorkingHoursEnd(request.getWorkingHoursEnd());
        config.setOfflineMessage(request.getOfflineMessage());
        config.setMaxWaitTimeMinutes(request.getMaxWaitTimeMinutes() != null ? request.getMaxWaitTimeMinutes() : 30);
        config.setAutoEscalateEnabled(request.getAutoEscalateEnabled() != null ? request.getAutoEscalateEnabled() : false);
        config.setAutoEscalateAfterMinutes(request.getAutoEscalateAfterMinutes() != null ? request.getAutoEscalateAfterMinutes() : 15);
        config.setKnowledgeBaseEnabled(request.getKnowledgeBaseEnabled() != null ? request.getKnowledgeBaseEnabled() : false);
        config.setSentimentAnalysisEnabled(request.getSentimentAnalysisEnabled() != null ? request.getSentimentAnalysisEnabled() : false);
        config.setLanguage(request.getLanguage() != null ? request.getLanguage() : "pt-BR");
        config.setCreatedBy(user);
        
        config = chatbotConfigRepository.save(config);
        // Inicializar relacionamentos lazy antes de converter
        if (config.getCreatedBy() != null) {
            config.getCreatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        return convertToDTO(config);
    }
    
    public ChatbotConfigDTO updateConfig(UUID id, UpdateChatbotConfigRequest request, String username) {
        ChatbotConfig config = chatbotConfigRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ConfiguraÃ§Ã£o do chatbot nÃ£o encontrada"));
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado: " + username));
        
        if (request.getName() != null && !request.getName().equals(config.getName())) {
            if (chatbotConfigRepository.existsByName(request.getName())) {
                throw new BusinessException("JÃ¡ existe uma configuraÃ§Ã£o com o nome: " + request.getName());
            }
            config.setName(request.getName());
        }
        
        if (request.getWelcomeMessage() != null) {
            config.setWelcomeMessage(request.getWelcomeMessage());
        }
        if (request.getDefaultResponse() != null) {
            config.setDefaultResponse(request.getDefaultResponse());
        }
        if (request.getIsActive() != null) {
            config.setIsActive(request.getIsActive());
        }
        if (request.getAutoRespond() != null) {
            config.setAutoRespond(request.getAutoRespond());
        }
        if (request.getTransferToHumanEnabled() != null) {
            config.setTransferToHumanEnabled(request.getTransferToHumanEnabled());
        }
        if (request.getWorkingHoursEnabled() != null) {
            config.setWorkingHoursEnabled(request.getWorkingHoursEnabled());
        }
        if (request.getWorkingHoursStart() != null) {
            config.setWorkingHoursStart(request.getWorkingHoursStart());
        }
        if (request.getWorkingHoursEnd() != null) {
            config.setWorkingHoursEnd(request.getWorkingHoursEnd());
        }
        if (request.getOfflineMessage() != null) {
            config.setOfflineMessage(request.getOfflineMessage());
        }
        if (request.getMaxWaitTimeMinutes() != null) {
            config.setMaxWaitTimeMinutes(request.getMaxWaitTimeMinutes());
        }
        if (request.getAutoEscalateEnabled() != null) {
            config.setAutoEscalateEnabled(request.getAutoEscalateEnabled());
        }
        if (request.getAutoEscalateAfterMinutes() != null) {
            config.setAutoEscalateAfterMinutes(request.getAutoEscalateAfterMinutes());
        }
        if (request.getKnowledgeBaseEnabled() != null) {
            config.setKnowledgeBaseEnabled(request.getKnowledgeBaseEnabled());
        }
        if (request.getSentimentAnalysisEnabled() != null) {
            config.setSentimentAnalysisEnabled(request.getSentimentAnalysisEnabled());
        }
        if (request.getLanguage() != null) {
            config.setLanguage(request.getLanguage());
        }
        
        config.setUpdatedBy(user);
        config = chatbotConfigRepository.save(config);
        // Inicializar relacionamentos lazy antes de converter
        if (config.getCreatedBy() != null) {
            config.getCreatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        if (config.getUpdatedBy() != null) {
            config.getUpdatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        return convertToDTO(config);
    }
    
    @Transactional(readOnly = true)
    public ChatbotConfigDTO getConfig(UUID id) {
        ChatbotConfig config = chatbotConfigRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ConfiguraÃ§Ã£o do chatbot nÃ£o encontrada"));
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        if (config.getCreatedBy() != null) {
            config.getCreatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        if (config.getUpdatedBy() != null) {
            config.getUpdatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        return convertToDTO(config);
    }
    
    @Transactional(readOnly = true)
    public ChatbotConfigDTO getActiveConfig() {
        ChatbotConfig config = chatbotConfigRepository.findFirstByIsActiveTrue()
            .orElseThrow(() -> new BusinessException("Nenhuma configuraÃ§Ã£o ativa encontrada"));
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        if (config.getCreatedBy() != null) {
            config.getCreatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        if (config.getUpdatedBy() != null) {
            config.getUpdatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
        }
        return convertToDTO(config);
    }
    
    @Transactional(readOnly = true)
    public List<ChatbotConfigDTO> getAllConfigs() {
        List<ChatbotConfig> configs = chatbotConfigRepository.findAll();
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (ChatbotConfig config : configs) {
            if (config.getCreatedBy() != null) {
                config.getCreatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
            }
            if (config.getUpdatedBy() != null) {
                config.getUpdatedBy().getName(); // ForÃ§a inicializaÃ§Ã£o
            }
        }
        return configs.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public void deleteConfig(UUID id) {
        if (!chatbotConfigRepository.existsById(id)) {
            throw new BusinessException("ConfiguraÃ§Ã£o do chatbot nÃ£o encontrada");
        }
        chatbotConfigRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    private ChatbotConfigDTO convertToDTO(ChatbotConfig config) {
        ChatbotConfigDTO dto = new ChatbotConfigDTO();
        dto.setId(config.getId());
        dto.setName(config.getName());
        dto.setWelcomeMessage(config.getWelcomeMessage());
        dto.setDefaultResponse(config.getDefaultResponse());
        dto.setIsActive(config.getIsActive());
        dto.setAutoRespond(config.getAutoRespond());
        dto.setTransferToHumanEnabled(config.getTransferToHumanEnabled());
        dto.setWorkingHoursEnabled(config.getWorkingHoursEnabled());
        dto.setWorkingHoursStart(config.getWorkingHoursStart());
        dto.setWorkingHoursEnd(config.getWorkingHoursEnd());
        dto.setOfflineMessage(config.getOfflineMessage());
        dto.setMaxWaitTimeMinutes(config.getMaxWaitTimeMinutes());
        dto.setAutoEscalateEnabled(config.getAutoEscalateEnabled());
        dto.setAutoEscalateAfterMinutes(config.getAutoEscalateAfterMinutes());
        dto.setKnowledgeBaseEnabled(config.getKnowledgeBaseEnabled());
        dto.setSentimentAnalysisEnabled(config.getSentimentAnalysisEnabled());
        dto.setLanguage(config.getLanguage());
        dto.setCreatedAt(config.getCreatedAt());
        dto.setUpdatedAt(config.getUpdatedAt());
        
        if (config.getCreatedBy() != null) {
            dto.setCreatedByName(config.getCreatedBy().getName());
        }
        if (config.getUpdatedBy() != null) {
            dto.setUpdatedByName(config.getUpdatedBy().getName());
        }
        
        return dto;
    }
}


