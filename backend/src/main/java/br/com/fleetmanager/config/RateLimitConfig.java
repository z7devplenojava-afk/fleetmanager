package br.com.fleetmanager.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean
    public Bucket rateLimitBucket() {
        // Allow 100 requests per minute
        Bandwidth limit = Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Bean
    public Bucket strictRateLimitBucket() {
        // Allow 10 requests per minute for sensitive operations
        Bandwidth limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Bean
    public Bucket loginRateLimitBucket() {
        // Allow 5 login attempts per 15 minutes
        Bandwidth limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(15)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
} 