package com.z7design.fleet_manager.interceptor;

import com.z7design.fleet_manager.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class UserActivityInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(UserActivityInterceptor.class);

    private final LogService logService;

    public UserActivityInterceptor(LogService logService) {
        this.logService = logService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler) throws Exception {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !"anonymousUser".equals(authentication.getName())) {

                String username = authentication.getName();
                String action = getActionFromRequest(request);
                String module = getModuleFromRequest(request);
                String details = getDetailsFromRequest(request);
                String ipAddress = getClientIpAddress(request);
                String userAgent = request.getHeader("User-Agent");
                String sessionId = request.getSession().getId();

                // Registra a atividade usando o LogService existente
                logService.logUserActivity(username, action, details, ipAddress, userAgent, sessionId);

                System.out.println(
                        "Atividade registrada: " + username + " - " + action + " - " + module + " - IP: " + ipAddress);
            }
        } catch (Exception e) {
            log.error("Erro ao registrar atividade: {}", e.getMessage(), e);
        }

        return true;
    }

    /**
     * Extrai a aÃ§Ã£o da requisiÃ§Ã£o
     */
    private String getActionFromRequest(HttpServletRequest request) {
        String method = request.getMethod();

        // Mapeia mÃ©todos HTTP para aÃ§Ãµes
        switch (method) {
            case "GET":
                return "CONSULTAR";
            case "POST":
                return "CRIAR";
            case "PUT":
                return "ATUALIZAR";
            case "DELETE":
                return "EXCLUIR";
            case "PATCH":
                return "ATUALIZAR_PARCIAL";
            default:
                return method;
        }
    }

    /**
     * Extrai o mÃ³dulo da requisiÃ§Ã£o
     */
    private String getModuleFromRequest(HttpServletRequest request) {
        String path = request.getRequestURI();

        if (path.startsWith("/api/employees")) {
            return "FUNCIONARIOS";
        } else if (path.startsWith("/api/users")) {
            return "USUARIOS";
        } else if (path.startsWith("/api/roles")) {
            return "PERMISSOES";
        } else if (path.startsWith("/api/units")) {
            return "UNIDADES";
        } else if (path.startsWith("/api/positions")) {
            return "CARGOS";
        } else if (path.startsWith("/api/vehicles")) {
            return "VEICULOS";
        } else if (path.startsWith("/api/fuel")) {
            return "COMBUSTIVEL";
        } else if (path.startsWith("/api/inventory")) {
            return "ESTOQUE";
        } else if (path.startsWith("/api/financial")) {
            return "FINANCEIRO";
        } else if (path.startsWith("/api/commercial")) {
            return "COMERCIAL";
        } else if (path.startsWith("/api/hr")) {
            return "RECURSOS_HUMANOS";
        } else if (path.startsWith("/api/activity-logs")) {
            return "LOGS_ATIVIDADE";
        } else if (path.startsWith("/api/auth")) {
            return "AUTENTICACAO";
        } else {
            return "OUTROS";
        }
    }

    /**
     * Extrai o IP do cliente considerando proxies e load balancers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // X-Forwarded-For pode conter mÃºltiplos IPs separados por vÃ­rgula
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        String xForwardedProto = request.getHeader("X-Forwarded-Proto");
        if (xForwardedProto != null && !xForwardedProto.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedProto)) {
            return request.getRemoteAddr();
        }

        return request.getRemoteAddr();
    }

    /**
     * Extrai detalhes da requisiÃ§Ã£o
     */
    private String getDetailsFromRequest(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        String queryString = request.getQueryString();

        StringBuilder details = new StringBuilder();
        details.append(method).append(" ").append(path);

        if (queryString != null && !queryString.isEmpty()) {
            details.append("?").append(queryString);
        }

        return details.toString();
    }
}
