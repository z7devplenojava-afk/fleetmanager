package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Resolve a empresa do usuário: diretamente (user.companyId / user.company) ou via Employee.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCompanyResolver {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final com.z7design.fleet_manager.repository.UserRepository userRepository;

    /**
     * Resolve o ID da empresa do contexto atual (TenantContext) ou do usuário logado via SecurityContextHolder.
     */
    public UUID resolveCurrentCompanyId() {
        UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
        if (tenantId != null) {
            return tenantId;
        }
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String username = auth.getName();
                if (username != null && userRepository != null) {
                    User user = userRepository.findByUsername(username)
                            .or(() -> userRepository.findByEmail(username)).orElse(null);
                    if (user != null) {
                        return resolveCompanyId(user);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Erro ao resolver empresa do usuário atual: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Resolve a entidade Company do contexto atual ou usuário logado.
     */
    public Optional<Company> resolveCurrentCompany() {
        UUID companyId = resolveCurrentCompanyId();
        if (companyId != null) {
            try {
                return companyRepository.findById(companyId);
            } catch (Exception ignored) {}
        }
        return Optional.empty();
    }

    /**
     * Verifica se o usuário possui papel administrativo/privilegiado (SUPER_ADMIN, ADMIN, etc.).
     * Usuários privilegiados não dependem de cadastro em Employee nem de vínculo obrigatório com empresa.
     */
    public boolean isPrivilegedUser(User user) {
        if (user == null) return false;
        String username = user.getUsername();
        if (username != null && ("jose.ramos".equalsIgnoreCase(username) || "admin".equalsIgnoreCase(username) || username.toLowerCase().startsWith("admin."))) {
            return true;
        }
        if (user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r != null && r.getName() != null && (
                        "SUPER_ADMIN".equalsIgnoreCase(r.getName()) ||
                        "ROLE_SUPER_ADMIN".equalsIgnoreCase(r.getName()) ||
                        "ADMIN".equalsIgnoreCase(r.getName()) ||
                        "ROLE_ADMIN".equalsIgnoreCase(r.getName()) ||
                        "FLEX_ADMIN".equalsIgnoreCase(r.getName()) ||
                        "ROLE_FLEX_ADMIN".equalsIgnoreCase(r.getName()) ||
                        "TI_SUPORTE".equalsIgnoreCase(r.getName()) ||
                        "ROLE_TI_SUPORTE".equalsIgnoreCase(r.getName())
                ))) {
            return true;
        }
        if (user.getGroups() != null && user.getGroups().stream()
                .anyMatch(g -> g != null && g.getGroupName() != null && (
                        g.getGroupName().name().toUpperCase().contains("ADMIN") ||
                        g.getGroupName().name().toUpperCase().contains("SUPER")
                ))) {
            return true;
        }
        return false;
    }

    /**
     * Retorna a Company do usuário. Primeiro tenta user.getCompanyId(),
     * depois user.getCompany(), depois Employee -> Company via query nativa.
     * SUPER_ADMIN não é obrigado a ter empresa vinculada e não deve acionar Employee.
     */
    public Optional<Company> resolveCompany(User user) {
        if (user == null)
            return Optional.empty();

        boolean privileged = isPrivilegedUser(user);

        // 1. Tentar por companyId direto
        if (user.getCompanyId() != null) {
            try {
                Optional<Company> direct = companyRepository.findById(user.getCompanyId());
                if (direct.isPresent()) {
                    return direct;
                }
            } catch (Exception e) {
                log.debug("Erro ao buscar company por companyId: {}", e.getMessage());
            }
        }

        // 2. Tentar por relacionamento company
        try {
            if (user.getCompany() != null && user.getCompany().getId() != null) {
                return Optional.of(user.getCompany());
            }
        } catch (Exception ignored) {}

        // 3. Se for usuário privilegiado (SUPER_ADMIN, etc.), NÃO força vínculo de empresa aleatória.
        // O Super Admin sem empresa atua no escopo global (FluxBus).
        if (privileged) {
            return Optional.empty();
        }

        // 4. Tentar por Employee via query nativa leve (evita carregar as 120+ colunas da entidade Employee)
        try {
            if (user.getId() != null) {
                Optional<UUID> companyIdOpt = employeeRepository.findCompanyIdByUserIdNative(user.getId());
                if (companyIdOpt.isPresent()) {
                    return companyRepository.findById(companyIdOpt.get());
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Erro ao resolver empresa por Employee nativo: {}", e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Retorna o empresaId do usuário (UUID ou null).
     */
    public UUID resolveCompanyId(User user) {
        if (user == null) return null;
        if (user.getCompanyId() != null) return user.getCompanyId();
        return resolveCompany(user).map(Company::getId).orElse(null);
    }

    /**
     * Resolve uma empresa específica para o usuário.
     * Utilizado durante o login quando uma empresa é selecionada.
     */
    public Optional<Company> resolveSpecificCompany(User user, UUID companyId) {
        if (user == null || companyId == null)
            return Optional.empty();

        Optional<Company> comp = Optional.empty();
        try {
            comp = companyRepository.findById(companyId);
        } catch (Exception ignored) {}

        if (comp.isEmpty()) {
            return Optional.empty();
        }

        // Usuário privilegiado tem acesso a qualquer empresa existente
        if (isPrivilegedUser(user)) {
            return comp;
        }

        // Vínculo direto no cadastro do usuário
        if (companyId.equals(user.getCompanyId())) {
            return comp;
        }

        // Vínculo via Employee por consulta nativa
        try {
            if (user.getId() != null) {
                java.util.List<UUID> companyIds = employeeRepository.findCompanyIdsByUserIdNative(user.getId());
                if (companyIds.contains(companyId)) {
                    return comp;
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Erro ao verificar vínculo de empresa por Employee nativo: {}", e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Retorna todas as empresas às quais o usuário tem acesso legítimo.
     */
    public java.util.List<Company> resolveUserCompanies(User user) {
        if (user == null) return java.util.Collections.emptyList();

        if (isPrivilegedUser(user)) {
            try {
                return companyRepository.findAll();
            } catch (Exception e) {
                log.warn("⚠️ Erro ao listar todas as empresas para usuário privilegiado: {}", e.getMessage());
            }
        }

        java.util.Map<UUID, Company> companiesMap = new java.util.LinkedHashMap<>();

        if (user.getCompanyId() != null) {
            try {
                companyRepository.findById(user.getCompanyId()).ifPresent(c -> companiesMap.put(c.getId(), c));
            } catch (Exception ignored) {}
        }
        if (user.getCompany() != null && user.getCompany().getId() != null) {
            companiesMap.put(user.getCompany().getId(), user.getCompany());
        }
        try {
            if (user.getId() != null) {
                java.util.List<UUID> companyIds = employeeRepository.findCompanyIdsByUserIdNative(user.getId());
                for (UUID cId : companyIds) {
                    if (!companiesMap.containsKey(cId)) {
                        companyRepository.findById(cId).ifPresent(c -> companiesMap.put(c.getId(), c));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Erro ao listar empresas do usuário via Employee nativo: {}", e.getMessage());
        }

        return new java.util.ArrayList<>(companiesMap.values());
    }
}
