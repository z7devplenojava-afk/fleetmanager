package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.z7design.fleet_manager.dto.CompanyBrandingDTO;
import com.z7design.fleet_manager.service.CompanyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller para endpoints relacionados a branding e seleção de empresas
 */
@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Empresas", description = "Endpoints para gerenciamento de empresas e branding")
public class CompanyBrandingController {

    private final CompanyService companyService;

    /**
     * Buscar empresas acessíveis para um usuário (usado no login)
     * Por enquanto retorna todas as empresas ativas
     */
    @Operation(summary = "Listar empresas acessíveis para seleção no login", description = "Retorna lista de empresas que o usuário pode selecionar durante o login")
    @GetMapping("/accessible")
    public ResponseEntity<List<CompanyBrandingDTO>> getAccessibleCompanies(
            @RequestParam(name = "username", required = false) String username) {

        log.info("Buscando empresas acessíveis para username: {}", username);

        // Se username não fornecido, retornar todas as empresas ativas
        String user = username != null ? username : "anonymous";
        List<CompanyBrandingDTO> companies = companyService.getAccessibleCompaniesForUser(user);

        log.info("Retornando {} empresas acessíveis", companies.size());
        return ResponseEntity.ok(companies);
    }

    /**
     * Buscar informações de branding de uma empresa específica
     */
    @Operation(summary = "Obter branding de uma empresa", description = "Retorna informações de branding (logo, tema, funcionalidades) de uma empresa específica")
    @GetMapping("/{id}/branding")
    public ResponseEntity<CompanyBrandingDTO> getCompanyBranding(
            @PathVariable("id") UUID id,
            Authentication authentication) {

        log.info("Buscando branding da empresa ID: {} por usuário: {}",
                id, authentication != null ? authentication.getName() : "anonymous");

        CompanyBrandingDTO branding = companyService.getCompanyBranding(id);

        return ResponseEntity.ok(branding);
    }
}
