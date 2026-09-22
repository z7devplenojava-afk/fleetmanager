-- =====================================================
-- CORRIGIR TIPO DA COLUNA ip_address (fluxbus_test)
-- =====================================================
-- Execute este script no DBeaver/pgAdmin no banco fluxbus_test

-- 1. Verificar tipo atual
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'assinaturas_documentos' 
  AND column_name = 'ip_address';

-- 2. Converter INET para VARCHAR
ALTER TABLE assinaturas_documentos
ALTER COLUMN ip_address TYPE VARCHAR(255) USING ip_address::TEXT;

-- 3. Verificar tipo após alteração
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'assinaturas_documentos' 
  AND column_name = 'ip_address';

-- =====================================================
-- DEPOIS DE EXECUTAR:
-- =====================================================
-- Reinicie o backend! Deve funcionar agora! ✅
-- =====================================================

