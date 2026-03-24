# Guia de Teste do Reconhecimento Facial

## Passo 3: Testar reconhecimento facial com imagens reais

### 1. Executar a Migração SQL

Antes de testar, certifique-se de que a migração SQL foi executada:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employee_faces', 'facial_recognition_logs', 'facial_recognition_config');

-- Verificar configurações
SELECT * FROM facial_recognition_config;
```

### 2. Iniciar o Backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=test
```

### 3. Testar Endpoints Básicos

#### 3.1 Teste do Serviço
```bash
curl -X GET "http://localhost:8081/api/facial-recognition/test" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Serviço de reconhecimento facial funcionando",
  "timestamp": 1699123456789,
  "registeredFaces": 0,
  "seetaFace2Available": false
}
```

#### 3.2 Teste do SeetaFace2
```bash
curl -X GET "http://localhost:8081/api/facial-recognition/test-seetaface2" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "libraryLoaded": false,
  "timestamp": 1699123456789,
  "registeredFaces": 0,
  "configLoaded": true
}
```

### 4. Registrar uma Face de Teste

#### 4.1 Preparar Imagem de Teste
- Use uma foto clara de rosto
- Formato: JPG, PNG
- Tamanho: mínimo 200x200 pixels
- Iluminação: boa, sem sombras fortes

#### 4.2 Registrar Face
```bash
curl -X POST "http://localhost:8081/api/facial-recognition/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "employeeId=EMPLOYEE_UUID" \
  -F "cpf=12345678901" \
  -F "image=@/path/to/face.jpg"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Face registrada com sucesso",
  "faceId": "uuid-here",
  "cpf": "12345678901",
  "quality": 85.5
}
```

### 5. Testar Reconhecimento

#### 5.1 Reconhecimento com Imagem Similar
```bash
curl -X POST "http://localhost:8081/api/facial-recognition/recognize" \
  -F "image=@/path/to/similar_face.jpg"
```

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "cpf": "12345678901",
  "employeeId": "employee-uuid",
  "confidence": 87.3,
  "quality": 82.1,
  "employee": {
    "id": "employee-uuid",
    "name": "Nome do Funcionário",
    "cpf": "12345678901",
    "email": "email@example.com",
    "phone": "11999999999",
    "status": "ACTIVE",
    "position": "Cargo",
    "positionId": "position-uuid",
    "unit": "Unidade",
    "unitId": "unit-uuid"
  }
}
```

**Resposta esperada (falha):**
```json
{
  "success": false,
  "error": "Face não reconhecida",
  "quality": 75.2
}
```

### 6. Testar no Frontend

#### 6.1 Acessar Modal de Visita
1. Abrir aplicação frontend
2. Navegar para "Visitas"
3. Clicar em "Nova Visita"
4. Clicar em "Reconhecimento Facial"

#### 6.2 Fluxo de Teste
1. **Permitir acesso à câmera**
2. **Capturar imagem** (botão "Capturar")
3. **Aguardar processamento**
4. **Verificar resultado**:
   - ✅ Sucesso: CPF e dados do funcionário
   - ❌ Falha: Mensagem de erro

### 7. Verificar Logs

#### 7.1 Logs do Backend
```bash
# Verificar logs de reconhecimento
tail -f backend/logs/application.log | grep "facial"
```

#### 7.2 Logs no Banco de Dados
```sql
-- Verificar logs de reconhecimento
SELECT 
    cpf,
    recognition_type,
    confidence_score,
    face_quality_score,
    recognition_status,
    error_message,
    created_at
FROM facial_recognition_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar faces registradas
SELECT 
    cpf,
    face_quality_score,
    is_active,
    created_at
FROM employee_faces 
WHERE is_active = true;
```

### 8. Cenários de Teste

#### 8.1 Teste de Qualidade
- **Boa qualidade**: Foto clara, bem iluminada
- **Qualidade média**: Foto com pouca luz
- **Qualidade ruim**: Foto muito escura ou borrada

#### 8.2 Teste de Similaridade
- **Mesma pessoa**: Foto diferente da registrada
- **Pessoa diferente**: Foto de outra pessoa
- **Sem face**: Foto sem rosto visível

#### 8.3 Teste de Performance
- **Tempo de resposta**: < 3 segundos
- **Memória**: Verificar uso de RAM
- **CPU**: Verificar uso de processador

### 9. Troubleshooting

#### 9.1 Erro: "Face não reconhecida"
- Verificar se a face foi registrada
- Verificar qualidade da imagem
- Ajustar threshold de confiança

#### 9.2 Erro: "Qualidade insuficiente"
- Melhorar iluminação
- Usar câmera de melhor qualidade
- Ajustar threshold de qualidade

#### 9.3 Erro: "SeetaFace2 não disponível"
- Verificar se a biblioteca foi instalada
- Verificar configurações no `application.properties`
- Usar implementação simulada para desenvolvimento

### 10. Próximos Passos

1. ✅ **Executar migração SQL** (Passo 1) - Concluído
2. ✅ **Integrar SeetaFace2** (Passo 2) - Concluído
3. 🔄 **Testar com imagens reais** (Passo 3) - Em andamento
4. ⏳ **Ajustar thresholds** (Passo 4) - Próximo

### 11. Configurações de Teste

#### 11.1 Thresholds Atuais
- **Confiança mínima**: 75.0
- **Qualidade mínima**: 60.0
- **Máximo de faces por funcionário**: 3

#### 11.2 Ajustes Recomendados
- **Desenvolvimento**: Reduzir thresholds para facilitar testes
- **Produção**: Aumentar thresholds para maior segurança
- **Teste**: Usar valores intermediários

### 12. Comandos Úteis

```bash
# Reiniciar backend
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=test

# Verificar status do banco
psql -h localhost -p 5432 -U postgres -d secured_guard -c "SELECT COUNT(*) FROM employee_faces;"

# Limpar logs de teste
psql -h localhost -p 5432 -U postgres -d secured_guard -c "DELETE FROM facial_recognition_logs WHERE created_at < NOW() - INTERVAL '1 hour';"
```
