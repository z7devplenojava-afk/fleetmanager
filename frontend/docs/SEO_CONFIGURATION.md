# Configuração de SEO - Promover Vigilância

## 📋 Visão Geral

Este documento descreve a configuração completa de SEO implementada no frontend da aplicação Promover Vigilância.

## 🚀 Pacotes Instalados

### Dependências Principais
- **react-helmet-async**: Gerenciamento dinâmico de meta tags
- **sitemap**: Geração automática de sitemap XML

### Instalação
```bash
npm install react-helmet-async sitemap
```

## 🛠️ Componentes Implementados

### 1. Componente SEO (`src/components/SEO.tsx`)

Componente reutilizável para gerenciar meta tags de SEO em todas as páginas.

#### Uso Básico:
```tsx
import SEO from '@/components/SEO';

const MinhaPagina = () => {
  return (
    <>
      <SEO 
        title="Título da Página"
        description="Descrição da página"
        keywords="palavras, chave, separadas, por, vírgula"
      />
      {/* Conteúdo da página */}
    </>
  );
};
```

#### Propriedades Disponíveis:
- `title`: Título da página
- `description`: Descrição meta tag
- `keywords`: Palavras-chave
- `image`: URL da imagem para Open Graph
- `url`: URL canônica
- `type`: Tipo de conteúdo (website, article, profile)
- `author`: Autor do conteúdo
- `publishedTime`: Data de publicação (para artigos)
- `modifiedTime`: Data de modificação (para artigos)
- `section`: Seção do conteúdo
- `tags`: Array de tags
- `noindex`: Se deve bloquear indexação
- `nofollow`: Se deve bloquear seguimento de links

### 2. Configuração do App.tsx

O `HelmetProvider` foi adicionado ao App principal:

```tsx
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        {/* Resto da aplicação */}
      </HelmetProvider>
    </ErrorBoundary>
  );
}
```

## 📄 Arquivos de Configuração

### 1. index.html
- Meta tags básicas otimizadas
- Open Graph tags para redes sociais
- Twitter Cards
- Structured Data (Schema.org)
- Preconnect para performance
- Favicon configurado

### 2. robots.txt
- Configuração para crawlers
- Sitemap location
- Áreas permitidas/bloqueadas
- Crawl delay

### 3. Sitemap Generator (`scripts/generate-sitemap.js`)
- Geração automática de sitemap XML
- Configuração de prioridades
- Frequência de atualização

## 🔧 Scripts NPM

### Scripts Disponíveis:
```json
{
  "build:seo": "npm run generate-sitemap && vite build",
  "generate-sitemap": "node scripts/generate-sitemap.js"
}
```

### Uso:
```bash
# Build com SEO completo
npm run build:seo

# Apenas gerar sitemap
npm run generate-sitemap
```

## 📊 Structured Data

### Schema.org Implementado:
1. **Organization**: Informações da empresa
2. **WebSite**: Informações do site
3. **ContactPoint**: Informações de contato

### Exemplo de Structured Data:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Promover Vigilância",
  "url": "https://promover.com.br",
  "logo": "https://promover.com.br/icons/icon-192x192.svg",
  "description": "Empresa especializada em vigilância patrimonial e segurança"
}
```

## 🎯 Meta Tags Implementadas

### Meta Tags Básicas:
- `title`: Título da página
- `description`: Descrição para motores de busca
- `keywords`: Palavras-chave
- `author`: Autor
- `robots`: Instruções para crawlers
- `canonical`: URL canônica

### Open Graph (Facebook):
- `og:type`: Tipo de conteúdo
- `og:url`: URL da página
- `og:title`: Título para redes sociais
- `og:description`: Descrição para redes sociais
- `og:image`: Imagem para compartilhamento
- `og:site_name`: Nome do site
- `og:locale`: Idioma

### Twitter Cards:
- `twitter:card`: Tipo de card
- `twitter:url`: URL da página
- `twitter:title`: Título para Twitter
- `twitter:description`: Descrição para Twitter
- `twitter:image`: Imagem para Twitter
- `twitter:site`: Handle do Twitter

## 📱 PWA e SEO

### Configuração PWA:
- Manifest configurado
- Service Worker ativo
- Ícones responsivos
- Theme color definido

### Benefícios para SEO:
- Melhor performance mobile
- Maior engajamento
- Melhor Core Web Vitals

## 🔍 Monitoramento e Análise

### Ferramentas Recomendadas:
1. **Google Search Console**: Monitoramento de indexação
2. **Google Analytics**: Análise de tráfego
3. **PageSpeed Insights**: Performance
4. **Lighthouse**: Auditoria completa

### Métricas Importantes:
- Core Web Vitals
- Tempo de carregamento
- Taxa de rejeição
- Posicionamento nas buscas

## 📝 Checklist de SEO

### ✅ Implementado:
- [x] Meta tags dinâmicas
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Structured Data
- [x] Sitemap XML
- [x] Robots.txt
- [x] URLs canônicas
- [x] PWA configurado
- [x] Performance otimizada

### 🔄 Para Implementar:
- [ ] Breadcrumbs
- [ ] FAQ Schema
- [ ] Local Business Schema
- [ ] Reviews Schema
- [ ] AMP pages
- [ ] RSS feed

## 🚀 Próximos Passos

1. **Configurar domínio real** no sitemap e meta tags
2. **Implementar breadcrumbs** para melhor navegação
3. **Adicionar FAQ Schema** para rich snippets
4. **Configurar Google Analytics** e Search Console
5. **Implementar AMP** para páginas críticas
6. **Otimizar imagens** com lazy loading
7. **Implementar cache** mais agressivo

## 📞 Suporte

Para dúvidas sobre a configuração de SEO, consulte:
- Documentação do React Helmet Async
- Google Search Console Help
- Schema.org Guidelines
- Web.dev SEO Guide 