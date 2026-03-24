package com.z7design.fleet_manager.util;

import lombok.extern.slf4j.Slf4j;

/**
 * UtilitÃ¡rio para determinar roles baseado em padrÃµes de email
 */
@Slf4j
public class RoleAssignmentUtil {

    /**
     * Verifica se o email Ã© de um colaborador baseado no padrÃ£o
     * colaborador.*@promovervigilancia.com.br
     */
    public static boolean isColaboradorEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        boolean matches = email.matches("colaborador\\..*@promovervigilancia\\.com\\.br");
        
        if (matches) {
            log.info("âœ… Email identificado como COLABORADOR: {}", email);
        }
        
        return matches;
    }

    /**
     * Determina o role padrÃ£o baseado no email
     */
    public static String determineDefaultRole(String email) {
        if (isColaboradorEmail(email)) {
            return "COLABORADOR";
        }
        
        // Outros padrÃµes podem ser adicionados aqui
        // Exemplo: admin.*@promovervigilancia.com.br -> ADMIN
        if (email != null && email.matches("admin\\..*@promovervigilancia\\.com\\.br")) {
            log.info("âœ… Email identificado como ADMIN: {}", email);
            return "ADMIN";
        }
        
        if (email != null && email.matches("rh\\..*@promovervigilancia\\.com\\.br")) {
            log.info("âœ… Email identificado como RH: {}", email);
            return "RH";
        }
        
        if (email != null && email.matches("financeiro\\..*@promovervigilancia\\.com\\.br")) {
            log.info("âœ… Email identificado como FINANCEIRO: {}", email);
            return "FINANCEIRO";
        }
        
        if (email != null && email.matches("supervisor\\..*@promovervigilancia.com\\.br")) {
            log.info("âœ… Email identificado como SUPERVISOR: {}", email);
            return "SUPERVISOR";
        }
        
        // Default
        return "COLABORADOR";
    }

    /**
     * Valida se o padrÃ£o de email Ã© vÃ¡lido para criaÃ§Ã£o automÃ¡tica de usuÃ¡rio
     */
    public static boolean isValidEmailPattern(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        // Aceitar emails da Promover VigilÃ¢ncia
        return email.endsWith("@promovervigilancia.com.br");
    }
}


