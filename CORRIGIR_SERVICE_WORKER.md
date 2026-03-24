# 🔧 Como Corrigir Erro de Service Worker (Workbox)

## ❌ Problema

Erro no console:
```
bad-precaching-response: bad-precaching-response :: [{"url":"https://ci.z7botsolutions.com.br/assets/Acidentes-BqywWvsT.js","status":404}]
```

## 🔍 Causa

O Service Worker está tentando fazer precache de arquivos que não existem mais (404). Isso acontece quando:
- O build mudou e o service worker ainda tem referências antigas
- Arquivos foram renomeados/removidos mas o service worker não foi atualizado
- Há um problema com o build do frontend

## ✅ Soluções

### Solução 1: Limpar Cache do Service Worker (Rápido)

**No console do navegador:**

```javascript
// Desregistrar service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Limpar todos os caches
caches.keys().then(cacheNames => {
  cacheNames.forEach(cacheName => caches.delete(cacheName));
});

// Recarregar página
location.reload();
```

**Ou use o script automático:**

1. Adicione `?clear-sw-cache` na URL: `https://ci.z7botsolutions.com.br/?clear-sw-cache`
2. O script limpará automaticamente os caches

### Solução 2: Limpar via DevTools

1. Abra o DevTools (F12)
2. Vá para **Application** → **Service Workers**
3. Clique em **Unregister** em todos os service workers
4. Vá para **Application** → **Cache Storage**
5. Delete todos os caches
6. Recarregue a página (Ctrl+Shift+R para hard refresh)

### Solução 3: Rebuild do Frontend

Se o problema persistir, faça um rebuild completo:

```bash
cd frontend
rm -rf dist node_modules/.vite
npm run build
```

### Solução 4: Desabilitar Service Worker Temporariamente

Se precisar desabilitar temporariamente:

1. Abra o DevTools
2. Vá para **Application** → **Service Workers**
3. Marque **Bypass for network**
4. Recarregue a página

## 🛠️ Configuração Melhorada

A configuração do Workbox foi atualizada para:

- ✅ Ignorar erros de precache graciosamente
- ✅ Limpar caches antigos automaticamente
- ✅ Tratar arquivos 404 sem quebrar o service worker

## 📝 Prevenção

Para evitar esse problema no futuro:

1. **Sempre faça rebuild após mudanças significativas no código**
2. **Limpe o cache do navegador após deploys**
3. **Use hard refresh (Ctrl+Shift+R) após atualizações**

## 🔗 Referências

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Service Worker Best Practices](https://web.dev/service-worker-caching-and-http-caching/)
