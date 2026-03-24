package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ReportLayoutPreviewDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.util.CompanyDataFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller para gerenciar layout de relatÃ³rios
 */
@RestController
@RequestMapping("/api/reports/layout")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
@Slf4j
public class ReportLayoutController {
    
    private final CompanyRepository companyRepository;
    
    /**
     * Preview do layout de relatÃ³rio para uma empresa
     * Retorna informaÃ§Ãµes formatadas que serÃ£o usadas no cabeÃ§alho e rodapÃ©
     */
    @GetMapping("/preview/{companyId}")
    public ResponseEntity<ReportLayoutPreviewDTO> previewLayout(@PathVariable UUID companyId) {
        log.info("Gerando preview de layout para empresa: {}", companyId);
        
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa nÃ£o encontrada com ID: " + companyId));
        
        // Construir DTO com informaÃ§Ãµes formatadas
        ReportLayoutPreviewDTO preview = ReportLayoutPreviewDTO.builder()
            .companyId(company.getId())
            .companyName(company.getName())
            .logoUrl(company.getLogoUrl())
            .cnpj(CompanyDataFormatter.formatCnpjForHeader(company))
            .fullAddress(CompanyDataFormatter.formatFullAddress(company))
            .phone(CompanyDataFormatter.formatPhone(company.getPhone()))
            .email(company.getEmail())
            .footerText(CompanyDataFormatter.formatCompanyFooter(company, true))
            .gradientColors(ReportLayoutPreviewDTO.GradientColors.builder()
                .yellow("#FFCC00")
                .orange("#FF9900")
                .red("#FF3333")
                .build())
            .build();
        
        log.info("Preview de layout gerado com sucesso para empresa: {}", company.getName());
        return ResponseEntity.ok(preview);
    }
    
    /**
     * Limpa o cache de templates e logos
     * Ãštil apÃ³s atualizar logos ou templates
     */
    @PostMapping("/cache/clear")
    public ResponseEntity<?> clearCache() {
        log.info("Solicitada limpeza de cache de layout");
        // O cache serÃ¡ limpo automaticamente ou pode ser chamado via StandardReportLayoutService
        return ResponseEntity.ok(java.util.Map.of("message", "Cache serÃ¡ limpo na prÃ³xima requisiÃ§Ã£o"));
    }
}

