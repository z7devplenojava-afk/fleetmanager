package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Resolve a empresa do usuário: diretamente (user.company) ou via Employee.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCompanyResolver {

    private final EmployeeRepository employeeRepository;

    /**
     * Retorna a Company do usuário. Primeiro tenta user.getCompany(),
     * depois Employee -> Company.
     */
    public Optional<Company> resolveCompany(User user) {
        if (user == null)
            return Optional.empty();
        if (user.getCompany() != null && user.getCompany().getId() != null) {
            return Optional.of(user.getCompany());
        }
        return employeeRepository.findByUserId(user.getId())
                .map(Employee::getCompany)
                .filter(c -> c != null && c.getId() != null);
    }

    /**
     * Retorna o empresaId do usuário (UUID ou null).
     */
    public UUID resolveCompanyId(User user) {
        return resolveCompany(user).map(Company::getId).orElse(null);
    }

    /**
     * Resolve uma empresa específica para o usuário.
     * Utilizado durante o login quando uma empresa é selecionada.
     */
    public Optional<Company> resolveSpecificCompany(User user, UUID companyId) {
        if (user == null || companyId == null)
            return Optional.empty();

        // Verifica se é a empresa principal do usuário
        if (user.getCompany() != null && companyId.equals(user.getCompany().getId())) {
            return Optional.of(user.getCompany());
        }

        // Busca nos registros de Employee (onde o usuário pode ter acesso a múltiplas
        // empresas)
        return employeeRepository.findByUser(user).stream()
                .filter(emp -> companyId.equals(emp.getCompanyId()))
                .map(Employee::getCompany)
                .findFirst();
    }
}
