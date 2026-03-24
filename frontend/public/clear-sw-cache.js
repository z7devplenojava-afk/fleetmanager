/**
 * Script para limpar o cache do Service Worker
 * Execute no console do navegador ou adicione como botão de debug
 */

async function clearServiceWorkerCache() {
  try {
    // Desregistrar todos os service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('✅ Service Worker desregistrado:', registration.scope);
    }

    // Limpar todos os caches
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('✅ Cache limpo:', cacheName);
    }

    console.log('✅ Todos os caches foram limpos! Recarregue a página.');
    
    // Recarregar a página após 1 segundo
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return false;
  }
}

// Expor função globalmente para uso no console
if (typeof window !== 'undefined') {
  window.clearServiceWorkerCache = clearServiceWorkerCache;
}

// Executar automaticamente se houver parâmetro na URL
if (typeof window !== 'undefined' && window.location.search.includes('clear-sw-cache')) {
  clearServiceWorkerCache();
}
