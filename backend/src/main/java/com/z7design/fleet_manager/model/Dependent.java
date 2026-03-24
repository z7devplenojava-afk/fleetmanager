package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.z7design.fleet_manager.validation.Cpf;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dependents")
public class Dependent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference("employee-dependents")
    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    private Employee employee;
    
    @Column(nullable = false, length = 100)
    @NotBlank(message = "Nome do dependente Ã© obrigatÃ³rio")
    private String name;
    
    @Column(nullable = false, length = 50)
    @NotBlank(message = "RelaÃ§Ã£o com o dependente Ã© obrigatÃ³ria")
    private String relationship;
    
    @Column(name = "birth_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "Data de nascimento Ã© obrigatÃ³ria")
    private LocalDate birthDate;
    
    @Column(length = 14)
    @NotBlank(message = "O CPF Ã© obrigatÃ³rio")
    @Cpf(message = "CPF invÃ¡lido")
    private String cpf;
    
    @Column(length = 20)
    private String rg;
    
    @Column(name = "gender", length = 1)
    private String gender; // M, F, OUTRO
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    @Column(name = "email", length = 100)
    private String email;
    
    @Column(name = "address", length = 255)
    private String address;
    
    @Column(name = "city", length = 100)
    private String city;
    
    @Column(name = "state", length = 2)
    private String state;
    
    @Column(name = "zip_code", length = 10)
    private String zipCode;
    
    @Column(name = "is_student")
    private Boolean isStudent;
    
    @Column(name = "school_name", length = 100)
    private String schoolName;
    
    @Column(name = "is_beneficiary")
    private Boolean isBeneficiary;
    
    @Column(name = "notes", length = 500)
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
} 
