package com.z7design.fleet_manager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
@Slf4j
public class SecurityMonitoringService {
    
    // Cache para armazenar tentativas por IP
    private final Map<String, AttemptRecord> attemptsByIp = new ConcurrentHashMap<>();
    
    // Cache para armazenar padrÃµes suspeitos
    private final Map<String, Integer> suspiciousPatterns = new ConcurrentHashMap<>();
    
    // PadrÃµes de detecÃ§Ã£o
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|<script|eval\\(|alert\\(|document\\.|window\\.|location\\.|onload|onerror|onclick)"
    );
    
    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(?i)(<script|javascript:|vbscript:|onload|onerror|onclick|onmouseover|onfocus|onblur|<iframe|<object|<embed|<form|<input|<textarea|<select|<button)"
    );
    
    private static final Pattern COMMAND_INJECTION_PATTERN = Pattern.compile(
        "(?i)(\\||&|;|`|\\$\\{|\\(\\)|\\$\\()"
    );
    
    // Limites de seguranÃ§a
    private static final int MAX_ATTEMPTS_PER_HOUR = 5;
    private static final int MAX_ATTEMPTS_PER_DAY = 20;
    private static final int SUSPICIOUS_PATTERN_THRESHOLD = 3;
    
    /**
     * Registra uma tentativa de candidatura e verifica se Ã© suspeita
     */
    public SecurityCheckResult checkAttempt(String clientIp, String candidateData) {
        AttemptRecord record = attemptsByIp.computeIfAbsent(clientIp, k -> new AttemptRecord());
        
        // Verificar limites de tentativas
        if (isRateLimitExceeded(record)) {
            log.warn("ðŸš¨ Rate limit excedido para IP: {} - Tentativas: {}", clientIp, record.getAttemptsInLastHour());
            return SecurityCheckResult.rateLimitExceeded();
        }
        
        // Verificar padrÃµes maliciosos
        if (containsMaliciousPatterns(candidateData)) {
            log.error("ðŸš¨ PadrÃ£o malicioso detectado do IP: {} - PadrÃ£o: {}", clientIp, getDetectedPattern(candidateData));
            record.incrementSuspiciousAttempts();
            return SecurityCheckResult.maliciousPatternDetected();
        }
        
        // Verificar dados suspeitos
        if (isSuspiciousData(candidateData)) {
            log.warn("âš ï¸ Dados suspeitos detectados do IP: {} - Dados: {}", clientIp, sanitizeForLog(candidateData));
            record.incrementSuspiciousAttempts();
        }
        
        // Registrar tentativa vÃ¡lida
        record.recordAttempt();
        
        // Verificar se o IP deve ser bloqueado
        if (shouldBlockIp(record)) {
            log.error("ðŸš¨ IP bloqueado por mÃºltiplas tentativas suspeitas: {}", clientIp);
            return SecurityCheckResult.ipBlocked();
        }
        
        return SecurityCheckResult.allowed();
    }
    
    /**
     * Verifica se o IP excedeu o limite de tentativas
     */
    private boolean isRateLimitExceeded(AttemptRecord record) {
        return record.getAttemptsInLastHour() > MAX_ATTEMPTS_PER_HOUR ||
               record.getAttemptsInLastDay() > MAX_ATTEMPTS_PER_DAY;
    }
    
    /**
     * Verifica se os dados contÃªm padrÃµes maliciosos
     */
    private boolean containsMaliciousPatterns(String data) {
        if (data == null || data.isEmpty()) return false;
        
        return SQL_INJECTION_PATTERN.matcher(data).find() ||
               XSS_PATTERN.matcher(data).find() ||
               COMMAND_INJECTION_PATTERN.matcher(data).find();
    }
    
    /**
     * Verifica se os dados sÃ£o suspeitos
     */
    private boolean isSuspiciousData(String data) {
        if (data == null || data.isEmpty()) return false;
        
        // Verificar se contÃ©m muitos caracteres repetidos
        if (data.length() > 1000) return true;
        
        // Verificar se contÃ©m muitos caracteres especiais
        long specialChars = data.chars()
            .filter(ch -> !Character.isLetterOrDigit(ch) && !Character.isWhitespace(ch))
            .count();
        
        double specialCharRatio = (double) specialChars / data.length();
        return specialCharRatio > 0.3; // Mais de 30% de caracteres especiais
    }
    
    /**
     * Verifica se o IP deve ser bloqueado
     */
    private boolean shouldBlockIp(AttemptRecord record) {
        return record.getSuspiciousAttempts() >= SUSPICIOUS_PATTERN_THRESHOLD;
    }
    
    /**
     * ObtÃ©m o padrÃ£o detectado nos dados
     */
    private String getDetectedPattern(String data) {
        if (SQL_INJECTION_PATTERN.matcher(data).find()) {
            return "SQL Injection";
        }
        if (XSS_PATTERN.matcher(data).find()) {
            return "XSS";
        }
        if (COMMAND_INJECTION_PATTERN.matcher(data).find()) {
            return "Command Injection";
        }
        return "Unknown";
    }
    
    /**
     * Sanitiza dados para log (remove informaÃ§Ãµes sensÃ­veis)
     */
    private String sanitizeForLog(String data) {
        if (data == null) return "null";
        if (data.length() > 200) {
            return data.substring(0, 200) + "...";
        }
        return data.replaceAll("(?i)(password|senha|token|key|secret)", "***");
    }
    
    /**
     * Limpa registros antigos (pode ser chamado periodicamente)
     */
    public void cleanupOldRecords() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        attemptsByIp.entrySet().removeIf(entry -> 
            entry.getValue().getLastAttempt().isBefore(cutoff));
    }
    
    /**
     * ObtÃ©m estatÃ­sticas de seguranÃ§a
     */
    public Map<String, Object> getSecurityStats() {
        long totalIps = attemptsByIp.size();
        long blockedIps = attemptsByIp.values().stream()
            .filter(this::shouldBlockIp)
            .count();
        
        return Map.of(
            "totalIps", totalIps,
            "blockedIps", blockedIps,
            "suspiciousPatterns", suspiciousPatterns.size()
        );
    }
    
    /**
     * Classe interna para registrar tentativas
     */
    private static class AttemptRecord {
        private int attemptsInLastHour = 0;
        private int attemptsInLastDay = 0;
        private int suspiciousAttempts = 0;
        private LocalDateTime lastAttempt = LocalDateTime.now();
        
        public void recordAttempt() {
            LocalDateTime now = LocalDateTime.now();
            
            // Reset contadores se passou muito tempo
            if (now.isAfter(lastAttempt.plusHours(1))) {
                attemptsInLastHour = 0;
            }
            if (now.isAfter(lastAttempt.plusDays(1))) {
                attemptsInLastDay = 0;
            }
            
            attemptsInLastHour++;
            attemptsInLastDay++;
            lastAttempt = now;
        }
        
        public void incrementSuspiciousAttempts() {
            suspiciousAttempts++;
        }
        
        // Getters
        public int getAttemptsInLastHour() { return attemptsInLastHour; }
        public int getAttemptsInLastDay() { return attemptsInLastDay; }
        public int getSuspiciousAttempts() { return suspiciousAttempts; }
        public LocalDateTime getLastAttempt() { return lastAttempt; }
    }
    
    /**
     * Resultado da verificaÃ§Ã£o de seguranÃ§a
     */
    public static class SecurityCheckResult {
        private final boolean allowed;
        private final String reason;
        private final boolean shouldBlock;
        
        private SecurityCheckResult(boolean allowed, String reason, boolean shouldBlock) {
            this.allowed = allowed;
            this.reason = reason;
            this.shouldBlock = shouldBlock;
        }
        
        public static SecurityCheckResult allowed() {
            return new SecurityCheckResult(true, "OK", false);
        }
        
        public static SecurityCheckResult rateLimitExceeded() {
            return new SecurityCheckResult(false, "Rate limit exceeded", false);
        }
        
        public static SecurityCheckResult maliciousPatternDetected() {
            return new SecurityCheckResult(false, "Malicious pattern detected", true);
        }
        
        public static SecurityCheckResult ipBlocked() {
            return new SecurityCheckResult(false, "IP blocked", true);
        }
        
        // Getters
        public boolean isAllowed() { return allowed; }
        public String getReason() { return reason; }
        public boolean shouldBlock() { return shouldBlock; }
    }
} 
