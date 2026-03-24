# Instruções para Executar a Migração SQL

## Passo 1: Executar a migração SQL no banco de dados

### Opção 1: Via DBeaver (Recomendado)

1. **Abrir DBeaver**
2. **Conectar ao banco** `secured_guard` no PostgreSQL
3. **Abrir o arquivo** `create_facial_recognition_tables.sql`
4. **Executar o script** (F5 ou botão "Execute")

### Opção 2: Via pgAdmin

1. **Abrir pgAdmin**
2. **Conectar ao servidor PostgreSQL**
3. **Navegar para** `secured_guard` > `Schemas` > `public`
4. **Clicar com botão direito** em `public` > `Query Tool`
5. **Copiar e colar** o conteúdo do arquivo `create_facial_recognition_tables.sql`
6. **Executar** (F5)

### Opção 3: Via linha de comando (se psql estiver no PATH)

```bash
# Windows (PowerShell)
psql -h localhost -p 5432 -U postgres -d secured_guard -f create_facial_recognition_tables.sql

# Linux/macOS
psql -h localhost -p 5432 -U postgres -d secured_guard -f create_facial_recognition_tables.sql
```

### Opção 4: Via script PowerShell (se psql estiver instalado)

```powershell
# Executar o script criado
powershell -ExecutionPolicy Bypass -File run_facial_recognition_migration.ps1
```

## Verificação da Migração

Após executar a migração, verifique se as tabelas foram criadas:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employee_faces', 'facial_recognition_logs', 'facial_recognition_config');

-- Verificar estrutura da tabela employee_faces
\d employee_faces

-- Verificar configurações inseridas
SELECT * FROM facial_recognition_config;
```

## Tabelas Criadas

### 1. `employee_faces`
- Armazena templates faciais dos funcionários
- Campos: `id`, `employee_id`, `cpf`, `face_template`, `face_encoding`, `face_quality_score`, `created_at`, `updated_at`, `is_active`

### 2. `facial_recognition_logs`
- Logs de tentativas de reconhecimento facial
- Campos: `id`, `employee_id`, `cpf`, `recognition_type`, `confidence_score`, `face_quality_score`, `recognition_status`, `error_message`, `ip_address`, `user_agent`, `location_latitude`, `location_longitude`, `created_at`

### 3. `facial_recognition_config`
- Configurações do sistema de reconhecimento facial
- Campos: `id`, `config_key`, `config_value`, `description`, `created_at`, `updated_at`

## Configurações Padrão Inseridas

- `min_confidence_threshold`: 75.0 (Score mínimo de confiança)
- `min_face_quality`: 60.0 (Qualidade mínima da face)
- `max_faces_per_employee`: 3 (Máximo de templates por funcionário)
- `face_detection_model`: seetaface2_detector
- `face_recognition_model`: seetaface2_recognizer
- `face_landmark_model`: seetaface2_landmarker
- `enable_liveness_detection`: true
- `liveness_threshold`: 80.0
- `max_recognition_attempts`: 3
- `lockout_duration_minutes`: 15

## Próximos Passos

1. ✅ **Executar migração SQL** (Passo 1) - Concluído
2. 🔄 **Integrar SeetaFace2** (Passo 2) - Ver `SEETAFACE2_INSTALLATION_GUIDE.md`
3. ⏳ **Testar com imagens reais** (Passo 3)
4. ⏳ **Ajustar thresholds** (Passo 4)

## Troubleshooting

### Erro: "psql não é reconhecido"
- Instale o PostgreSQL client tools
- Ou use DBeaver/pgAdmin para executar o SQL

### Erro: "Tabela já existe"
- As tabelas já foram criadas anteriormente
- Verifique se a migração foi executada com sucesso

### Erro: "Permissão negada"
- Certifique-se de que o usuário `postgres` tem permissões adequadas
- Ou use um usuário com privilégios de superusuário
