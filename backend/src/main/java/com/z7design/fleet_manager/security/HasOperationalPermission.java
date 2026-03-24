package com.z7design.fleet_manager.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * AnotaÃ§Ã£o customizada para verificar permissÃµes operacionais especÃ­ficas
 * Pode ser usada em mÃ©todos de service ou controller
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface HasOperationalPermission {
    
    /**
     * PermissÃ£o especÃ­fica requerida
     */
    OperationalPermission value();
    
    /**
     * PermissÃµes alternativas (OR lÃ³gico)
     */
    OperationalPermission[] any() default {};
    
    /**
     * Todas as permissÃµes devem ser atendidas (AND lÃ³gico)
     */
    OperationalPermission[] all() default {};
    
    /**
     * Mensagem de erro personalizada
     */
    String message() default "Acesso negado: permissÃ£o insuficiente";
}

