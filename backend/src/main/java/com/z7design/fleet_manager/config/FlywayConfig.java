package com.z7design.fleet_manager.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("Executando flyway.repair() preventivo antes da migracao...");
                flyway.repair();
            } catch (Exception e) {
                log.warn("Aviso durante flyway.repair(): {}", e.getMessage());
            }
            log.info("Executando flyway.migrate()...");
            flyway.migrate();
            log.info("Migracao do Flyway concluida com sucesso!");
        };
    }
}
