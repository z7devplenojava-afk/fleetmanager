#!/usr/bin/env python3
"""
Script para gerar INSERTs do banco secured_guard_test e atualizar a migration V999
"""

import psycopg2
import os
import re
import sys
from pathlib import Path

# Configurações do banco (ajuste se necessário)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': 'secured_guard_test',
    'user': os.getenv('DB_USER', 'postgressg'),
    'password': os.getenv('DB_PASSWORD', '1234567')  # Ajuste conforme necessário
}

# Caminho da migration
SCRIPT_DIR = Path(__file__).parent
MIGRATION_FILE = SCRIPT_DIR / 'V999__seed_ci_essential_data.sql'
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent.parent

def escape_sql(value):
    """Escapa valores SQL"""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    # String: escapa aspas simples
    return "'" + str(value).replace("'", "''") + "'"

def format_timestamp(value):
    """Formata timestamp para SQL"""
    if value is None:
        return 'NULL'
    return f"'{value}'"

def generate_user_inserts(cursor):
    """Gera INSERTs de usuários"""
    print("📤 Gerando INSERTs de usuários...")
    
    cursor.execute("""
        SELECT 
            id, username, password, email, name, status, 
            COALESCE(active, true) as active,
            COALESCE(two_factor_enabled, false) as two_factor_enabled,
            two_factor_whatsapp,
            COALESCE(require_password_change, false) as require_password_change,
            last_password_change,
            COALESCE(first_access_completed, false) as first_access_completed,
            whatsapp,
            COALESCE(whatsapp_consent, false) as whatsapp_consent,
            whatsapp_consent_date,
            whatsapp_consent_ip,
            whatsapp_consent_user_agent,
            created_at,
            updated_at
        FROM users
        WHERE username != 'admin@ci'
        ORDER BY username
    """)
    
    inserts = []
    for row in cursor.fetchall():
        values = [
            escape_sql(row[0]),   # id
            escape_sql(row[1]),   # username
            escape_sql(row[2]),   # password
            escape_sql(row[3]),   # email
            escape_sql(row[4]),   # name
            escape_sql(row[5]),   # status
            escape_sql(row[6]),   # active
            escape_sql(row[7]),   # two_factor_enabled
            escape_sql(row[8]),   # two_factor_whatsapp
            escape_sql(row[9]),   # require_password_change
            format_timestamp(row[10]),  # last_password_change
            escape_sql(row[11]),  # first_access_completed
            escape_sql(row[12]),  # whatsapp
            escape_sql(row[13]),  # whatsapp_consent
            format_timestamp(row[14]),  # whatsapp_consent_date
            escape_sql(row[15]),  # whatsapp_consent_ip
            escape_sql(row[16]),  # whatsapp_consent_user_agent
            format_timestamp(row[17]) or 'NOW()',  # created_at
            format_timestamp(row[18]) or 'NOW()'   # updated_at
        ]
        
        insert = f"""INSERT INTO users (
    id, username, password, email, name, status, active,
    two_factor_enabled, two_factor_whatsapp, require_password_change,
    last_password_change, first_access_completed, whatsapp,
    whatsapp_consent, whatsapp_consent_date, whatsapp_consent_ip, whatsapp_consent_user_agent,
    created_at, updated_at
) VALUES (
    {', '.join(values)}
) ON CONFLICT (id) DO NOTHING;"""
        inserts.append(insert)
    
    print(f"✅ {len(inserts)} usuários gerados")
    return '\n\n'.join(inserts)

def generate_user_roles_inserts(cursor):
    """Gera INSERTs de user_roles"""
    print("📤 Gerando INSERTs de user_roles...")
    
    cursor.execute("""
        SELECT 
            ur.user_id,
            r.name as role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN users u ON ur.user_id = u.id
        WHERE u.username != 'admin@ci'
        ORDER BY u.username, r.name
    """)
    
    inserts = []
    for row in cursor.fetchall():
        user_id = escape_sql(row[0])
        role_name = escape_sql(row[1])
        
        insert = f"""INSERT INTO user_roles (user_id, role_id, created_at)
SELECT 
    {user_id},
    r.id,
    NOW()
FROM roles r
WHERE r.name = {role_name}
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur2 
      WHERE ur2.user_id = {user_id} 
        AND ur2.role_id = r.id
  );"""
        inserts.append(insert)
    
    print(f"✅ {len(inserts)} user_roles gerados")
    return '\n\n'.join(inserts)

def generate_employee_inserts(cursor):
    """Gera INSERTs de funcionários"""
    print("📤 Gerando INSERTs de funcionários...")
    
    # Obter todas as colunas da tabela employees
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        ORDER BY ordinal_position
    """)
    columns = [row[0] for row in cursor.fetchall()]
    
    # Query dinâmica baseada nas colunas disponíveis
    columns_str = ', '.join(columns)
    cursor.execute(f"SELECT {columns_str} FROM employees ORDER BY name")
    
    inserts = []
    for row in cursor.fetchall():
        values = []
        for i, col in enumerate(columns):
            value = row[i]
            if value is None:
                values.append('NULL')
            elif isinstance(value, bool):
                values.append('true' if value else 'false')
            elif isinstance(value, (int, float)):
                values.append(str(value))
            elif isinstance(value, str):
                # Escapar aspas simples
                values.append("'" + value.replace("'", "''") + "'")
            else:
                # Para timestamps, dates, etc.
                values.append(f"'{value}'" if value else 'NULL')
        
        insert = f"""INSERT INTO employees (
    {columns_str}
) VALUES (
    {', '.join(values)}
) ON CONFLICT (id) DO NOTHING;"""
        inserts.append(insert)
    
    print(f"✅ {len(inserts)} funcionários gerados")
    return '\n\n'.join(inserts)

def update_migration(users_inserts, user_roles_inserts, employees_inserts):
    """Atualiza a migration com os INSERTs gerados"""
    print("📝 Atualizando migration...")
    
    with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Atualizar seção 7.1.1 (usuários)
    pattern1 = r'(-- =====================================================\s*-- 7\.1\.1\. INSERTs HARDCODED DE USUÁRIOS.*?-- COLE OS INSERTs DE USUÁRIOS AQUI.*?\n)'
    if users_inserts:
        replacement1 = r'\1' + users_inserts + '\n\n'
        content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)
        print("✅ Seção 7.1.1 atualizada (usuários)")
    
    # Atualizar seção 7.2 (user_roles)
    pattern2 = r'(-- =====================================================\s*-- 7\.2\. USER_ROLES DOS USUÁRIOS.*?-- COLE OS INSERTs DE USER_ROLES AQUI.*?\n)'
    if user_roles_inserts:
        replacement2 = r'\1' + user_roles_inserts + '\n\n'
        content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
        print("✅ Seção 7.2 atualizada (user_roles)")
    
    # Atualizar seção 8.1 (funcionários)
    pattern3 = r'(-- =====================================================\s*-- 8\.1\. INSERTs HARDCODED DE FUNCIONÁRIOS.*?-- COLE OS INSERTs DE FUNCIONÁRIOS AQUI.*?\n)'
    if employees_inserts:
        replacement3 = r'\1' + employees_inserts + '\n\n'
        content = re.sub(pattern3, replacement3, content, flags=re.DOTALL)
        print("✅ Seção 8.1 atualizada (funcionários)")
    
    # Criar backup
    backup_file = str(MIGRATION_FILE) + '.backup'
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"💾 Backup criado: {backup_file}")
    
    # Salvar migration atualizada
    with open(MIGRATION_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Migration atualizada: {MIGRATION_FILE}")

def main():
    print("🚀 Gerando INSERTs do banco secured_guard_test")
    print("=" * 50)
    print()
    
    try:
        # Conectar ao banco
        print(f"📋 Conectando ao banco {DB_CONFIG['database']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Conectado!")
        print()
        
        # Gerar INSERTs
        users_inserts = generate_user_inserts(cursor)
        print()
        
        user_roles_inserts = generate_user_roles_inserts(cursor)
        print()
        
        employees_inserts = generate_employee_inserts(cursor)
        print()
        
        # Atualizar migration
        update_migration(users_inserts, user_roles_inserts, employees_inserts)
        print()
        
        # Fechar conexão
        cursor.close()
        conn.close()
        
        print("=" * 50)
        print("✅ Processo concluído com sucesso!")
        print()
        print("📋 Próximos passos:")
        print("   1. Revise a migration atualizada")
        print("   2. Faça commit e push")
        print("   3. No próximo deploy, os dados serão copiados automaticamente")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Erro ao conectar ao banco: {e}")
        print()
        print("💡 Dica: Configure as variáveis de ambiente:")
        print("   export DB_HOST=localhost")
        print("   export DB_PORT=5432")
        print("   export DB_USER=postgressg")
        print("   export DB_PASSWORD=sua_senha")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

