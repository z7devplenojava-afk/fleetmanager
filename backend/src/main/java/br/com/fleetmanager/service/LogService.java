package br.com.fleetmanager.service;

import br.com.fleetmanager.model.UserActivityLog;
import br.com.fleetmanager.model.ErrorLog;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.repository.UserActivityLogRepository;
import br.com.fleetmanager.repository.ErrorLogRepository;
import br.com.fleetmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class LogService {

    private final UserActivityLogRepository userActivityLogRepository;
    private final ErrorLogRepository errorLogRepository;
    private final UserRepository userRepository;

    @Autowired
    public LogService(UserActivityLogRepository userActivityLogRepository,
            ErrorLogRepository errorLogRepository,
            UserRepository userRepository) {
        this.userActivityLogRepository = userActivityLogRepository;
        this.errorLogRepository = errorLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void logUserActivity(String username, String action, String details, String ipAddress, String userAgent, String sessionId) {
        try {
            System.out.println("🔍 LogService: Buscando usuário: " + username);

            UserActivityLog log = new UserActivityLog();

            // Buscar usuário pelo username
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) {
                log.setUser(userOpt.get());
                log.setUsername(username);
                System.out.println("✅ LogService: Usuário encontrado: " + userOpt.get().getId());
            } else {
                System.out.println("⚠️ LogService: Usuário não encontrado: " + username);
                return; // Não salvar log se usuário não for encontrado
            }

            log.setAction(action);
            log.setDetails(details);
            log.setIpAddress(ipAddress);
            log.setUserAgent(userAgent);
            log.setSessionId(sessionId);
            log.setStatus("SUCCESS"); // Status padrão para atividades registradas pelo interceptor
            log.setCreatedAt(LocalDateTime.now());

            System.out.println("🔍 LogService: Salvando log - Action: " + action + ", Details: " + details + ", IP: " + ipAddress);

            UserActivityLog savedLog = userActivityLogRepository.save(log);

            System.out.println("✅ LogService: Log salvo com ID: " + savedLog.getId());
        } catch (Exception e) {
            System.err.println("❌ LogService: Erro ao salvar log: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void logUserActivity(String username, String action, String details) {
        // Método de compatibilidade - chama o novo método com valores padrão
        logUserActivity(username, action, details, "127.0.0.1", "Unknown", "session_unknown");
    }

    @Transactional
    public void logCurrentUserActivity(String action, String details) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("🔍 LogService: Verificando autenticação...");

            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                System.out.println("🔍 LogService: Usuário autenticado: " + username);

                logUserActivity(username, action, details);
                System.out.println("✅ LogService: Atividade registrada para usuário: " + username);
            } else {
                System.out.println("⚠️ LogService: Usuário não autenticado ou authentication é null");
            }
        } catch (Exception e) {
            System.err.println("❌ LogService: Erro ao registrar atividade: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void logError(String message, String stackTrace, String endpoint) {
        ErrorLog log = new ErrorLog();
        log.setMessage(message);
        log.setStackTrace(stackTrace);
        log.setEndpoint(endpoint);
        log.setTimestamp(LocalDateTime.now());

        errorLogRepository.save(log);
    }
}