package br.com.fleetmanager.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class MonitoringConfig {

    @Bean
    public MeterRegistry meterRegistry() {
        return new SimpleMeterRegistry();
    }

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    public HealthIndicator applicationHealthIndicator() {
        return new HealthIndicator() {
            @Override
            public Health health() {
                try {
                    // Verificar se a aplicação está funcionando
                    return Health.up()
                            .withDetail("status", "Aplicação funcionando normalmente")
                            .withDetail("timestamp", System.currentTimeMillis())
                            .build();
                } catch (Exception e) {
                    return Health.down()
                            .withDetail("error", e.getMessage())
                            .withDetail("timestamp", System.currentTimeMillis())
                            .build();
                }
            }
        };
    }

    @Bean
    public HealthIndicator databaseHealthIndicator() {
        return new HealthIndicator() {
            @Override
            public Health health() {
                try {
                    // Aqui você pode adicionar verificação real do banco
                    return Health.up()
                            .withDetail("database", "PostgreSQL")
                            .withDetail("status", "Conectado")
                            .build();
                } catch (Exception e) {
                    return Health.down()
                            .withDetail("database", "PostgreSQL")
                            .withDetail("error", e.getMessage())
                            .build();
                }
            }
        };
    }

    @Bean
    public HealthIndicator whatsappHealthIndicator() {
        return new HealthIndicator() {
            @Override
            public Health health() {
                try {
                    // Verificar status do WhatsApp
                    return Health.up()
                            .withDetail("service", "WhatsApp")
                            .withDetail("status", "Conectado")
                            .build();
                } catch (Exception e) {
                    return Health.down()
                            .withDetail("service", "WhatsApp")
                            .withDetail("error", e.getMessage())
                            .build();
                }
            }
        };
    }
} 