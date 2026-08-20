package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ChatbotConfigDTO;
import com.z7design.fleet_manager.dto.CreateChatbotConfigRequest;
import com.z7design.fleet_manager.dto.UpdateChatbotConfigRequest;
import com.z7design.fleet_manager.service.ChatbotConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/support/chatbot")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ChatbotConfigController {
    
    @Autowired
    private ChatbotConfigService chatbotConfigService;
    
    @PostMapping("/config")
    @PreAuthorize("hasAnyAuthority('SUPPORT_MANAGE', 'ATTENDANCE_MANAGE', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<ChatbotConfigDTO> createConfig(
            @Valid @RequestBody CreateChatbotConfigRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            ChatbotConfigDTO config = chatbotConfigService.createConfig(request, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(config);
        } catch (com.z7design.fleet_manager.exception.BusinessException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/config/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_MANAGE', 'ATTENDANCE_MANAGE', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<ChatbotConfigDTO> updateConfig(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateChatbotConfigRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ChatbotConfigDTO config = chatbotConfigService.updateConfig(id, request, username);
        return ResponseEntity.ok(config);
    }
    
    @GetMapping("/config")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ATTENDANCE_MANAGE', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<ChatbotConfigDTO>> getAllConfigs() {
        try {
            List<ChatbotConfigDTO> configs = chatbotConfigService.getAllConfigs();
            return ResponseEntity.ok(configs);
        } catch (Exception e) {
            // Se nÃ£o houver configuraÃ§Ãµes, retornar lista vazia ao invÃ©s de erro 500
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
    
    @GetMapping("/config/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ATTENDANCE_MANAGE', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<ChatbotConfigDTO> getConfig(@PathVariable("id") UUID id) {
        ChatbotConfigDTO config = chatbotConfigService.getConfig(id);
        return ResponseEntity.ok(config);
    }
    
    @GetMapping("/config/active")
    @PreAuthorize("hasAnyAuthority('SUPPORT_READ', 'SUPPORT_MANAGE', 'ATTENDANCE_READ', 'ATTENDANCE_MANAGE', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<ChatbotConfigDTO> getActiveConfig() {
        try {
            ChatbotConfigDTO config = chatbotConfigService.getActiveConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/config/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPORT_MANAGE', 'ATTENDANCE_MANAGE', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteConfig(@PathVariable("id") UUID id) {
        chatbotConfigService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }
}


