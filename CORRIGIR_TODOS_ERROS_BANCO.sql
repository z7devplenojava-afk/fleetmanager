-- =====================================================
-- SCRIPT ÚNICO: CORRIGIR TODOS OS ERROS DO BANCO
-- =====================================================
-- Execute no DBeaver/pgAdmin no banco: secured_guard_test
-- =====================================================

-- ✅ PASSO 1: Converter tipo da coluna ip_address (INET → VARCHAR)
ALTER TABLE assinaturas_documentos
ALTER COLUMN ip_address TYPE VARCHAR(255) USING ip_address::TEXT;

-- ✅ PASSO 2: Verificar conversão
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assinaturas_documentos' 
  AND column_name = 'ip_address';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- column_name  | data_type
-- -------------+----------------
-- ip_address   | character varying
-- =====================================================

-- ✅ DEPOIS DE EXECUTAR:
-- 1. Reinicie o backend
-- 2. Flyway vai executar migration V308 automaticamente
-- 3. Backend deve subir com SUCESSO! 🎉
-- =====================================================

