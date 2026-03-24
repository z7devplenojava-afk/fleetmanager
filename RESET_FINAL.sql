-- ═══════════════════════════════════════════════════════════════
-- RESET COMPLETO DO BANCO DE DADOS
-- ═══════════════════════════════════════════════════════════════
-- ATENÇÃO: Este script vai DELETAR TUDO!
-- Use apenas em ambiente de DESENVOLVIMENTO!
-- ═══════════════════════════════════════════════════════════════

-- OPÇÃO 1: RESET RÁPIDO (Mais Simples - RECOMENDADO)
-- Dropa o schema inteiro e recria

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Confirmação
SELECT 'DATABASE RESET COMPLETO!' as status,
       'Agora inicie o backend e aguarde as migrações executarem.' as proximo_passo;

-- ═══════════════════════════════════════════════════════════════
-- APÓS EXECUTAR ESTE SQL:
-- 
-- 1. ✓ Pare COMPLETAMENTE o backend (se estiver rodando)
-- 2. ✓ Inicie o backend na sua IDE
-- 3. ✓ Aguarde 1-2 minutos (migrações executando)
-- 4. ✓ Verifique o log - deve mostrar:
--      ✓ "Successfully validated X migrations"
--      ✓ "Successfully applied X migrations"  
--      ✓ "Started SecuredGuardApplication"
--
-- ═══════════════════════════════════════════════════════════════

