# 🎨 Sistema de Arquivos e Pastas - Design

## 1. Arquitetura do Sistema

### 1.1 Backend (Spring Boot)
```
FileExplorerController
├── FileExplorerService
├── FileSystemService (operações de arquivo)
└── PermissionService (controle de acesso)
```

### 1.2 Frontend (React)
```
FileExplorer/
├── components/
│   ├── FileTree.tsx          # Árvore de pastas (sidebar)
│   ├── FileGrid.tsx          # Grid de arquivos (main)
│   ├── FileUpload.tsx        # Upload de arquivos
│   ├── FileActions.tsx       # Botões de ação
│   └── FilePreview.tsx       # Preview de arquivos
├── hooks/
│   ├── useFileSystem.ts      # Hook para operações
│   └── useFileUpload.ts      # Hook para upload
└── types/
    └── FileSystem.ts         # Tipos TypeScript
```

## 2. Modelos de Dados

### 2.1 FileItem (TypeScript)
```typescript
interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: FilePermissions;
}

interface FilePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}
```

### 2.2 FileSystemNode (Java)
```java
@Entity
@Table(name = "file_system_nodes")
public class FileSystemNode {
    @Id
    private UUID id;
    private String name;
    private String path;
    private String parentPath;
    private FileType type;
    private Long size;
    private String mimeType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
}
```

## 3. APIs REST

### 3.1 Endpoints Principais
```
GET    /api/files                    # Listar arquivos/pastas
POST   /api/files/folders            # Criar pasta
POST   /api/files/upload             # Upload arquivo
GET    /api/files/{id}/download      # Download arquivo
PUT    /api/files/{id}               # Renomear/mover
DELETE /api/files/{id}               # Excluir
GET    /api/files/{id}/preview       # Preview arquivo
```

### 3.2 Parâmetros de Query
```
?path=/documents/reports             # Filtrar por caminho
?type=file|folder                    # Filtrar por tipo
?search=nome                         # Buscar por nome
?sort=name|size|date                 # Ordenação
?order=asc|desc                      # Direção da ordenação
```

## 4. Interface do Usuário

### 4.1 Layout Principal
```
┌─────────────────────────────────────────────────────────┐
│ 🗂️ File Explorer                                        │
├─────────────┬───────────────────────────────────────────┤
│ 📁 Folders  │ 📄 Files                                  │
│             │                                           │
│ 📂 documents│ ┌─────┐ ┌─────┐ ┌─────┐                   │
│   📂 reports│ │📄   │ │📄   │ │📄   │                   │
│   📂 images │ │file1│ │file2│ │file3│                   │
│ 📂 unified  │ └─────┘ └─────┘ └─────┘                   │
│             │                                           │
│             │ [Upload] [New Folder] [Delete] [Rename]   │
└─────────────┴───────────────────────────────────────────┘
```

### 4.2 Componentes UI
- **FileTree**: Árvore expansível de pastas
- **FileGrid**: Grid responsivo de arquivos
- **FileUpload**: Drag & drop + botão upload
- **FileActions**: Toolbar com ações
- **FilePreview**: Modal para preview

## 5. Funcionalidades

### 5.1 Navegação
- Clique em pasta → navegar
- Breadcrumb para caminho atual
- Botão "voltar" para pasta pai

### 5.2 Upload
- Drag & drop de arquivos
- Upload múltiplo
- Barra de progresso
- Validação de tipo/tamanho

### 5.3 Ações
- Criar pasta (modal com nome)
- Renomear (inline editing)
- Excluir (confirmação)
- Download (link direto)
- Mover (drag & drop)

## 6. Integração com Sistema Existente

### 6.1 Aproveitamento
- Usar `UnifiedDocumentController` como referência
- Estender sistema de permissões atual
- Integrar com estrutura de uploads existente
- Manter padrão de resposta da API

### 6.2 Roteamento
- Nova rota: `/file-explorer`
- Integrar com sidebar existente
- Adicionar ao menu "OPERACIONAL"

## 7. Segurança
- Validação de permissões por pasta
- Sanitização de nomes de arquivo
- Validação de tipos MIME
- Limite de tamanho por arquivo
- Prevenção de path traversal