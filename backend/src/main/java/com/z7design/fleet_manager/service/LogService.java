package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.UserActivityLog;
import com.z7design.fleet_manager.model.ErrorLog;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserActivityLogRepository;
import com.z7design.fleet_manager.repository.ErrorLogRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class LogService {

    private static final Logger log = LoggerFactory.getLogger(LogService.class);

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

    @Async("taskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public void logUserActivity(String username, String action, String details, String ipAddress, String userAgent, String sessionId) {
        try {
            if (username == null || username.trim().isEmpty()) {
                return;
            }

            UserActivityLog activityLog = new UserActivityLog();

            try {
                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent()) {
                    activityLog.setUser(userOpt.get());
                }
            } catch (Exception dbError) {
                log.debug("Erro não-crítico ao buscar usuário para log: {}", dbError.getMessage());
            }

            activityLog.setUsername(username);
            activityLog.setAction(action != null ? action : "UNKNOWN");
            activityLog.setDetails(details != null ? details : "");
            activityLog.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
            activityLog.setUserAgent(userAgent != null ? userAgent : "Unknown");
            activityLog.setSessionId(sessionId != null ? sessionId : "session_unknown");
            activityLog.setStatus("SUCCESS");
            activityLog.setCreatedAt(LocalDateTime.now());

            userActivityLogRepository.save(activityLog);
        } catch (Exception e) {
            log.debug("Erro ao processar log de atividade: {}", e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public void logUserActivity(String username, String action, String details) {
        try {
            logUserActivity(username, action, details, "127.0.0.1", "Unknown", "session_unknown");
        } catch (Exception e) {
            log.debug("Erro ao logar atividade: {}", e.getMessage());
        }
    }

    public void logCurrentUserActivity(String action, String details) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                String username = authentication.getName();
                logUserActivity(username, action, details);
            }
        } catch (Exception e) {
            log.debug("Erro ao registrar atividade do usuário atual: {}", e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logError(String message, String stackTrace, String endpoint) {
        try {
            ErrorLog errorLog = new ErrorLog();
            errorLog.setMessage(message);
            errorLog.setStackTrace(stackTrace);
            errorLog.setEndpoint(endpoint);
            errorLog.setTimestamp(LocalDateTime.now());

            errorLogRepository.save(errorLog);
        } catch (Exception e) {
            log.warn("Erro ao salvar log de erro: {}", e.getMessage());
        }
    }
}
