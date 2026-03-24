package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EnvioRequest;
import com.z7design.fleet_manager.dto.EnvioResponse;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayslipProcessingService {
    
    private final PayslipService payslipService;
    private final EnvioService envioService;
    private final EmployeeRepository employeeRepository;
    private final PayslipRepository payslipRepository;
    
    /**
     * Processa PDF e envia automaticamente os holerites
     */
    public ProcessingResult uploadProcessAndSend(MultipartFile file, EnvioRequest envioRequest) {
        log.info("ðŸš€ Iniciando processamento e envio unificado para arquivo: {}", file.getOriginalFilename());
        
        ProcessingResult result = new ProcessingResult();
        result.setStartTime(LocalDateTime.now());
        result.setFileName(file.getOriginalFilename());
        
        try {
            // 1. Processar PDF
            log.info("ðŸ“„ Processando PDF...");
            List<Payslip> payslips = payslipService.processPayslipPDF(file);
            result.setPayslipsProcessed(payslips.size());
            result.setProcessingSuccess(true);
            
            // 2. Verificar se hÃ¡ funcionÃ¡rios para envio
            List<Employee> employees = employeeRepository.findAll();
            if (employees.isEmpty()) {
                result.setMessage("PDF processado com sucesso, mas nenhum funcionÃ¡rio encontrado para envio");
                result.setEndTime(LocalDateTime.now());
                return result;
            }
            
            // 3. Enviar automaticamente
            log.info("ðŸ“¤ Iniciando envio automÃ¡tico para {} funcionÃ¡rios", employees.size());
            EnvioResponse envioResponse = envioService.enviarTodosPorTipo(envioRequest);
            
            // 4. Configurar resultado
            result.setEnvioResponse(envioResponse);
            result.setTotalEnviados(envioResponse.getTotalEnviados());
            result.setTotalFalhas(envioResponse.getTotalFalhas());
            result.setEnvioSuccess(envioResponse.isSucesso());
            result.setMessage(String.format("Processamento e envio concluÃ­dos. %d holerites processados, %d enviados, %d falhas", 
                    payslips.size(), envioResponse.getTotalEnviados(), envioResponse.getTotalFalhas()));
            
        } catch (Exception e) {
            log.error("âŒ Erro no processamento e envio unificado: {}", e.getMessage());
            result.setProcessingSuccess(false);
            result.setEnvioSuccess(false);
            result.setMessage("Erro: " + e.getMessage());
        }
        
        result.setEndTime(LocalDateTime.now());
        return result;
    }
    
    /**
     * Processa PDF e envia para funcionÃ¡rios especÃ­ficos
     */
    public ProcessingResult uploadProcessAndSendToSpecific(MultipartFile file, EnvioRequest envioRequest) {
        log.info("ðŸš€ Iniciando processamento e envio especÃ­fico para arquivo: {}", file.getOriginalFilename());
        
        ProcessingResult result = new ProcessingResult();
        result.setStartTime(LocalDateTime.now());
        result.setFileName(file.getOriginalFilename());
        
        try {
            // 1. Processar PDF
            log.info("ðŸ“„ Processando PDF...");
            List<Payslip> payslips = payslipService.processPayslipPDF(file);
            result.setPayslipsProcessed(payslips.size());
            result.setProcessingSuccess(true);
            
            // 2. Enviar para funcionÃ¡rios especÃ­ficos
            EnvioResponse envioResponse;
            if (envioRequest.getFuncionarioId() != null) {
                log.info("ðŸ“¤ Enviando para funcionÃ¡rio especÃ­fico ID: {}", envioRequest.getFuncionarioId());
                envioResponse = envioService.enviarIndividual(envioRequest);
            } else if (envioRequest.getFuncionarioIds() != null && !envioRequest.getFuncionarioIds().isEmpty()) {
                log.info("ðŸ“¤ Enviando para {} funcionÃ¡rios especÃ­ficos", envioRequest.getFuncionarioIds().size());
                envioResponse = envioService.enviarEmMassa(envioRequest);
            } else {
                log.info("ðŸ“¤ Enviando para todos os funcionÃ¡rios");
                envioResponse = envioService.enviarTodosPorTipo(envioRequest);
            }
            
            // 3. Configurar resultado
            result.setEnvioResponse(envioResponse);
            result.setTotalEnviados(envioResponse.getTotalEnviados());
            result.setTotalFalhas(envioResponse.getTotalFalhas());
            result.setEnvioSuccess(envioResponse.isSucesso());
            result.setMessage(String.format("Processamento e envio concluÃ­dos. %d holerites processados, %d enviados, %d falhas", 
                    payslips.size(), envioResponse.getTotalEnviados(), envioResponse.getTotalFalhas()));
            
        } catch (Exception e) {
            log.error("âŒ Erro no processamento e envio especÃ­fico: {}", e.getMessage());
            result.setProcessingSuccess(false);
            result.setEnvioSuccess(false);
            result.setMessage("Erro: " + e.getMessage());
        }
        
        result.setEndTime(LocalDateTime.now());
        return result;
    }
    
    /**
     * Processamento assÃ­ncrono com notificaÃ§Ã£o de progresso
     */
    @Async
    public CompletableFuture<ProcessingResult> processAsync(MultipartFile file, EnvioRequest envioRequest) {
        log.info("ðŸ”„ Iniciando processamento assÃ­ncrono para: {}", file.getOriginalFilename());
        
        return CompletableFuture.supplyAsync(() -> {
            ProcessingResult result = new ProcessingResult();
            result.setStartTime(LocalDateTime.now());
            result.setFileName(file.getOriginalFilename());
            result.setStatus("PROCESSING");
            
            try {
                // 1. Processar PDF
                result.setStatus("PROCESSING_PDF");
                List<Payslip> payslips = payslipService.processPayslipPDF(file);
                result.setPayslipsProcessed(payslips.size());
                result.setProcessingSuccess(true);
                
                // 2. Preparar envio
                result.setStatus("PREPARING_SEND");
                
                // 3. Enviar
                result.setStatus("SENDING");
                EnvioResponse envioResponse = envioService.enviarTodosPorTipo(envioRequest);
                
                // 4. Finalizar
                result.setEnvioResponse(envioResponse);
                result.setTotalEnviados(envioResponse.getTotalEnviados());
                result.setTotalFalhas(envioResponse.getTotalFalhas());
                result.setEnvioSuccess(envioResponse.isSucesso());
                result.setStatus("COMPLETED");
                result.setMessage("Processamento assÃ­ncrono concluÃ­do com sucesso");
                
            } catch (Exception e) {
                log.error("âŒ Erro no processamento assÃ­ncrono: {}", e.getMessage());
                result.setStatus("ERROR");
                result.setProcessingSuccess(false);
                result.setEnvioSuccess(false);
                result.setMessage("Erro: " + e.getMessage());
            }
            
            result.setEndTime(LocalDateTime.now());
            return result;
        });
    }
    
    /**
     * Verifica status do processamento
     */
    public ProcessingStatus getStatus(String sessionId) {
        // TODO: Implementar cache/banco para status de sessÃµes
        return new ProcessingStatus(sessionId, "UNKNOWN", "Status nÃ£o disponÃ­vel");
    }
    
    // Classes de resultado
    public static class ProcessingResult {
        private String fileName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private boolean processingSuccess;
        private boolean envioSuccess;
        private int payslipsProcessed;
        private int totalEnviados;
        private int totalFalhas;
        private String message;
        private String status;
        private EnvioResponse envioResponse;
        
        // Getters e Setters
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        
        public boolean isProcessingSuccess() { return processingSuccess; }
        public void setProcessingSuccess(boolean processingSuccess) { this.processingSuccess = processingSuccess; }
        
        public boolean isEnvioSuccess() { return envioSuccess; }
        public void setEnvioSuccess(boolean envioSuccess) { this.envioSuccess = envioSuccess; }
        
        public int getPayslipsProcessed() { return payslipsProcessed; }
        public void setPayslipsProcessed(int payslipsProcessed) { this.payslipsProcessed = payslipsProcessed; }
        
        public int getTotalEnviados() { return totalEnviados; }
        public void setTotalEnviados(int totalEnviados) { this.totalEnviados = totalEnviados; }
        
        public int getTotalFalhas() { return totalFalhas; }
        public void setTotalFalhas(int totalFalhas) { this.totalFalhas = totalFalhas; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public EnvioResponse getEnvioResponse() { return envioResponse; }
        public void setEnvioResponse(EnvioResponse envioResponse) { this.envioResponse = envioResponse; }
        
        public long getDurationMs() {
            if (startTime != null && endTime != null) {
                return java.time.Duration.between(startTime, endTime).toMillis();
            }
            return 0;
        }
    }
    
    public static class ProcessingStatus {
        private String sessionId;
        private String status;
        private String message;
        
        public ProcessingStatus(String sessionId, String status, String message) {
            this.sessionId = sessionId;
            this.status = status;
            this.message = message;
        }
        
        public String getSessionId() { return sessionId; }
        public String getStatus() { return status; }
        public String getMessage() { return message; }
    }
} 
