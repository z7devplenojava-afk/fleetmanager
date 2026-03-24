-- Script simples para inserir dados básicos de contas a pagar
-- Este script cria dados mínimos para testar a funcionalidade

-- Inserir fornecedor básico
INSERT INTO suppliers (
    id,
    name,
    cnpj,
    email,
    phone,
    address,
    city,
    state,
    zip_code,
    category,
    notes,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'Fornecedor Teste Ltda',
    '12.345.678/0001-90',
    'teste@fornecedor.com.br',
    '(11) 99999-9999',
    'Rua Teste, 123',
    'São Paulo',
    'SP',
    '01234-567',
    'Serviços',
    'Fornecedor de teste',
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Inserir conta a pagar básica
INSERT INTO invoices (
    id,
    invoice_number,
    description,
    supplier_id,
    unit_id,
    amount,
    type,
    status,
    due_date,
    issue_date,
    category,
    notes,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'TEST-001',
    'Conta de teste - Serviços gerais',
    (SELECT id FROM suppliers WHERE name = 'Fornecedor Teste Ltda' LIMIT 1),
    (SELECT id FROM units LIMIT 1),
    1000.00,
    'VARIAVEL',
    'PENDING',
    '2024-12-31',
    '2024-01-01',
    'Serviços',
    'Conta de teste para verificar funcionalidade',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Verificar se os dados foram inseridos
SELECT 
    i.id,
    i.invoice_number,
    i.description,
    s.name as supplier_name,
    i.amount,
    i.type,
    i.status,
    i.due_date,
    i.category
FROM invoices i
LEFT JOIN suppliers s ON i.supplier_id = s.id
ORDER BY i.created_at DESC;
