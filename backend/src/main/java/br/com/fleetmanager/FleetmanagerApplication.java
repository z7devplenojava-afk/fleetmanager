package br.com.fleetmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import br.com.fleetmanager.config.JwtConfig;

@SpringBootApplication(scanBasePackages = {"br.com.fleetmanager"})
@EnableConfigurationProperties(JwtConfig.class)
@EnableAspectJAutoProxy
@EnableMethodSecurity
@EnableScheduling
@EntityScan({"br.com.fleetmanager.model", "br.com.fleetmanager.model"})
@EnableJpaRepositories({"br.com.fleetmanager.repository", "br.com.fleetmanager.repository"})
public class FleetmanagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FleetmanagerApplication.class, args);
	}

}
