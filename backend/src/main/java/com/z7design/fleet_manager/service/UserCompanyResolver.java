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
     * Retorna a Company do usuário. Primeiro tenta user.getCompanyId(),
     * depois user.getCompany(), depois Employee -> Company.
     */
    public Optional<Company> resolveCompany(User user) {
        if (user == null)
            return Optional.empty();

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

        // 3. Tentar por Employee
        try {
            if (user.getId() != null) {
                return employeeRepository.findByUserId(user.getId())
                        .map(Employee::getCompany)
                        .filter(c -> c != null && c.getId() != null);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erro ao resolver empresa por Employee: {}", e.getMessage());
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

        try {
            // Tenta buscar diretamente pelo ID
            Optional<Company> comp = companyRepository.findById(companyId);
            if (comp.isPresent()) {
                return comp;
            }
        } catch (Exception ignored) {}

        try {
            // Busca nos registros de Employee
            return employeeRepository.findByUser(user).stream()
                    .filter(emp -> emp != null && companyId.equals(emp.getCompanyId()))
                    .map(Employee::getCompany)
                    .filter(c -> c != null)
                    .findFirst();
        } catch (Exception e) {
            log.warn("⚠️ Erro ao resolver empresa específica: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Retorna todas as empresas às quais o usuário tem acesso legítimo.
     */
    public java.util.List<Company> resolveUserCompanies(User user) {
        if (user == null) return java.util.Collections.emptyList();
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
            employeeRepository.findByUser(user).stream()
                    .map(Employee::getCompany)
                    .filter(c -> c != null && c.getId() != null)
                    .forEach(c -> companiesMap.putIfAbsent(c.getId(), c));
        } catch (Exception e) {
            log.warn("⚠️ Erro ao listar empresas do usuário: {}", e.getMessage());
        }

        return new java.util.ArrayList<>(companiesMap.values());
    }
}
