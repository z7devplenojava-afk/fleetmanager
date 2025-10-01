package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.BaileysRestService;
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
     * Inicializa uma nova instância do Baileys REST API
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initializeInstance() {
        try {
            log.info("🚀 Inicializando instância Baileys REST API");
            
            boolean success = baileysRestService.initializeInstance();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "Instância inicializada com sucesso" : "Erro ao inicializar instância");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Erro ao inicializar instância Baileys REST", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Verifica o status da conexão
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkStatus() {
        try {
            log.info("🔍 Verificando status da conexão Baileys REST");
            
            boolean connected = baileysRestService.checkConnection();
            
            Map<String, Object> response = new HashMap<>();
            response.put("connected", connected);
            response.put("status", connected ? "Conectado" : "Desconectado");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Erro ao verificar status", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("connected", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Obtém o QR Code para conexão
     */
    @GetMapping("/qr")
    public ResponseEntity<Map<String, Object>> getQRCode() {
        try {
            log.info("📱 Obtendo QR Code para conexão");
            
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
            log.error("❌ Erro ao obter QR Code", e);
            
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
                response.put("error", "phoneNumber e message são obrigatórios");
                return ResponseEntity.badRequest().body(response);
            }
            
            log.info("📱 Enviando mensagem de teste via Baileys REST para: {}", phoneNumber);
            
            boolean success = baileysRestService.sendTextMessage(phoneNumber, message);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "Mensagem enviada com sucesso" : "Erro ao enviar mensagem");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Erro ao enviar mensagem de teste", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Desconecta a instância
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        try {
            log.info("🔌 Desconectando instância Baileys REST");
            
            boolean success = baileysRestService.disconnectInstance();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "Instância desconectada com sucesso" : "Erro ao desconectar instância");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Erro ao desconectar instância", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 