package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.config.CompanyConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.HashMap;

@Service
@Slf4j
public class ReportTemplateService {
    
    private static final String TEMPLATE_PATH = "templates/reports/";
    
    @Autowired
    private CompanyConfig companyConfig;
    
    /**
     * Carrega um template de relatÃ³rio
     */
    public String loadTemplate(String templateName) {
        try {
            Resource resource = new ClassPathResource(TEMPLATE_PATH + templateName + ".html");
            if (!resource.exists()) {
                log.error("Template nÃ£o encontrado: {}", templateName);
                return getDefaultTemplate();
            }
            
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Erro ao carregar template {}: {}", templateName, e.getMessage());
            return getDefaultTemplate();
        }
    }
    
    /**
     * Gera o cabeÃ§alho padrÃ£o com logo e dados da empresa
     */
    public String generateHeader() {
        return loadTemplate("header")
                .replace("{{companyName}}", companyConfig.getName())
                .replace("{{companySlogan}}", companyConfig.getSlogan())
                .replace("{{companyAddress}}", companyConfig.getAddress())
                .replace("{{companyPhone}}", companyConfig.getPhone())
                .replace("{{companyEmail}}", companyConfig.getEmail())
                .replace("{{companyCnpj}}", companyConfig.getCnpj())
                .replace("{{logoPath}}", companyConfig.getReport().getLogoPath());
    }
    
    /**
     * Gera o rodapÃ© padrÃ£o
     */
    public String generateFooter() {
        return loadTemplate("footer")
                .replace("{{companyName}}", companyConfig.getName())
                .replace("{{currentYear}}", String.valueOf(java.time.Year.now().getValue()));
    }
    
    /**
     * Processa um template com dados especÃ­ficos
     */
    public String processTemplate(String templateName, Map<String, Object> data) {
        String template = loadTemplate(templateName);
        
        // Substitui placeholders pelos dados
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            template = template.replace(placeholder, value);
        }
        
        return template;
    }
    
    /**
     * Gera um relatÃ³rio completo com cabeÃ§alho, conteÃºdo e rodapÃ©
     */
    public String generateFullReport(String contentTemplate, Map<String, Object> data) {
        StringBuilder report = new StringBuilder();
        
        // Adiciona cabeÃ§alho
        report.append(generateHeader());
        
        // Adiciona conteÃºdo principal
        String content = processTemplate(contentTemplate, data);
        report.append(content);
        
        // Adiciona rodapÃ©
        report.append(generateFooter());
        
        return report.toString();
    }
    
    /**
     * Template padrÃ£o caso nÃ£o encontre o arquivo
     */
    private String getDefaultTemplate() {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{{companyName}} - RelatÃ³rio</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #333; }
                    .company-slogan { font-size: 14px; color: #666; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">{{companyName}}</div>
                    <div class="company-slogan">{{companySlogan}}</div>
                </div>
                <div class="content">
                    <!-- ConteÃºdo do relatÃ³rio -->
                </div>
            </body>
            </html>
            """;
    }
    
    /**
     * ObtÃ©m dados da empresa
     */
    public Map<String, String> getCompanyData() {
        Map<String, String> companyData = new HashMap<>();
        companyData.put("name", companyConfig.getName());
        companyData.put("slogan", companyConfig.getSlogan());
        companyData.put("address", companyConfig.getAddress());
        companyData.put("phone", companyConfig.getPhone());
        companyData.put("email", companyConfig.getEmail());
        companyData.put("cnpj", companyConfig.getCnpj());
        companyData.put("logoPath", companyConfig.getReport().getLogoPath());
        return companyData;
    }
}

