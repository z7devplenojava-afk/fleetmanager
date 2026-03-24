package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.BaileysRestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/baileys")
@RequiredArgsConstructor
@Slf4j
public class BaileysRestController {
    
    private final BaileysRestService baileysRestService;
    
    /**
     * Inicializa uma nova instÃ¢ncia do Baileys REST API
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initializeInstance() {
        try {
            log.info("ðŸš€ Inicializando instÃ¢ncia Baileys REST API");
            
            boolean success = baileysRestService.initializeInstance();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "InstÃ¢ncia inicializada com sucesso" : "Erro ao inicializar instÃ¢ncia");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao inicializar instÃ¢ncia Baileys REST", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Verifica o status da conexÃ£o
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkStatus() {
        try {
            log.info("ðŸ” Verificando status da conexÃ£o Baileys REST");
            
            boolean connected = baileysRestService.checkConnection();
            
            Map<String, Object> response = new HashMap<>();
            response.put("connected", connected);
            response.put("status", connected ? "Conectado" : "Desconectado");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao verificar status", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("connected", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * ObtÃ©m o QR Code para conexÃ£o
     */
    @GetMapping("/qr")
    public ResponseEntity<Map<String, Object>> getQRCode() {
        try {
            log.info("ðŸ“± Obtendo QR Code para conexÃ£o");
            
            String qrCode = baileysRestService.getQRCode();
            
            Map<String, Object> response = new HashMap<>();
            if (qrCode != null) {
                response.put("success", true);
                response.put("qrCode", qrCode);
                response.put("message", "QR Code gerado com sucesso");
            } else {
                response.put("success", false);
                response.put("message", "Erro ao gerar QR Code");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao obter QR Code", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Envia mensagem de teste
     */
    @PostMapping("/send-test")
    public ResponseEntity<Map<String, Object>> sendTestMessage(@RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            String message = request.get("message");
            
            if (phoneNumber == null || message == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "phoneNumber e message sÃ£o obrigatÃ³rios");
                return ResponseEntity.badRequest().body(response);
            }
            
            log.info("ðŸ“± Enviando mensagem de teste via Baileys REST para: {}", phoneNumber);
            
            boolean success = baileysRestService.sendTextMessage(phoneNumber, message);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "Mensagem enviada com sucesso" : "Erro ao enviar mensagem");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar mensagem de teste", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Desconecta a instÃ¢ncia
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        try {
            log.info("ðŸ”Œ Desconectando instÃ¢ncia Baileys REST");
            
            boolean success = baileysRestService.disconnectInstance();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "InstÃ¢ncia desconectada com sucesso" : "Erro ao desconectar instÃ¢ncia");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao desconectar instÃ¢ncia", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 
