package com.z7design.fleet_manager.config;

// ConfiguraÃ§Ã£o Redis comentada - Redis nÃ£o estÃ¡ nas dependÃªncias do projeto
// Para usar Redis, adicione as dependÃªncias no pom.xml:
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-data-redis</artifactId>
// </dependency>

/*
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("localhost");
        config.setPort(6379);
        config.setDatabase(0);
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Serializer para chaves
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Serializer para valores
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // ConfiguraÃ§Ã£o padrÃ£o
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // ConfiguraÃ§Ãµes especÃ­ficas por cache
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Cache de funcionÃ¡rios - 1 hora
        cacheConfigurations.put("funcionarios", defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // Cache de mÃ©tricas - 15 minutos
        cacheConfigurations.put("metrics", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // Cache de relatÃ³rios - 2 horas
        cacheConfigurations.put("reports", defaultConfig.entryTtl(Duration.ofHours(2)));
        
        // Cache de configuraÃ§Ãµes - 24 horas
        cacheConfigurations.put("config", defaultConfig.entryTtl(Duration.ofHours(24)));
        
        // Cache de sessÃµes - 30 minutos
        cacheConfigurations.put("sessions", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
*/

// Classe vazia - configuraÃ§Ã£o de cache movida para CacheConfig.java
// O CacheConfig.java jÃ¡ fornece configuraÃ§Ã£o de cache usando Caffeine
public class RedisConfig {
    // ConfiguraÃ§Ã£o Redis desabilitada - usando Caffeine Cache em CacheConfig.java
} 
