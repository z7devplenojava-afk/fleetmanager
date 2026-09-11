package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EnvioRequest;
import com.z7design.fleet_manager.dto.EnvioResponse;
import com.z7design.fleet_manager.service.EnvioService;
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
     * ðŸ“¤ Envio individual de holerite
     */
    @PostMapping("/individual")
    public ResponseEntity<EnvioResponse> enviarIndividual(@Valid @RequestBody EnvioRequest request) {
        log.info("ðŸš€ Recebida requisiÃ§Ã£o de envio individual - Tipo: {}, FuncionarioId: {}, CPF: {}", 
                request.getTipo(), request.getFuncionarioId(), request.getCpf());
        
        // Validar se o tipo foi fornecido
        if (request.getTipo() == null || request.getTipo().trim().isEmpty()) {
            log.error("âŒ Tipo de envio nÃ£o fornecido!");
            EnvioResponse errorResponse = EnvioResponse.builder()
                    .sucesso(false)
                    .mensagem("Tipo de envio Ã© obrigatÃ³rio (deve ser 'email' ou 'whatsapp')")
                    .tipoEnvio(null)
                    .totalEnviados(0)
                    .totalFalhas(1)
                    .detalhes(new java.util.ArrayList<>())
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Validar se o tipo Ã© vÃ¡lido
        if (!request.getTipo().equalsIgnoreCase("email") && !request.getTipo().equalsIgnoreCase("whatsapp")) {
            log.error("âŒ Tipo de envio invÃ¡lido: {}", request.getTipo());
            EnvioResponse errorResponse = EnvioResponse.builder()
                    .sucesso(false)
                    .mensagem("Tipo de envio invÃ¡lido. Deve ser 'email' ou 'whatsapp'")
                    .tipoEnvio(request.getTipo())
                    .totalEnviados(0)
                    .totalFalhas(1)
                    .detalhes(new java.util.ArrayList<>())
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Validar se pelo menos um identificador foi fornecido
        if ((request.getFuncionarioId() == null || request.getFuncionarioId().trim().isEmpty()) 
                && (request.getCpf() == null || request.getCpf().trim().isEmpty())) {
            log.error("âŒ Nenhum identificador fornecido (funcionarioId ou CPF)!");
            EnvioResponse errorResponse = EnvioResponse.builder()
                    .sucesso(false)
                    .mensagem("ID do funcionÃ¡rio ou CPF Ã© obrigatÃ³rio")
                    .tipoEnvio(request.getTipo())
                    .totalEnviados(0)
                    .totalFalhas(1)
                    .detalhes(new java.util.ArrayList<>())
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        EnvioResponse response = envioService.enviarIndividual(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * ðŸ“¤ Envio em massa de holerites
     */
    @PostMapping("/massa")
    public ResponseEntity<EnvioResponse> enviarEmMassa(@Valid @RequestBody EnvioRequest request) {
        log.info("ðŸš€ Recebida requisiÃ§Ã£o de envio em massa para {} funcionÃ¡rios", 
                request.getFuncionarioIds() != null ? request.getFuncionarioIds().size() : 0);
        
        EnvioResponse response = envioService.enviarEmMassa(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * ðŸ“¤ Envio para todos os funcionÃ¡rios por tipo
     */
    @PostMapping("/todos")
    public ResponseEntity<EnvioResponse> enviarTodos(@Valid @RequestBody EnvioRequest request) {
        log.info("ðŸš€ Recebida requisiÃ§Ã£o de envio para todos via {}", request.getTipo());
        
        EnvioResponse response = envioService.enviarTodosPorTipo(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * ðŸ” Verificar se funcionÃ¡rio tem WhatsApp disponÃ­vel
     */
    @GetMapping("/verificar-whatsapp/{cpf}")
    public ResponseEntity<WhatsAppVerificacaoResponse> verificarWhatsApp(@PathVariable("cpf") String cpf) {
        log.info("ðŸ” Verificando WhatsApp para CPF: {}", cpf);
        
        boolean temWhatsApp = envioService.funcionarioTemWhatsApp(cpf);
        String numeroWhatsApp = envioService.obterWhatsAppFuncionario(cpf);
        
        WhatsAppVerificacaoResponse response = new WhatsAppVerificacaoResponse(cpf, temWhatsApp, numeroWhatsApp);
        return ResponseEntity.ok(response);
    }
    
    /**
     * ðŸ“‹ DTO para resposta de verificaÃ§Ã£o de WhatsApp
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

    /**
     * ðŸ” Reenvio manual por ID de log
     */
    @PostMapping("/resend/{logId}")
    public ResponseEntity<EnvioResponse> resend(@PathVariable("logId") String logId) {
        EnvioResponse resp = envioService.reenviarPorLogId(logId);
        return resp.isSucesso() ? ResponseEntity.ok(resp) : ResponseEntity.badRequest().body(resp);
    }

    /**
     * ðŸ“œ Listar logs de envio por cpf/mÃªs/ano (todos os parÃ¢metros opcionais)
     */
    @GetMapping("/logs")
    public ResponseEntity<java.util.List<com.z7design.fleet_manager.model.PayslipDeliveryLog>> listarLogs(
            @RequestParam(value = "cpf", required = false) String cpf,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year) {
        return ResponseEntity.ok(envioService.listarLogs(cpf, month, year));
    }
} 
