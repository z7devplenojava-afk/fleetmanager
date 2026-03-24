package com.z7design.fleet_manager.util;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticatedCpfResolver {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public Optional<String> resolve(Authentication authentication) {
        if (authentication == null) {
            return Optional.empty();
        }

        if (authentication.getPrincipal() instanceof User userPrincipal) {
            Optional<String> cpf = extractCpfFromUser(userPrincipal);
            if (cpf.isPresent()) {
                return cpf;
            }
        }

        String authName = authentication.getName();
        Optional<String> cpfFromName = normalizeCpf(authName);
        if (cpfFromName.isPresent()) {
            return cpfFromName;
        }

        Optional<User> userByUsername = userRepository.findByUsername(authName);
        if (userByUsername.isPresent()) {
            Optional<String> cpf = extractCpfFromUser(userByUsername.get());
            if (cpf.isPresent()) {
                return cpf;
            }
        }

        Optional<User> userByEmail = userRepository.findByEmail(authName);
        if (userByEmail.isPresent()) {
            return extractCpfFromUser(userByEmail.get());
        }

        return Optional.empty();
    }

    public Optional<String> normalizeCpf(String value) {
        if (value == null) {
            return Optional.empty();
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() == 11) {
            return Optional.of(digits);
        }
        return Optional.empty();
    }

    public Optional<String> extractCpfFromUser(User user) {
        if (user == null) {
            return Optional.empty();
        }

        Optional<String> cpf = normalizeCpf(user.getUsername());
        if (cpf.isPresent()) {
            return cpf;
        }

        cpf = normalizeCpf(user.getEmail());
        if (cpf.isPresent()) {
            return cpf;
        }

        if (user.getId() != null) {
            Optional<Employee> byUserId = employeeRepository.findByUserId(user.getId());
            if (byUserId.isPresent()) {
                cpf = extractCpfFromEmployee(byUserId.get());
                if (cpf.isPresent()) {
                    return cpf;
                }
            }
        }

        Optional<Employee> byEmail = employeeRepository.findByEmail(user.getEmail());
        if (byEmail.isPresent()) {
            cpf = extractCpfFromEmployee(byEmail.get());
            if (cpf.isPresent()) {
                return cpf;
            }
        }

        Optional<Employee> byDocument = employeeRepository.findByDocument(user.getUsername());
        if (byDocument.isPresent()) {
            cpf = extractCpfFromEmployee(byDocument.get());
            if (cpf.isPresent()) {
                return cpf;
            }
        }

        Optional<Employee> byName = employeeRepository.findByNameExact(user.getName());
        if (byName.isPresent()) {
            cpf = extractCpfFromEmployee(byName.get());
            if (cpf.isPresent()) {
                return cpf;
            }
        }

        return Optional.empty();
    }

    public Optional<String> extractCpfFromEmployee(Employee employee) {
        if (employee == null) {
            return Optional.empty();
        }
        return normalizeCpf(employee.getDocument());
    }
}


