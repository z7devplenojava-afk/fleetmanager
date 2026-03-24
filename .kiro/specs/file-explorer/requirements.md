# 📄 Sistema de Arquivos e Pastas (Explorer) - Requisitos

## 1. Visão Geral
Implementar um explorador de arquivos web integrado ao SecuredGuard, aproveitando a infraestrutura existente de documentos unificados.

## 2. Arquitetura Atual (Base)
- ✅ Backend Spring Boot com APIs REST
- ✅ Frontend React com componentes UI
- ✅ Sistema de autenticação JWT
- ✅ Upload/Download de arquivos
- ✅ Estrutura de pastas (`uploads/`)
- ✅ Permissões por usuário

## 3. Requisitos Funcionais

### 3.1 Backend (Spring Boot)
- [ ] `GET /api/files?path=/...` → listar arquivos/pastas
- [ ] `POST /api/folders` → criar nova pasta
- [ ] `POST /api/files/upload` → upload de arquivos
- [ ] `GET /api/files/{id}/download` → download
- [ ] `PUT /api/files/{id}` → renomear/mover
- [ ] `DELETE /api/files/{id}` → excluir arquivo/pasta

### 3.2 Frontend (React)
- [ ] Painel lateral (árvore de pastas)
- [ ] Painel principal (lista/grid de arquivos)
- [ ] Drag & Drop para mover arquivos
- [ ] Botões de ação (Criar, Upload, Download, Renomear, Excluir)
- [ ] Feedback visual (toasts, loaders)

## 4. Integração com Sistema Existente
- Aproveitar `UnifiedDocumentController` como base
- Estender `UnifiedDocumentService` para operações de arquivos
- Usar estrutura de pastas existente (`uploads/`)
- Integrar com sistema de permissões atual

## 5. Estrutura de Pastas Proposta
```
uploads/
├── unified/           # Documentos unificados existentes
├── documents/         # Documentos gerais
├── images/           # Imagens
├── reports/          # Relatórios
└── temp/             # Arquivos temporários
```

## 6. Fases de Implementação
1. **Fase 1**: Backend - APIs básicas de arquivos
2. **Fase 2**: Frontend - Interface básica
3. **Fase 3**: Recursos avançados - Drag & Drop
4. **Fase 4**: Integração e testes