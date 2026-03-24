-- =========================================================
-- Script de Verificação de Criptografia de Senhas
-- =========================================================
-- OBJETIVO: Verificar se TODAS as senhas estão criptografadas
--           com BCrypt ($2a$10$...)
-- =========================================================

-- 1. Verificar formato das senhas (deve começar com $2a$ ou $2b$)
SELECT 
    username,
    name,
    email,
    LEFT(password, 10) as password_prefix,
    LENGTH(password) as password_length,
    CASE 
        WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN '✅ CRIPTOGRAFADO'
        ELSE '❌ TEXTO PLANO!'
    END as status_criptografia
FROM users
ORDER BY 
    CASE 
        WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 1
        ELSE 0
    END,
    username;

-- 2. Contar senhas criptografadas vs texto plano
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 1 END) as senhas_criptografadas,
    COUNT(CASE WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' THEN 1 END) as senhas_texto_plano,
    ROUND(
        100.0 * COUNT(CASE WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 1 END) / COUNT(*), 
        2
    ) as percentual_seguro
FROM users;

-- 3. Listar usuários com senhas EM TEXTO PLANO (PROBLEMA!)
SELECT 
    id,
    username,
    name,
    email,
    password,
    created_at,
    '❌ CORRIGIR URGENTE!' as acao
FROM users
WHERE password NOT LIKE '$2a$%' 
  AND password NOT LIKE '$2b$%';

-- 4. Verificar comprimento das senhas (BCrypt tem ~60 chars)
SELECT 
    username,
    LENGTH(password) as tamanho_senha,
    CASE 
        WHEN LENGTH(password) >= 50 THEN '✅ Provável BCrypt'
        WHEN LENGTH(password) < 30 THEN '❌ Provável texto plano'
        ELSE '⚠️ Verificar manualmente'
    END as analise
FROM users
ORDER BY LENGTH(password);

-- 5. Verificar estrutura da coluna password
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'password';

-- 6. Exemplos de hashes válidos (para comparação)
-- BCrypt: $2a$10$N8qQ2x7xFx.vK5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5K
-- Tamanho: ~60 caracteres
-- Sempre começa com $2a$ ou $2b$

-- =========================================================
-- RESULTADO ESPERADO:
-- ✅ 100% das senhas devem começar com $2a$ ou $2b$
-- ✅ Tamanho médio: ~60 caracteres
-- ❌ 0 senhas em texto plano
-- =========================================================

-- 7. Script de CORREÇÃO (se encontrar senhas em texto plano)
-- ⚠️ ATENÇÃO: Senhas em texto plano NÃO podem ser convertidas!
-- Solução: Resetar para senha padrão CPF@2025 e forçar troca

/*
-- DESCOMENTE APENAS SE ENCONTRAR SENHAS EM TEXTO PLANO:

DO $$
DECLARE
    user_record RECORD;
    senha_padrao TEXT;
    senha_hash TEXT;
BEGIN
    FOR user_record IN 
        SELECT id, username, name, email
        FROM users
        WHERE password NOT LIKE '$2a$%' 
          AND password NOT LIKE '$2b$%'
    LOOP
        -- Gerar senha padrão CPF@2025
        senha_padrao := user_record.username || '@2025';
        
        -- ⚠️ NOTA: Este hash é um EXEMPLO
        -- Você DEVE gerar o hash correto usando BCryptPasswordEncoder no Java
        -- Execute: System.out.println(new BCryptPasswordEncoder().encode("CPF@2025"));
        
        -- Por enquanto, apenas marcar para primeiro acesso
        UPDATE users
        SET first_access = true,
            active = true
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Usuário % marcado para primeiro acesso (senha será resetada)', user_record.username;
    END LOOP;
END $$;
*/

-- 8. Verificar se há usuários marcados para primeiro acesso
SELECT 
    username,
    email,
    first_access,
    two_factor_enabled,
    created_at
FROM users
WHERE first_access = true
ORDER BY created_at DESC;

-- =========================================================
-- COMANDOS DE EMERGÊNCIA (se necessário)
-- =========================================================

-- Gerar hash BCrypt para senha específica (executar no Java):
/*
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Exemplo: CPF@2025
        String senha = "12345678901@2025";
        String hash = encoder.encode(senha);
        
        System.out.println("Senha: " + senha);
        System.out.println("Hash: " + hash);
        
        // Atualizar no banco:
        // UPDATE users SET password = 'HASH_GERADO' WHERE username = 'CPF';
    }
}
*/

