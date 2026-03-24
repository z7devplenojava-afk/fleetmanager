package com.z7design.fleet_manager.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * ConfiguraÃ§Ã£o de Cache usando Caffeine (cache em memÃ³ria)
 * 
 * Esta configuraÃ§Ã£o sÃ³ Ã© ativada quando nÃ£o existe outro CacheManager jÃ¡ definido
 * (como RedisCacheConfig, que tem prioridade quando spring.cache.type=redis).
 * 
 * Quando Redis estÃ¡ configurado, usa-se RedisCacheConfig.
 */
@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "caffeine", matchIfMissing = true)
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(1000));
        return cacheManager;
    }
} 
