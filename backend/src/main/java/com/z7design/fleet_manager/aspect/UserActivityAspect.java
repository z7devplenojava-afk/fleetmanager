package com.z7design.fleet_manager.aspect;

import com.z7design.fleet_manager.annotation.LogUserActivity;
import com.z7design.fleet_manager.service.LogService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class UserActivityAspect {

    private final LogService logService;

    @Autowired
    public UserActivityAspect(LogService logService) {
        this.logService = logService;
    }

    @AfterReturning("@annotation(logUserActivity)")
    public void logActivity(JoinPoint joinPoint, LogUserActivity logUserActivity) {
        try {
            System.out.println("ðŸ” UserActivityAspect: Interceptando mÃ©todo " + joinPoint.getSignature().getName());
            
            String action = logUserActivity.action();
            String details = logUserActivity.details();
            
            // Se details estiver vazio, usar o nome do mÃ©todo
            if (details.isEmpty()) {
                details = "MÃ©todo: " + joinPoint.getSignature().getName();
            }
            
            System.out.println("ðŸ” UserActivityAspect: Registrando atividade - Action: " + action + ", Details: " + details);
            
            logService.logCurrentUserActivity(action, details);
            
            System.out.println("âœ… UserActivityAspect: Atividade registrada com sucesso");
        } catch (Exception e) {
            // Log do erro mas nÃ£o interromper o fluxo principal
            System.err.println("âŒ Erro ao registrar atividade do usuÃ¡rio: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
