package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.EnvioRequest;
import br.com.fleetmanager.dto.EnvioResponse;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.Payslip;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.PayslipRepository;
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
        log.info("🚀 Iniciando processamento e envio unificado para arquivo: {}", file.getOriginalFilename());
        
        ProcessingResult result = new ProcessingResult();
        result.setStartTime(LocalDateTime.now());
        result.setFileName(file.getOriginalFilename());
        
        try {
            // 1. Processar PDF
            log.info("📄 Processando PDF...");
            List<Payslip> payslips = payslipService.processPayslipPDF(file);
            result.setPayslipsProcessed(payslips.size());
            result.setProcessingSuccess(true);
            
            // 2. Verificar se há funcionários para envio
            List<Employee> employees = employeeRepository.findAll();
            if (employees.isEmpty()) {
                result.setMessage("PDF processado com sucesso, mas nenhum funcionário encontrado para envio");
                result.setEndTime(LocalDateTime.now());
                return result;
            }
            
            // 3. Enviar automaticamente
            log.info("📤 Iniciando envio automático para {} funcionários", employees.size());
            EnvioResponse envioResponse = envioService.enviarTodosPorTipo(envioRequest);
            
            // 4. Configurar resultado
            result.setEnvioResponse(envioResponse);
            result.setTotalEnviados(envioResponse.getTotalEnviados());
            result.setTotalFalhas(envioResponse.getTotalFalhas());
            result.setEnvioSuccess(envioResponse.isSucesso());
            result.setMessage(String.format("Processamento e envio concluídos. %d holerites processados, %d enviados, %d falhas", 
                    payslips.size(), envioResponse.getTotalEnviados(), envioResponse.getTotalFalhas()));
            
        } catch (Exception e) {
            log.error("❌ Erro no processamento e envio unificado: {}", e.getMessage());
            result.setProcessingSuccess(false);
            result.setEnvioSuccess(false);
            result.setMessage("Erro: " + e.getMessage());
        }
        
        result.setEndTime(LocalDateTime.now());
        return result;
    }
    
    /**
     * Processa PDF e envia para funcionários específicos
     */
    public ProcessingResult uploadProcessAndSendToSpecific(MultipartFile file, EnvioRequest envioRequest) {
        log.info("🚀 Iniciando processamento e envio específico para arquivo: {}", file.getOriginalFilename());
        
        ProcessingResult result = new ProcessingResult();
        result.setStartTime(LocalDateTime.now());
        result.setFileName(file.getOriginalFilename());
        
        try {
            // 1. Processar PDF
            log.info("📄 Processando PDF...");
            List<Payslip> payslips = payslipService.processPayslipPDF(file);
            result.setPayslipsProcessed(payslips.size());
            result.setProcessingSuccess(true);
            
            // 2. Enviar para funcionários específicos
            EnvioResponse envioResponse;
            if (envioRequest.getFuncionarioId() != null) {
                log.info("📤 Enviando para funcionário específico ID: {}", envioRequest.getFuncionarioId());
                envioResponse = envioService.enviarIndividual(envioRequest);
            } else if (envioRequest.getFuncionarioIds() != null && !envioRequest.getFuncionarioIds().isEmpty()) {
                log.info("📤 Enviando para {} funcionários específicos", envioRequest.getFuncionarioIds().size());
                envioResponse = envioService.enviarEmMassa(envioRequest);
            } else {
                log.info("📤 Enviando para todos os funcionários");
                envioResponse = envioService.enviarTodosPorTipo(envioRequest);
            }
            
            // 3. Configurar resultado
            result.setEnvioResponse(envioResponse);
            result.setTotalEnviados(envioResponse.getTotalEnviados());
            result.setTotalFalhas(envioResponse.getTotalFalhas());
            result.setEnvioSuccess(envioResponse.isSucesso());
            result.setMessage(String.format("Processamento e envio concluídos. %d holerites processados, %d enviados, %d falhas", 
                    payslips.size(), envioResponse.getTotalEnviados(), envioResponse.getTotalFalhas()));
            
        } catch (Exception e) {
            log.error("❌ Erro no processamento e envio específico: {}", e.getMessage());
            result.setProcessingSuccess(false);
            result.setEnvioSuccess(false);
            result.setMessage("Erro: " + e.getMessage());
        }
        
        result.setEndTime(LocalDateTime.now());
        return result;
    }
    
    /**
     * Processamento assíncrono com notificação de progresso
     */
    @Async
    public CompletableFuture<ProcessingResult> processAsync(MultipartFile file, EnvioRequest envioRequest) {
        log.info("🔄 Iniciando processamento assíncrono para: {}", file.getOriginalFilename());
        
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
                result.setMessage("Processamento assíncrono concluído com sucesso");
                
            } catch (Exception e) {
                log.error("❌ Erro no processamento assíncrono: {}", e.getMessage());
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
        // TODO: Implementar cache/banco para status de sessões
        return new ProcessingStatus(sessionId, "UNKNOWN", "Status não disponível");
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