package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.EnvioService;

import br.com.fleetmanager.dto.EnvioRequest;
import br.com.fleetmanager.dto.EnvioResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/envio")
@RequiredArgsConstructor
@Slf4j
public class EnvioController {
    
    private final EnvioService envioService;
    
    /**
     * 📤 Envio individual de holerite
     */
    @PostMapping("/individual")
    public ResponseEntity<EnvioResponse> enviarIndividual(@Valid @RequestBody EnvioRequest request) {
        log.info("🚀 Recebida requisição de envio individual para funcionário: {}", request.getFuncionarioId());
        
        EnvioResponse response = envioService.enviarIndividual(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 📤 Envio em massa de holerites
     */
    @PostMapping("/massa")
    public ResponseEntity<EnvioResponse> enviarEmMassa(@Valid @RequestBody EnvioRequest request) {
        log.info("🚀 Recebida requisição de envio em massa para {} funcionários", 
                request.getFuncionarioIds() != null ? request.getFuncionarioIds().size() : 0);
        
        EnvioResponse response = envioService.enviarEmMassa(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 📤 Envio para todos os funcionários por tipo
     */
    @PostMapping("/todos")
    public ResponseEntity<EnvioResponse> enviarTodos(@Valid @RequestBody EnvioRequest request) {
        log.info("🚀 Recebida requisição de envio para todos via {}", request.getTipo());
        
        EnvioResponse response = envioService.enviarTodosPorTipo(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 🔍 Verificar se funcionário tem WhatsApp disponível
     */
    @GetMapping("/verificar-whatsapp/{cpf}")
    public ResponseEntity<WhatsAppVerificacaoResponse> verificarWhatsApp(@PathVariable String cpf) {
        log.info("🔍 Verificando WhatsApp para CPF: {}", cpf);
        
        boolean temWhatsApp = envioService.funcionarioTemWhatsApp(cpf);
        String numeroWhatsApp = envioService.obterWhatsAppFuncionario(cpf);
        
        WhatsAppVerificacaoResponse response = new WhatsAppVerificacaoResponse(cpf, temWhatsApp, numeroWhatsApp);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 📋 DTO para resposta de verificação de WhatsApp
     */
    public static class WhatsAppVerificacaoResponse {
        private final String cpf;
        private final boolean temWhatsApp;
        private final String numeroWhatsApp;
        
        public WhatsAppVerificacaoResponse(String cpf, boolean temWhatsApp, String numeroWhatsApp) {
            this.cpf = cpf;
            this.temWhatsApp = temWhatsApp;
            this.numeroWhatsApp = numeroWhatsApp;
        }
        
        public String getCpf() { return cpf; }
        public boolean isTemWhatsApp() { return temWhatsApp; }
        public String getNumeroWhatsApp() { return numeroWhatsApp; }
    }
} 