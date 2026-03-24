package com.z7design.fleet_manager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * ConfiguraÃ§Ã£o de Cache usando Redis
 * 
 * EstratÃ©gia de Cache:
 * - Dashboard/EstatÃ­sticas: 5 minutos (dados atualizados frequentemente)
 * - Entidades principais (Employees, Vehicles, etc.): 30 minutos
 * - Listas/Combos (Departments, Units, etc.): 1 hora (dados raramente mudam)
 * - ConfiguraÃ§Ãµes: 24 horas (dados quase estÃ¡ticos)
 * - RelatÃ³rios: 2 horas (dados processados)
 */
@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis", matchIfMissing = false)
public class RedisCacheConfig {

    @Value("${spring.cache.redis.time-to-live:1800}")
    private long defaultTtlSeconds;

    /**
     * Configura ObjectMapper com suporte a Java 8 date/time types (LocalDate, LocalDateTime, etc.)
     * e com tratamento de referÃªncias circulares
     */
    private ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Registrar mÃ³dulo JSR310 para suporte a LocalDate, LocalDateTime, etc.
        mapper.registerModule(new JavaTimeModule());
        
        // ConfiguraÃ§Ãµes de serializaÃ§Ã£o
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        
        // ConfiguraÃ§Ãµes de deserializaÃ§Ã£o
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        
        // Habilitar suporte a anotaÃ§Ãµes (@JsonIgnore, @JsonIgnoreProperties, etc.)
        mapper.configure(MapperFeature.USE_ANNOTATIONS, true);
        
        // Configurar para tratar proxies do Hibernate
        mapper.configure(MapperFeature.DEFAULT_VIEW_INCLUSION, false);
        
        return mapper;
    }

    /**
     * Cria o serializer JSON com suporte a tipos Java 8
     */
    private GenericJackson2JsonRedisSerializer createJsonSerializer() {
        ObjectMapper mapper = createObjectMapper();
        return new GenericJackson2JsonRedisSerializer(mapper);
    }

    /**
     * ConfiguraÃ§Ã£o padrÃ£o do cache Redis
     */
    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Criar serializer com suporte a LocalDate e outros tipos Java 8
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonSerializer();
        
        // ConfiguraÃ§Ã£o padrÃ£o
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(defaultTtlSeconds))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(jsonSerializer))
                .disableCachingNullValues(); // NÃ£o cachear valores null

        // ConfiguraÃ§Ãµes especÃ­ficas por tipo de cache
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // ===== DASHBOARD E ESTATÃSTICAS (5 minutos) =====
        cacheConfigurations.put("dashboard", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("dashboard-summary", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("dashboard-stats", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("dashboard-quick-stats", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigurations.put("statistics", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // ===== ENTIDADES PRINCIPAIS (30 minutos) =====
        cacheConfigurations.put("employees", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("employees-by-company", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("vehicles", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("vehicles-by-status", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("clients", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("contracts", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("equipments", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("equipments-by-status", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("units", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("active-units", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // ===== LISTAS E COMBOS (1 hora) =====
        cacheConfigurations.put("departments", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("positions", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("cost-centers", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("suppliers", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("services", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("categories", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("distinct-values", defaultConfig.entryTtl(Duration.ofHours(1)));

        // ===== CONFIGURAÃ‡Ã•ES (24 horas) =====
        cacheConfigurations.put("config", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("security-settings", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("notification-settings", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("company-settings", defaultConfig.entryTtl(Duration.ofHours(24)));

        // ===== RELATÃ“RIOS (2 horas) =====
        cacheConfigurations.put("reports", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put("fuel-reports", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put("vehicle-reports", defaultConfig.entryTtl(Duration.ofHours(2)));

        // ===== DADOS TEMPORÃRIOS (15 minutos) =====
        cacheConfigurations.put("sessions", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put("temp-data", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}

