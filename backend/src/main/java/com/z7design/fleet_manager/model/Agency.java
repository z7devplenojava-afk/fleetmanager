package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agency {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id", nullable = false)
    private Bank bank; // ReferÃªncia ao banco
    
    @Column(nullable = false, length = 10)
    private String code; // CÃ³digo da agÃªncia (ex: 1234, 5678)
    
    @Column(nullable = false, length = 100)
    private String name; // Nome da agÃªncia
    
    @Column(length = 20)
    private String shortName; // Nome abreviado da agÃªncia
    
    @Column(length = 500)
    private String description; // DescriÃ§Ã£o da agÃªncia
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private AgencyStatus status; // Status da agÃªncia
    
    @Column(length = 20)
    private String phone; // Telefone da agÃªncia
    
    @Column(length = 200)
    private String address; // EndereÃ§o da agÃªncia
    
    @Column(length = 50)
    private String city; // Cidade
    
    @Column(length = 2)
    private String state; // Estado (UF)
    
    @Column(length = 10)
    private String zipCode; // CEP
    
    @Column(length = 100)
    private String manager; // Nome do gerente
    
    @Column(length = 20)
    private String managerPhone; // Telefone do gerente
    
    @Column(length = 100)
    private String managerEmail; // Email do gerente
    
    @Column(length = 1000)
    private String notes; // ObservaÃ§Ãµes adicionais
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum AgencyStatus {
        ACTIVE, INACTIVE, SUSPENDED, MAINTENANCE
    }
}

