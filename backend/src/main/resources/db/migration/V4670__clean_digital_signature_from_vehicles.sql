-- V4670: Limpar ruídos de assinaturas digitais do Detran incorretamente importadas para marca/modelo de veículos
UPDATE vehicles 
SET brand = '', model = 'Onibus Rodoviario' 
WHERE brand ILIKE '%assinado digitalmente%' OR model ILIKE '%assinado digitalmente%';
