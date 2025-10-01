package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.EmployeeDTO;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.enums.EmploymentStatus;
import br.com.fleetmanager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HRService {
    
    private final EmployeeRepository employeeRepository;
    
    public List<EmployeeDTO> getEmployeesWithExpiringProbation(int days) {
        try {
            // Por enquanto, retorna funcionários ativos (mock)
            List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
            return employees.stream()
                    .limit(5) // Mock: retorna apenas 5 funcionários
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Em caso de erro, retorna lista vazia
            return List.of();
        }
    }
    
    public Map<String, Object> getHRStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Contadores básicos
            long totalEmployees = employeeRepository.count();
            long activeEmployees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE).size();
            long onLeave = employeeRepository.findByStatus(EmploymentStatus.VACATION).size();
            
            // Funcionários com experiência vencendo (mock)
            long probationExpiring = 3L; // Mock
            
            // Estatísticas por status
            Map<String, Long> byStatus = new HashMap<>();
            byStatus.put("ACTIVE", (long) employeeRepository.findByStatus(EmploymentStatus.ACTIVE).size());
            byStatus.put("INACTIVE", (long) employeeRepository.findByStatus(EmploymentStatus.INACTIVE).size());
            byStatus.put("VACATION", (long) employeeRepository.findByStatus(EmploymentStatus.VACATION).size());
            byStatus.put("MATERNITY_LEAVE", (long) employeeRepository.findByStatus(EmploymentStatus.MATERNITY_LEAVE).size());
            byStatus.put("MEDICAL_CERTIFICATE", (long) employeeRepository.findByStatus(EmploymentStatus.MEDICAL_CERTIFICATE).size());
            byStatus.put("TERMINATED", (long) employeeRepository.findByStatus(EmploymentStatus.TERMINATED).size());
            byStatus.put("SUSPENDED", (long) employeeRepository.findByStatus(EmploymentStatus.SUSPENDED).size());
        
        // Estatísticas por unidade (mock por enquanto)
        Map<String, Long> byUnit = new HashMap<>();
        byUnit.put("Unidade Centro", 25L);
        byUnit.put("Unidade Norte", 18L);
        byUnit.put("Unidade Sul", 22L);
        
        // Estatísticas por posição (mock por enquanto)
        Map<String, Long> byPosition = new HashMap<>();
        byPosition.put("Vigilante", 45L);
        byPosition.put("Supervisor", 12L);
        byPosition.put("Gerente", 8L);
        
            stats.put("totalEmployees", totalEmployees);
            stats.put("activeEmployees", activeEmployees);
            stats.put("onVacation", onLeave); // Mock: usando VACATION como férias
            stats.put("onSickLeave", 2L); // Mock
            stats.put("probationExpiring", probationExpiring);
            stats.put("openVacancies", 5L); // Mock
            stats.put("pendingTransfers", 3L); // Mock
            stats.put("pendingOccurrences", 7L); // Mock
            stats.put("pendingVacations", 12L); // Mock
            stats.put("byStatus", byStatus);
            stats.put("byUnit", byUnit);
            stats.put("byPosition", byPosition);
            
            return stats;
        } catch (Exception e) {
            // Em caso de erro, retorna estatísticas básicas
            Map<String, Object> fallbackStats = new HashMap<>();
            fallbackStats.put("totalEmployees", 0L);
            fallbackStats.put("activeEmployees", 0L);
            fallbackStats.put("onVacation", 0L);
            fallbackStats.put("onSickLeave", 0L);
            fallbackStats.put("probationExpiring", 0L);
            fallbackStats.put("openVacancies", 0L);
            fallbackStats.put("pendingTransfers", 0L);
            fallbackStats.put("pendingOccurrences", 0L);
            fallbackStats.put("pendingVacations", 0L);
            fallbackStats.put("byStatus", new HashMap<String, Long>());
            fallbackStats.put("byUnit", new HashMap<String, Long>());
            fallbackStats.put("byPosition", new HashMap<String, Long>());
            return fallbackStats;
        }
    }
    
    public List<EmployeeDTO> getActiveEmployees() {
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesOnVacation() {
        // Mock: retorna funcionários ativos como se estivessem de férias
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(3) // Mock: retorna apenas 3 funcionários
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesOnSickLeave() {
        // Mock: retorna funcionários ativos como se estivessem de licença
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(2) // Mock: retorna apenas 2 funcionários
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesByUnit(String unitId) {
        // Por enquanto, retorna funcionários ativos (mock)
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(10) // Mock: retorna apenas 10 funcionários
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesByPosition(String positionId) {
        // Por enquanto, retorna funcionários ativos (mock)
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(10) // Mock: retorna apenas 10 funcionários
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private EmployeeDTO convertToDTO(Employee employee) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .cpf(employee.getDocument()) // Usar o campo document como CPF
                .rg(null) // Não existe no modelo atual
                .birthDate(employee.getBirthDate())
                .gender(null) // Não existe no modelo atual
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .address(convertAddressToDTO(employee))
                .bankInfo(convertBankInfoToDTO(employee))
                .jobInfo(convertJobInfoToDTO(employee))
                .documents(convertDocumentsToDTO(employee))
                .emergencyContact(convertEmergencyContactToDTO(employee))
                .build();
    }

    private EmployeeDTO.AddressDTO convertAddressToDTO(Employee employee) {
        return EmployeeDTO.AddressDTO.builder()
                .street(employee.getAddress())
                .city(null) // Não existe no modelo atual
                .state(null) // Não existe no modelo atual
                .zipCode(null) // Não existe no modelo atual
                .build();
    }

    private EmployeeDTO.BankInfoDTO convertBankInfoToDTO(Employee employee) {
        return EmployeeDTO.BankInfoDTO.builder()
                .bank(null) // Não existe no modelo atual
                .agency(null) // Não existe no modelo atual
                .account(null) // Não existe no modelo atual
                .accountType(null) // Não existe no modelo atual
                .build();
    }

    private EmployeeDTO.JobInfoDTO convertJobInfoToDTO(Employee employee) {
        return EmployeeDTO.JobInfoDTO.builder()
                .position(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .function(null) // Não existe no modelo atual
                .unit(employee.getUnit() != null ? employee.getUnit().getName() : null)
                .admissionDate(employee.getHireDate())
                .probationEndDate(null) // Não existe no modelo atual
                .contractType(null) // Não existe no modelo atual
                .salary(null) // Não existe no modelo atual
                .status(employee.getStatus().toString())
                .build();
    }

    private List<EmployeeDTO.DocumentDTO> convertDocumentsToDTO(Employee employee) {
        // Mock: retorna lista vazia por enquanto
        return List.of();
    }

    private EmployeeDTO.EmergencyContactDTO convertEmergencyContactToDTO(Employee employee) {
        // Mock: retorna null por enquanto
        return null;
    }
} 