// Execute este arquivo para gerar hash BCrypt da senha Admin1234
// Compile: javac -cp "." GERAR_HASH_SENHA.java
// Execute: java GERAR_HASH_SENHA

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GERAR_HASH_SENHA {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Gerar hash para Admin1234
        String senha = "Admin1234";
        String hash = encoder.encode(senha);
        
        System.out.println("=".repeat(60));
        System.out.println("🔐 HASH BCRYPT GERADO");
        System.out.println("=".repeat(60));
        System.out.println();
        System.out.println("Senha: " + senha);
        System.out.println("Hash:  " + hash);
        System.out.println();
        System.out.println("=".repeat(60));
        System.out.println("📝 SQL PARA ATUALIZAR:");
        System.out.println("=".repeat(60));
        System.out.println();
        System.out.println("UPDATE users");
        System.out.println("SET password = '" + hash + "'");
        System.out.println("WHERE username = 'jose.ramos';");
        System.out.println();
        System.out.println("=".repeat(60));
        
        // Testar se funciona
        boolean matches = encoder.matches(senha, hash);
        System.out.println("✅ Validação: " + (matches ? "PASSOU" : "FALHOU"));
    }
}

