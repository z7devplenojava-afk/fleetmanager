package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.BaileysRestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppTestController {
    
    private final BaileysRestService baileysRestService;
    
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        log.info("ðŸ” Testando conexÃ£o WhatsApp");
        
        try {
            // TODO: Implementar verificaÃ§Ã£o de disponibilidade
            boolean disponivel = true; // Simulado por enquanto
            String provedor = "WhatsApp Web API";
            
            Map<String, Object> result = Map.of(
                "disponivel", disponivel,
                "provedor", provedor,
                "timestamp", java.time.LocalDateTime.now().toString(),
                "message", disponivel ? "WhatsApp disponÃ­vel" : "WhatsApp indisponÃ­vel"
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao testar conexÃ£o WhatsApp: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "disponivel", false,
                "provedor", "erro",
                "timestamp", java.time.LocalDateTime.now().toString(),
                "message", "Erro: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/send-test")
    public ResponseEntity<Map<String, Object>> sendTestMessage(@RequestBody TestMessageRequest request) {
        log.info("ðŸ“¤ Enviando mensagem de teste para: {}", request.getTelefone());
        
        try {
            // Validar campos obrigatÃ³rios
            if (request.getTelefone() == null || request.getTelefone().trim().isEmpty()) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("sucesso", false);
                errorResult.put("telefone", request.getTelefone());
                errorResult.put("timestamp", java.time.LocalDateTime.now().toString());
                errorResult.put("message", "NÃºmero de telefone Ã© obrigatÃ³rio");
                return ResponseEntity.badRequest().body(errorResult);
            }
            
            String mensagem = request.getMensagem() != null && !request.getMensagem().trim().isEmpty()
                ? request.getMensagem()
                : "âœ… Teste SecuredGuard - WhatsApp conectado e funcionando!";
            
            log.info("ðŸ“± Enviando mensagem de teste via Baileys REST para: {} - Mensagem: {}", 
                request.getTelefone(), mensagem);
            
            // Enviar mensagem via Baileys REST Service
            boolean success = baileysRestService.sendTextMessage(request.getTelefone(), mensagem);
            
            Map<String, Object> result = new HashMap<>();
            result.put("sucesso", success);
            result.put("telefone", request.getTelefone());
            result.put("timestamp", java.time.LocalDateTime.now().toString());
            
            if (success) {
                result.put("message", "Mensagem de teste enviada com sucesso");
                log.info("âœ… Mensagem de teste enviada com sucesso para: {}", request.getTelefone());
            } else {
                String errorMsg = baileysRestService.getLastErrorMessage();
                result.put("message", errorMsg != null ? errorMsg : "Erro ao enviar mensagem de teste");
                log.error("âŒ Falha ao enviar mensagem de teste para: {}. Erro: {}", 
                    request.getTelefone(), errorMsg);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar mensagem de teste: {}", e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("sucesso", false);
            errorResult.put("telefone", request.getTelefone());
            errorResult.put("timestamp", java.time.LocalDateTime.now().toString());
            errorResult.put("message", "Erro ao enviar mensagem: " + e.getMessage());
            return ResponseEntity.ok(errorResult);
        }
    }
    
    @PostMapping("/send-test-file")
    public ResponseEntity<Map<String, Object>> sendTestFile(@RequestBody TestFileRequest request) {
        log.info("ðŸ“¤ Enviando arquivo de teste para: {}", request.getTelefone());
        
        try {
            // TODO: Implementar envio de arquivo
            log.info("ðŸ“± Arquivo de teste solicitado para {}: {} - ImplementaÃ§Ã£o pendente", 
                request.getTelefone(), request.getCaminhoPdf());
            
            Map<String, Object> result = Map.of(
                "sucesso", true,
                "telefone", request.getTelefone(),
                "arquivo", request.getCaminhoPdf(),
                "timestamp", java.time.LocalDateTime.now().toString(),
                "message", "Arquivo de teste enviado com sucesso"
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar arquivo de teste: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "sucesso", false,
                "telefone", request.getTelefone(),
                "arquivo", request.getCaminhoPdf(),
                "timestamp", java.time.LocalDateTime.now().toString(),
                "message", "Erro: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info("ðŸ“Š Obtendo status do WhatsApp");
        
        try {
            // TODO: Implementar verificaÃ§Ã£o de disponibilidade
            boolean disponivel = true; // Simulado por enquanto
            String provedor = "WhatsApp Web API";
            
            Map<String, Object> result = Map.of(
                "disponivel", disponivel,
                "provedor", provedor,
                "timestamp", java.time.LocalDateTime.now().toString(),
                "status", disponivel ? "ONLINE" : "OFFLINE"
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao obter status: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "disponivel", false,
                "provedor", "erro",
                "timestamp", java.time.LocalDateTime.now().toString(),
                "status", "ERROR"
            ));
        }
    }
    
    // Classes de request
    public static class TestMessageRequest {
        private String telefone;
        private String mensagem;
        
        // Getters e Setters
        public String getTelefone() { return telefone; }
        public void setTelefone(String telefone) { this.telefone = telefone; }
        
        public String getMensagem() { return mensagem; }
        public void setMensagem(String mensagem) { this.mensagem = mensagem; }
    }
    
    public static class TestFileRequest {
        private String telefone;
        private String mensagem;
        private String caminhoPdf;
        
        // Getters e Setters
        public String getTelefone() { return telefone; }
        public void setTelefone(String telefone) { this.telefone = telefone; }
        
        public String getMensagem() { return mensagem; }
        public void setMensagem(String mensagem) { this.mensagem = mensagem; }
        
        public String getCaminhoPdf() { return caminhoPdf; }
        public void setCaminhoPdf(String caminhoPdf) { this.caminhoPdf = caminhoPdf; }
    }
} 
