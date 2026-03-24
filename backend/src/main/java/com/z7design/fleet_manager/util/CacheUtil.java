package com.z7design.fleet_manager.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * UtilitÃ¡rio para operaÃ§Ãµes de cache
 */
@Component
@Slf4j
public class CacheUtil {

    private final CacheManager cacheManager;

    public CacheUtil(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Limpa um cache especÃ­fico
     */
    public void evictCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.debug("Cache '{}' limpo", cacheName);
        } else {
            log.warn("Cache '{}' nÃ£o encontrado", cacheName);
        }
    }

    /**
     * Limpa mÃºltiplos caches
     */
    public void evictCaches(String... cacheNames) {
        for (String cacheName : cacheNames) {
            evictCache(cacheName);
        }
    }

    /**
     * Remove uma entrada especÃ­fica de um cache
     */
    public void evictCacheEntry(String cacheName, Object key) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.evict(key);
            log.debug("Entrada '{}' removida do cache '{}'", key, cacheName);
        } else {
            log.warn("Cache '{}' nÃ£o encontrado", cacheName);
        }
    }

    /**
     * Limpa todos os caches
     */
    public void evictAllCaches() {
        Collection<String> cacheNames = cacheManager.getCacheNames();
        cacheNames.forEach(this::evictCache);
        log.info("Todos os caches foram limpos ({} caches)", cacheNames.size());
    }

    /**
     * Limpa caches relacionados a uma entidade especÃ­fica
     */
    public void evictEntityCaches(String entityName) {
        String entityCache = entityName.toLowerCase() + "s";
        evictCache(entityCache);
        
        // Limpar tambÃ©m caches relacionados
        switch (entityName.toLowerCase()) {
            case "employee":
                evictCaches("employees", "employees-by-company", "dashboard-summary", "dashboard-stats");
                break;
            case "vehicle":
                evictCaches("vehicles", "vehicles-by-status", "dashboard-summary", "fuel-reports", "vehicle-reports");
                break;
            case "equipment":
                evictCaches("equipments", "equipments-by-status", "dashboard-summary");
                break;
            case "client":
                evictCaches("clients", "contracts", "dashboard-summary");
                break;
            case "unit":
                evictCaches("units", "active-units", "dashboard-summary");
                break;
            default:
                evictCache(entityCache);
                evictCache("dashboard-summary");
        }
        
        log.info("Caches relacionados Ã  entidade '{}' foram limpos", entityName);
    }

    /**
     * ObtÃ©m estatÃ­sticas dos caches
     */
    public CacheStats getCacheStats() {
        Collection<String> cacheNames = cacheManager.getCacheNames();
        return new CacheStats(cacheNames.size(), cacheNames);
    }

    /**
     * Classe para estatÃ­sticas de cache
     */
    public static class CacheStats {
        private final int totalCaches;
        private final Collection<String> cacheNames;

        public CacheStats(int totalCaches, Collection<String> cacheNames) {
            this.totalCaches = totalCaches;
            this.cacheNames = cacheNames;
        }

        public int getTotalCaches() {
            return totalCaches;
        }

        public Collection<String> getCacheNames() {
            return cacheNames;
        }
    }
}

