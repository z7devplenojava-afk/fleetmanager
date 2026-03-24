package com.z7design.fleet_manager.util;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

/**
 * UtilitÃ¡rio para gerar hashes BCrypt de senhas
 * 
 * USO: Execute este arquivo como aplicaÃ§Ã£o Java standalone
 *      para gerar hashes de senhas para inserÃ§Ã£o manual no banco
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        Argon2PasswordEncoder encoder = new Argon2PasswordEncoder(16, 32, 1, 1 << 16, 3);
        
        System.out.println("=".repeat(60));
        System.out.println("ðŸ” GERADOR DE HASH ARGON2id");
        System.out.println("=".repeat(60));
        System.out.println();
        
        // Senhas comuns para gerar hashes
        String[] senhas = {
            "Admin123!",
            "SuperAdmin@2025",
            "RH@2025",
            "Financeiro@2025",
            "Supervisor@2025",
            "12345678901@2025" // Exemplo de CPF@2025
        };
        
        for (String senha : senhas) {
            String hash = encoder.encode(senha);
            
            System.out.println("ðŸ“ Senha: " + senha);
            System.out.println("ðŸ”’ Hash:  " + hash);
            System.out.println("ðŸ“ Tamanho: " + hash.length() + " caracteres");
            System.out.println();
            
            // SQL para inserir no banco
            System.out.println("ðŸ’¾ SQL para atualizar no banco:");
            System.out.println("   UPDATE users SET password = '" + hash + "' WHERE username = 'SEU_USERNAME';");
            System.out.println("-".repeat(60));
            System.out.println();
        }
        
        // Teste de validaÃ§Ã£o
        System.out.println("=".repeat(60));
        System.out.println("ðŸ§ª TESTE DE VALIDAÃ‡ÃƒO");
        System.out.println("=".repeat(60));
        
        String senhaOriginal = "Admin123!";
        String hash = encoder.encode(senhaOriginal);
        boolean matches = encoder.matches(senhaOriginal, hash);
        
        System.out.println("Senha original: " + senhaOriginal);
        System.out.println("Hash gerado: " + hash);
        System.out.println("ValidaÃ§Ã£o: " + (matches ? "âœ… PASSOU" : "âŒ FALHOU"));
        System.out.println();
        
        // Teste com senha diferente
        boolean matchesWrong = encoder.matches("SenhaErrada123!", hash);
        System.out.println("Teste com senha errada: " + (matchesWrong ? "âŒ FALHOU (nÃ£o deveria passar)" : "âœ… PASSOU (bloqueou corretamente)"));
        System.out.println();
        
        System.out.println("=".repeat(60));
        System.out.println("âœ… GERAÃ‡ÃƒO COMPLETA!");
        System.out.println("=".repeat(60));
    }
}


