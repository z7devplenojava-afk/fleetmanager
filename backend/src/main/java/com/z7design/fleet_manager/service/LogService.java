package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.UserActivityLog;
import com.z7design.fleet_manager.model.ErrorLog;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.UserActivityLogRepository;
import com.z7design.fleet_manager.repository.ErrorLogRepository;
import com.z7design.fleet_manager.repository.UserRepository;
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

    @Transactional(noRollbackFor = Exception.class)
    public void logUserActivity(String username, String action, String details, String ipAddress, String userAgent, String sessionId) {
        try {
            // Validar parÃ¢metros bÃ¡sicos
            if (username == null || username.trim().isEmpty()) {
                System.out.println("âš ï¸ LogService: Username vazio ou null, pulando log");
                return;
            }

            System.out.println("ðŸ” LogService: Buscando usuÃ¡rio: " + username);

            UserActivityLog log = new UserActivityLog();

            // Buscar usuÃ¡rio pelo username (com timeout implÃ­cito)
            try {
                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent()) {
                    log.setUser(userOpt.get());
                    log.setUsername(username);
                    System.out.println("âœ… LogService: UsuÃ¡rio encontrado: " + userOpt.get().getId());
                } else {
                    System.out.println("âš ï¸ LogService: UsuÃ¡rio nÃ£o encontrado: " + username + " - salvando log sem referÃªncia de usuÃ¡rio");
                    // Salvar log mesmo sem usuÃ¡rio para rastreabilidade
                    log.setUsername(username);
                }
            } catch (Exception dbError) {
                System.err.println("âš ï¸ LogService: Erro ao buscar usuÃ¡rio no banco (nÃ£o crÃ­tico): " + dbError.getMessage());
                // Continuar mesmo sem usuÃ¡rio - salvar log com username apenas
                log.setUsername(username);
            }

            log.setAction(action != null ? action : "UNKNOWN");
            log.setDetails(details != null ? details : "");
            log.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
            log.setUserAgent(userAgent != null ? userAgent : "Unknown");
            log.setSessionId(sessionId != null ? sessionId : "session_unknown");
            log.setStatus("SUCCESS");
            log.setCreatedAt(LocalDateTime.now());

            System.out.println("ðŸ” LogService: Salvando log - Action: " + action + ", Details: " + details + ", IP: " + ipAddress);

            // Tentar salvar o log (pode falhar silenciosamente)
            try {
                UserActivityLog savedLog = userActivityLogRepository.save(log);
                System.out.println("âœ… LogService: Log salvo com ID: " + savedLog.getId());
            } catch (Exception saveError) {
                // Se falhar ao salvar, apenas logar o erro mas nÃ£o propagar
                System.err.println("âš ï¸ LogService: Erro ao salvar log no banco (nÃ£o crÃ­tico): " + saveError.getMessage());
                // NÃ£o propagar exceÃ§Ã£o - o log Ã© opcional
            }
        } catch (Exception e) {
            // Capturar qualquer exceÃ§Ã£o nÃ£o tratada e nÃ£o propagar
            System.err.println("âŒ LogService: Erro inesperado ao processar log (nÃ£o crÃ­tico): " + e.getMessage());
            // NÃ£o fazer printStackTrace em produÃ§Ã£o para evitar poluiÃ§Ã£o de logs
            // e.printStackTrace();
        }
    }

    @Transactional(noRollbackFor = Exception.class)
    public void logUserActivity(String username, String action, String details) {
        // MÃ©todo de compatibilidade - chama o novo mÃ©todo com valores padrÃ£o
        // Usar noRollbackFor para garantir que erros nÃ£o afetem transaÃ§Ãµes principais
        try {
            logUserActivity(username, action, details, "127.0.0.1", "Unknown", "session_unknown");
        } catch (Exception e) {
            // Garantir que exceÃ§Ãµes nÃ£o sejam propagadas
            System.err.println("âš ï¸ LogService: Erro no mÃ©todo de compatibilidade (nÃ£o crÃ­tico): " + e.getMessage());
        }
    }

    @Transactional
    public void logCurrentUserActivity(String action, String details) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("ðŸ” LogService: Verificando autenticaÃ§Ã£o...");

            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                System.out.println("ðŸ” LogService: UsuÃ¡rio autenticado: " + username);

                logUserActivity(username, action, details);
                System.out.println("âœ… LogService: Atividade registrada para usuÃ¡rio: " + username);
            } else {
                System.out.println("âš ï¸ LogService: UsuÃ¡rio nÃ£o autenticado ou authentication Ã© null");
            }
        } catch (Exception e) {
            System.err.println("âŒ LogService: Erro ao registrar atividade: " + e.getMessage());
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
