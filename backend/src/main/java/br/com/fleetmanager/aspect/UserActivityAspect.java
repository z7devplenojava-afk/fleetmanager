package br.com.fleetmanager.aspect;

import br.com.fleetmanager.service.LogService;

import br.com.fleetmanager.annotation.LogUserActivity;

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
            System.out.println("🔍 UserActivityAspect: Interceptando método " + joinPoint.getSignature().getName());
            
            String action = logUserActivity.action();
            String details = logUserActivity.details();
            
            // Se details estiver vazio, usar o nome do método
            if (details.isEmpty()) {
                details = "Método: " + joinPoint.getSignature().getName();
            }
            
            System.out.println("🔍 UserActivityAspect: Registrando atividade - Action: " + action + ", Details: " + details);
            
            logService.logCurrentUserActivity(action, details);
            
            System.out.println("✅ UserActivityAspect: Atividade registrada com sucesso");
        } catch (Exception e) {
            // Log do erro mas não interromper o fluxo principal
            System.err.println("❌ Erro ao registrar atividade do usuário: " + e.getMessage());
            e.printStackTrace();
        }
    }
}