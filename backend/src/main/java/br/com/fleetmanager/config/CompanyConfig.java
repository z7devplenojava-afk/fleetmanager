package br.com.fleetmanager.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "company")
public class CompanyConfig {
    
    private String name = "Promover";
    private String slogan = "Vigilância Patrimonial - LTDA";
    private String address = "Rua das Empresas, 123 - Centro - São Paulo/SP";
    private String phone = "(11) 99999-9999";
    private String email = "contato@promover.com.br";
    private String cnpj = "00.000.000/0001-00";
    private String website = "www.promover.com.br";
    private Report report = new Report();
    private Colors colors = new Colors();
    
    @Data
    public static class Report {
        private String defaultFormat = "html";
        private String logoPath = "static/images/company-logo.png";
        private String templatePath = "templates/reports/";
        private String outputPath = "reports/output/";
    }
    
    @Data
    public static class Colors {
        private String primary = "#e74c3c";
        private String secondary = "#f39c12";
        private String success = "#27ae60";
        private String warning = "#f39c12";
        private String danger = "#e74c3c";
        private String info = "#3498db";
    }
}
