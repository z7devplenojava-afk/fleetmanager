package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.EmployeeCertification;
import com.z7design.fleet_manager.model.enums.CertificationStatus;
import lombok.Builder;
import org.hibernate.Hibernate;

import java.time.LocalDate;
import java.util.UUID;

@Builder
public record EmployeeCertificationResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String employeeDocument,
        String employeePosition,
        String employeeDepartment,
        UUID trainingId,
        String trainingName,
        Integer renewalPeriodMonths,
        UUID workPostId,
        String workPostName,
        String certificationNumber,
        LocalDate issueDate,
        LocalDate expirationDate,
        CertificationStatus status,
        String documentUrl
) {
    public static EmployeeCertificationResponse fromEntity(EmployeeCertification certification) {
        if (certification == null) {
            return null;
        }
        
        try {
            String positionName = null;
            String departmentName = null;
            
            if (certification.getEmployee() != null) {
                // Obter nome do cargo (position) - inicializar explicitamente se necessÃ¡rio
                try {
                    var employee = certification.getEmployee();
                    // Garantir que o Employee e seus relacionamentos foram inicializados
                    Hibernate.initialize(employee);
                    
                    if (employee.getPosition() != null) {
                        // Garantir que o Position foi inicializado (pode ser um proxy lazy)
                        Hibernate.initialize(employee.getPosition());
                        
                        // Tentar acessar o nome do position
                        try {
                            positionName = employee.getPosition().getName();
                            System.out.println("âœ… EmployeeCertificationResponse - Position encontrado: " + positionName + 
                                " para employee: " + employee.getName() + " (ID: " + employee.getId() + ")");
                        } catch (org.hibernate.LazyInitializationException e) {
                            System.err.println("âš ï¸ EmployeeCertificationResponse - LazyInitializationException ao acessar position.getName()");
                            // Tentar buscar o position novamente do banco
                            positionName = null;
                        }
                    } else {
                        System.out.println("âš ï¸ EmployeeCertificationResponse - Position Ã© null para employee: " + 
                            employee.getName() + " (ID: " + employee.getId() + ")");
                    }
                } catch (Exception e) {
                    System.err.println("âŒ EmployeeCertificationResponse - Erro ao obter position: " + e.getMessage());
                    if (e instanceof org.hibernate.LazyInitializationException) {
                        System.err.println("   -> LazyInitializationException: o relacionamento nÃ£o foi carregado pelo EntityGraph");
                    }
                    e.printStackTrace();
                }
                
                // Obter nome do setor (unit ou workPost)
                try {
                    // Priorizar workPost se existir
                    if (certification.getWorkPost() != null) {
                        Hibernate.initialize(certification.getWorkPost());
                        departmentName = certification.getWorkPost().getName();
                    } else if (certification.getEmployee().getUnit() != null) {
                        Hibernate.initialize(certification.getEmployee().getUnit());
                        departmentName = certification.getEmployee().getUnit().getName();
                    }
                } catch (Exception e) {
                    System.err.println("âŒ EmployeeCertificationResponse - Erro ao obter department/unit: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            return EmployeeCertificationResponse.builder()
                    .id(certification.getId())
                    .employeeId(certification.getEmployee() != null ? certification.getEmployee().getId() : null)
                    .employeeName(certification.getEmployee() != null ? certification.getEmployee().getName() : null)
                    .employeeDocument(certification.getEmployee() != null ? certification.getEmployee().getDocument() : null)
                    .employeePosition(positionName)
                    .employeeDepartment(departmentName)
                    .trainingId(certification.getTraining() != null ? certification.getTraining().getId() : null)
                    .trainingName(certification.getTraining() != null ? certification.getTraining().getName() : null)
                    .renewalPeriodMonths(certification.getTraining() != null ? certification.getTraining().getRenewalPeriodMonths() : null)
                    .workPostId(certification.getWorkPost() != null ? certification.getWorkPost().getId() : null)
                    .workPostName(certification.getWorkPost() != null ? certification.getWorkPost().getName() : null)
                    .certificationNumber(certification.getCertificationNumber())
                    .issueDate(certification.getIssueDate())
                    .expirationDate(certification.getExpirationDate())
                    .status(certification.getStatus())
                    .documentUrl(certification.getDocumentUrl())
                    .build();
        } catch (Exception e) {
            // Log do erro e retornar null serÃ¡ filtrado no controller
            throw new RuntimeException("Erro ao converter EmployeeCertification para DTO: " + e.getMessage(), e);
        }
    }
}


