package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import java.util.UUID;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeProfileDTO {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String cpf;
    private String rg;
    private LocalDate birthDate;
    private LocalDate admissionDate;
    private String position;
    private String department;
    private EmploymentStatus status;
    private String registrationNumber;
    private String workPost;
    private String workShift;
    private Double salary;
    private String bank;
    private String bankAgency;
    private String bankAccount;
    private String pixKey;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String emergencyContact;
    private String emergencyPhone;
    private String education;
    private String experience;
    private String skills;
    private String profilePhoto;

    public static EmployeeProfileDTO fromEntity(Employee employee) {
        if (employee == null) return null;
        
        return EmployeeProfileDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .cpf(employee.getDocument())
                .rg(employee.getCinNumero())
                .birthDate(employee.getBirthDate())
                .admissionDate(employee.getHireDate())
                .position(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .department(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .status(employee.getStatus())
                .registrationNumber(employee.getRegistrationNumber())
                .workPost(employee.getWorkPost() != null ? employee.getWorkPost().getName() : null)
                .workShift(employee.getHorarioTrabalho())
                .salary(employee.getSalario() != null ? employee.getSalario().doubleValue() : null)
                .bank(employee.getBanco())
                .bankAgency(employee.getAgencia())
                .bankAccount(employee.getContaCorrente())
                .pixKey(null)
                .address(employee.getAddress())
                .city(employee.getEnderecoCidade())
                .state(employee.getEnderecoEstado())
                .zipCode(employee.getEnderecoCep())
                .emergencyContact(null)
                .emergencyPhone(employee.getTelefoneContato())
                .education(employee.getGrauInstrucao())
                .experience(null)
                .skills(null)
                .profilePhoto(null)
                .build();
    }
}
