package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EmployeeDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
            LocalDate today = LocalDate.now();
            LocalDate threeDaysFromNow = today.plusDays(3);
            
            // Buscar funcionÃ¡rios ativos
            List<Employee> activeEmployees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
            
            return activeEmployees.stream()
                    .filter(employee -> {
                        // Verificar se tem data de admissÃ£o
                        if (employee.getHireDate() == null) {
                            return false;
                        }
                        
                        // Calcular perÃ­odo de experiÃªncia baseado na data de admissÃ£o
                        LocalDate probationEndDate = employee.getProbationEndDate();
                        LocalDate hireDate = employee.getHireDate();
                        
                        // Se nÃ£o tiver probationEndDate, calcular baseado na data de admissÃ£o
                        if (probationEndDate == null) {
                            // Calcular para diferentes perÃ­odos de experiÃªncia (30, 45, 90 dias)
                            LocalDate endDate30 = hireDate.plusDays(30);
                            LocalDate endDate45 = hireDate.plusDays(45);
                            LocalDate endDate90 = hireDate.plusDays(90);
                            
                            // Verificar se algum dos perÃ­odos estÃ¡ vencendo (hoje ou nos prÃ³ximos 3 dias)
                            boolean expiring30 = !endDate30.isBefore(today) && !endDate30.isAfter(threeDaysFromNow);
                            boolean expiring45 = !endDate45.isBefore(today) && !endDate45.isAfter(threeDaysFromNow);
                            boolean expiring90 = !endDate90.isBefore(today) && !endDate90.isAfter(threeDaysFromNow);
                            
                            // Retornar true se algum perÃ­odo estiver vencendo
                            return expiring30 || expiring45 || expiring90;
                        } else {
                            // Se jÃ¡ tiver probationEndDate, verificar se estÃ¡ vencendo
                            // Verificar se o perÃ­odo de experiÃªncia Ã© 30, 45 ou 90 dias
                            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(hireDate, probationEndDate);
                            
                            // Apenas perÃ­odos de 30, 45 ou 90 dias
                            if (daysBetween != 30 && daysBetween != 45 && daysBetween != 90) {
                                return false;
                            }
                            
                            // Verificar se estÃ¡ vencendo (hoje ou nos prÃ³ximos 3 dias)
                            return !probationEndDate.isBefore(today) && !probationEndDate.isAfter(threeDaysFromNow);
                        }
                    })
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
            
            // Contadores bÃ¡sicos
            long totalEmployees = employeeRepository.count();
            long activeEmployees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE).size();
            long onLeave = employeeRepository.findByStatus(EmploymentStatus.VACATION).size();
            
            // FuncionÃ¡rios com experiÃªncia vencendo (mock)
            long probationExpiring = 3L; // Mock
            
            // EstatÃ­sticas por status
            Map<String, Long> byStatus = new HashMap<>();
            byStatus.put("ACTIVE", (long) employeeRepository.findByStatus(EmploymentStatus.ACTIVE).size());
            byStatus.put("INACTIVE", (long) employeeRepository.findByStatus(EmploymentStatus.INACTIVE).size());
            byStatus.put("VACATION", (long) employeeRepository.findByStatus(EmploymentStatus.VACATION).size());
            byStatus.put("MATERNITY_LEAVE", (long) employeeRepository.findByStatus(EmploymentStatus.MATERNITY_LEAVE).size());
            byStatus.put("MEDICAL_CERTIFICATE", (long) employeeRepository.findByStatus(EmploymentStatus.MEDICAL_CERTIFICATE).size());
            byStatus.put("TERMINATED", (long) employeeRepository.findByStatus(EmploymentStatus.TERMINATED).size());
            byStatus.put("SUSPENDED", (long) employeeRepository.findByStatus(EmploymentStatus.SUSPENDED).size());
        
        // EstatÃ­sticas por unidade (mock por enquanto)
        Map<String, Long> byUnit = new HashMap<>();
        byUnit.put("Unidade Centro", 25L);
        byUnit.put("Unidade Norte", 18L);
        byUnit.put("Unidade Sul", 22L);
        
        // EstatÃ­sticas por posiÃ§Ã£o (mock por enquanto)
        Map<String, Long> byPosition = new HashMap<>();
        byPosition.put("Vigilante", 45L);
        byPosition.put("Supervisor", 12L);
        byPosition.put("Gerente", 8L);
        
            stats.put("totalEmployees", totalEmployees);
            stats.put("activeEmployees", activeEmployees);
            stats.put("onVacation", onLeave); // Mock: usando VACATION como fÃ©rias
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
            // Em caso de erro, retorna estatÃ­sticas bÃ¡sicas
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
        // Mock: retorna funcionÃ¡rios ativos como se estivessem de fÃ©rias
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(3) // Mock: retorna apenas 3 funcionÃ¡rios
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesOnSickLeave() {
        // Mock: retorna funcionÃ¡rios ativos como se estivessem de licenÃ§a
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(2) // Mock: retorna apenas 2 funcionÃ¡rios
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesByUnit(String unitId) {
        // Por enquanto, retorna funcionÃ¡rios ativos (mock)
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(10) // Mock: retorna apenas 10 funcionÃ¡rios
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<EmployeeDTO> getEmployeesByPosition(String positionId) {
        // Por enquanto, retorna funcionÃ¡rios ativos (mock)
        List<Employee> employees = employeeRepository.findByStatus(EmploymentStatus.ACTIVE);
        return employees.stream()
                .limit(10) // Mock: retorna apenas 10 funcionÃ¡rios
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private EmployeeDTO convertToDTO(Employee employee) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .cpf(employee.getDocument()) // Usar o campo document como CPF
                .rg(null) // NÃ£o existe no modelo atual
                .birthDate(employee.getBirthDate())
                .gender(null) // NÃ£o existe no modelo atual
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
                .city(null) // NÃ£o existe no modelo atual
                .state(null) // NÃ£o existe no modelo atual
                .zipCode(null) // NÃ£o existe no modelo atual
                .build();
    }

    private EmployeeDTO.BankInfoDTO convertBankInfoToDTO(Employee employee) {
        return EmployeeDTO.BankInfoDTO.builder()
                .bank(null) // NÃ£o existe no modelo atual
                .agency(null) // NÃ£o existe no modelo atual
                .account(null) // NÃ£o existe no modelo atual
                .accountType(null) // NÃ£o existe no modelo atual
                .build();
    }

    private EmployeeDTO.JobInfoDTO convertJobInfoToDTO(Employee employee) {
        // Calcular probationEndDate se nÃ£o estiver definido
        LocalDate probationEndDate = employee.getProbationEndDate();
        if (probationEndDate == null && employee.getHireDate() != null) {
            // Tentar calcular para 30, 45 ou 90 dias e verificar qual estÃ¡ vencendo
            LocalDate today = LocalDate.now();
            LocalDate threeDaysFromNow = today.plusDays(3);
            LocalDate endDate30 = employee.getHireDate().plusDays(30);
            LocalDate endDate45 = employee.getHireDate().plusDays(45);
            LocalDate endDate90 = employee.getHireDate().plusDays(90);
            
            // Verificar qual perÃ­odo estÃ¡ vencendo (hoje ou nos prÃ³ximos 3 dias)
            if (!endDate30.isBefore(today) && !endDate30.isAfter(threeDaysFromNow)) {
                probationEndDate = endDate30;
            } else if (!endDate45.isBefore(today) && !endDate45.isAfter(threeDaysFromNow)) {
                probationEndDate = endDate45;
            } else if (!endDate90.isBefore(today) && !endDate90.isAfter(threeDaysFromNow)) {
                probationEndDate = endDate90;
            }
        }
        
        return EmployeeDTO.JobInfoDTO.builder()
                .position(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .function(null) // NÃ£o existe no modelo atual
                .unit(employee.getUnit() != null ? employee.getUnit().getName() : null)
                .admissionDate(employee.getHireDate())
                .probationEndDate(probationEndDate)
                .contractType(null) // NÃ£o existe no modelo atual
                .salary(null) // NÃ£o existe no modelo atual
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
