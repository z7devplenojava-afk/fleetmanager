package com.z7design.fleet_manager;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.TimeZone;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.z7design.fleet_manager.config.JwtConfig;

@SpringBootApplication
@EnableConfigurationProperties(JwtConfig.class)
@EnableScheduling
public class FleetManagerApplication {

    static {
        configurePdfBoxFontCache();
    }

    private static void configurePdfBoxFontCache() {
        try {
            if (System.getProperty("pdfbox.fontcache") == null) {
                Path cacheDir = Paths.get(System.getProperty("java.io.tmpdir", "."), "fluxbus-pdfbox-cache");
                Files.createDirectories(cacheDir);
                System.setProperty("pdfbox.fontcache", cacheDir.toAbsolutePath().toString());
            }
        } catch (Exception ignored) {
        }
    }

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
        configurePdfBoxFontCache();
    }

    public static void main(String[] args) {
        configurePdfBoxFontCache();
        SpringApplication.run(FleetManagerApplication.class, args);
    }
}
