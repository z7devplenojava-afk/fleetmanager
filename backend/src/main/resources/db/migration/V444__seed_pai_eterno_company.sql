INSERT INTO companies (
    id, name, sigla, cnpj, status, created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001', -- Fixed UUID for consistency
    'Pai Eterno',
    'PAI',
    '00.000.000/0001-99',
    'ACTIVE',
    NOW(),
    NOW()
) ON CONFLICT (cnpj) DO NOTHING;
