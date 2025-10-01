package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.FacialAuthRequest;
import br.com.fleetmanager.dto.FacialAuthResponse;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.FacialEmbedding;
import br.com.fleetmanager.model.FacialLoginAttempt;
import br.com.fleetmanager.model.Role;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.FacialEmbeddingRepository;
import br.com.fleetmanager.repository.FacialLoginAttemptRepository;
import br.com.fleetmanager.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FacialAuthService {
    
    private final FacialEmbeddingRepository facialEmbeddingRepository;
    private final FacialLoginAttemptRepository facialLoginAttemptRepository;
    private final EmployeeRepository employeeRepository;
    private final JwtService jwtService;
    private final EncryptionService encryptionService;
    
    // Configurações de segurança
    private static final double MIN_CONFIDENCE_SCORE = 0.6;
    private static final double MAX_GEOLOCATION_DISTANCE_KM = 5.0; // 5km de tolerância
    
    /**
     * Autentica supervisor por reconhecimento facial
     */
    public FacialAuthResponse authenticateByFace(FacialAuthRequest request, String clientIp, String userAgent) {
        log.info("Iniciando autenticação facial para coordenadas: {}, {}", 
                request.getLatitude(), request.getLongitude());
        
        try {
            // 1. Descriptografar embedding
            String decryptedEmbedding = encryptionService.decryptEmbedding(request.getEncryptedEmbedding());
            
            // 2. Buscar melhor match de embedding
            Optional<FacialEmbedding> match = facialEmbeddingRepository.findBestMatch(MIN_CONFIDENCE_SCORE);
            
            if (match.isEmpty()) {
                log.warn("Nenhum embedding facial encontrado com score mínimo de {}", MIN_CONFIDENCE_SCORE);
                return recordFailedAttempt(null, request, clientIp, userAgent, 
                    FacialLoginAttempt.FacialLoginFailureReason.INVALID_EMBEDDING);
            }
            
            FacialEmbedding embedding = match.get();
            
            // 3. Verificar se o embedding está ativo
            if (!embedding.getIsActive()) {
                log.warn("Embedding facial inativo para supervisor: {}", embedding.getSupervisor().getId());
                return recordFailedAttempt(embedding.getSupervisor().getId(), request, clientIp, userAgent,
                    FacialLoginAttempt.FacialLoginFailureReason.INACTIVE_EMBEDDING);
            }
            
            // 4. Verificar liveness
            if (!embedding.getLivenessVerified()) {
                log.warn("Embedding não passou na verificação de liveness para supervisor: {}", 
                    embedding.getSupervisor().getId());
                return recordFailedAttempt(embedding.getSupervisor().getId(), request, clientIp, userAgent,
                    FacialLoginAttempt.FacialLoginFailureReason.LIVENESS_FAILED);
            }
            
            // 5. Validar geolocalização
            if (!validateGeolocation(embedding.getSupervisor(), 
                request.getLatitude().doubleValue(), 
                request.getLongitude().doubleValue())) {
                log.warn("Geolocalização não confere para supervisor: {}", embedding.getSupervisor().getId());
                return recordFailedAttempt(embedding.getSupervisor().getId(), request, clientIp, userAgent,
                    FacialLoginAttempt.FacialLoginFailureReason.GEOLOCATION_MISMATCH);
            }
            
            // 6. Gerar JWT token
            String token = jwtService.generateToken(embedding.getSupervisor().getUser());
            
            // 7. Atualizar último uso do embedding
            embedding.setLastUsed(LocalDateTime.now());
            facialEmbeddingRepository.save(embedding);
            
            // 8. Registrar tentativa bem-sucedida
            recordSuccessfulAttempt(embedding.getSupervisor().getId(), request, clientIp, userAgent,
                embedding.getConfidenceScore());
            
            log.info("Autenticação facial bem-sucedida para supervisor: {}", 
                embedding.getSupervisor().getName());
            
            return FacialAuthResponse.success(
                token,
                embedding.getSupervisor().getId(),
                embedding.getSupervisor().getName(),
                embedding.getSupervisor().getUser().getEmail(),
                embedding.getConfidenceScore()
            );
            
        } catch (Exception e) {
            log.error("Erro na autenticação facial", e);
            return recordFailedAttempt(null, request, clientIp, userAgent,
                FacialLoginAttempt.FacialLoginFailureReason.SYSTEM_ERROR);
        }
    }
    
    /**
     * Registra novo embedding facial para supervisor
     */
    public FacialAuthResponse registerFacialEmbedding(UUID supervisorId, String embeddingData, 
                                                     BigDecimal confidenceScore, boolean livenessVerified) {
        try {
            // Verificar se supervisor existe e tem role SUPERVISOR
            Employee supervisor = employeeRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor não encontrado"));
            
            // Verificar se tem role SUPERVISOR
            boolean hasSupervisorRole = supervisor.getUser().getRoles().stream()
                .anyMatch(role -> "SUPERVISOR".equals(role.getName()));
            
            if (!hasSupervisorRole) {
                throw new RuntimeException("Usuário não possui role SUPERVISOR");
            }
            
            // Criptografar embedding
            String encryptedEmbedding = encryptionService.encryptEmbedding(embeddingData);
            String embeddingHash = encryptionService.generateHash(embeddingData);
            
            // Criar novo embedding
            FacialEmbedding facialEmbedding = FacialEmbedding.builder()
                .supervisor(supervisor)
                .encryptedEmbedding(encryptedEmbedding)
                .embeddingHash(embeddingHash)
                .confidenceScore(confidenceScore)
                .livenessVerified(livenessVerified)
                .isActive(true)
                .build();
            
            facialEmbeddingRepository.save(facialEmbedding);
            
            log.info("Embedding facial registrado com sucesso para supervisor: {}", supervisor.getName());
            
            return FacialAuthResponse.success(
                null, // Sem token para registro
                supervisorId,
                supervisor.getName(),
                supervisor.getUser().getEmail(),
                confidenceScore
            );
            
        } catch (Exception e) {
            log.error("Erro ao registrar embedding facial", e);
            return FacialAuthResponse.failure("Erro ao registrar embedding facial", e.getMessage());
        }
    }
    
    /**
     * Valida geolocalização do supervisor
     */
    private boolean validateGeolocation(Employee supervisor, double latitude, double longitude) {
        // TODO: Implementar validação real de geolocalização
        // Por enquanto, aceita qualquer localização
        // Em produção, verificar se está próximo ao posto designado
        
        log.debug("Validando geolocalização para supervisor: {} em {}, {}", 
            supervisor.getName(), latitude, longitude);
        
        return true; // Placeholder - implementar validação real
    }
    
    /**
     * Registra tentativa falhada
     */
    private FacialAuthResponse recordFailedAttempt(UUID supervisorId, FacialAuthRequest request, 
                                                 String clientIp, String userAgent,
                                                 FacialLoginAttempt.FacialLoginFailureReason failureReason) {
        try {
            Employee supervisor = null;
            if (supervisorId != null) {
                supervisor = employeeRepository.findById(supervisorId).orElse(null);
            }
            
            FacialLoginAttempt attempt = FacialLoginAttempt.builder()
                .supervisor(supervisor)
                .success(false)
                .confidenceScore(request.getEncryptedEmbedding() != null ? BigDecimal.valueOf(0.0) : null)
                .latitude(request.getLatitude().doubleValue())
                .longitude(request.getLongitude().doubleValue())
                .ipAddress(clientIp)
                .userAgent(userAgent)
                .failureReason(failureReason.name())
                .build();
            
            facialLoginAttemptRepository.save(attempt);
            
            log.warn("Tentativa de login facial falhou: {}", failureReason.getDescription());
            
        } catch (Exception e) {
            log.error("Erro ao registrar tentativa falhada", e);
        }
        
        return FacialAuthResponse.failure("Autenticação facial falhou", failureReason.getDescription());
    }
    
    /**
     * Registra tentativa bem-sucedida
     */
    private void recordSuccessfulAttempt(UUID supervisorId, FacialAuthRequest request, 
                                       String clientIp, String userAgent, BigDecimal confidenceScore) {
        try {
            Employee supervisor = employeeRepository.findById(supervisorId).orElse(null);
            
            FacialLoginAttempt attempt = FacialLoginAttempt.builder()
                .supervisor(supervisor)
                .success(true)
                .confidenceScore(confidenceScore)
                .latitude(request.getLatitude().doubleValue())
                .longitude(request.getLongitude().doubleValue())
                .ipAddress(clientIp)
                .userAgent(userAgent)
                .build();
            
            facialLoginAttemptRepository.save(attempt);
            
        } catch (Exception e) {
            log.error("Erro ao registrar tentativa bem-sucedida", e);
        }
    }
    
    /**
     * Busca estatísticas de autenticação facial
     */
    public Object[] getSupervisorStats(UUID supervisorId, LocalDateTime startTime) {
        return facialLoginAttemptRepository.getSupervisorStats(supervisorId, startTime);
    }
    
    /**
     * Busca tentativas suspeitas
     */
    public List<FacialLoginAttempt> getSuspiciousAttempts(String ipAddress, LocalDateTime startTime) {
        return facialLoginAttemptRepository.findSuspiciousAttempts(ipAddress, startTime);
    }
    
    /**
     * Limpa tentativas antigas
     */
    public void cleanupOldAttempts(LocalDateTime cutoffDate) {
        facialLoginAttemptRepository.deleteOldAttempts(cutoffDate);
    }
}
