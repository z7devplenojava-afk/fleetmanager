#!/bin/bash

# Script para executar a migration V338 manualmente
# Uso: ./executar-migration-v338.sh

echo "🔧 =========================================="
echo "🔧 EXECUTAR MIGRATION V338"
echo "🔧 ========================================="
echo ""

# Configurações do banco (ajuste conforme necessário)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-secured_guard}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-4KaCiJc6an@7sgbdcid2025}"

echo "📋 Configurações do banco:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ ERRO: psql não está instalado!"
    echo "   Instale o PostgreSQL client para executar este script."
    exit 1
fi

# Exportar senha para evitar prompt
export PGPASSWORD="$DB_PASSWORD"

echo "🔍 Verificando se a tabela já existe..."
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unification_jobs');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "✅ A tabela 'unification_jobs' já existe!"
    echo ""
    echo "📊 Estrutura da tabela:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d unification_jobs"
    exit 0
fi

echo "📝 A tabela não existe. Executando migration..."
echo ""

# Executar a migration
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Migration: Create unification_jobs table for async batch processing
-- Version: V338

CREATE TABLE IF NOT EXISTS unification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL,
    month INTEGER,
    year INTEGER,
    force_unification BOOLEAN DEFAULT FALSE,
    total_documents INTEGER NOT NULL DEFAULT 0,
    processed_documents INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    error_message VARCHAR(2000),
    processing_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_unification_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_unification_jobs_status ON unification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_at ON unification_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_by ON unification_jobs(created_by);
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration executada com sucesso!"
    echo ""
    echo "📊 Estrutura da tabela criada:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d unification_jobs"
    
    echo ""
    echo "📝 Registrando no histórico do Flyway..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    SELECT 
        COALESCE(MAX(installed_rank), 0) + 1,
        '338',
        'create unification jobs table',
        'SQL',
        'V338__create_unification_jobs_table.sql',
        0,
        current_user,
        CURRENT_TIMESTAMP,
        0,
        true
    FROM flyway_schema_history
    WHERE NOT EXISTS (
        SELECT 1 FROM flyway_schema_history WHERE version = '338'
    );
EOF
    
    echo ""
    echo "🎉 Migration V338 concluída com sucesso!"
else
    echo ""
    echo "❌ ERRO ao executar a migration!"
    exit 1
fi

# Limpar senha
unset PGPASSWORD

