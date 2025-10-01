package br.com.fleetmanager.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotação customizada para verificar permissões operacionais específicas
 * Pode ser usada em métodos de service ou controller
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface HasOperationalPermission {
    
    /**
     * Permissão específica requerida
     */
    OperationalPermission value();
    
    /**
     * Permissões alternativas (OR lógico)
     */
    OperationalPermission[] any() default {};
    
    /**
     * Todas as permissões devem ser atendidas (AND lógico)
     */
    OperationalPermission[] all() default {};
    
    /**
     * Mensagem de erro personalizada
     */
    String message() default "Acesso negado: permissão insuficiente";
}
