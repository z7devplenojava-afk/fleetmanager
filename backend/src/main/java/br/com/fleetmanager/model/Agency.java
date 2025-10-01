package br.com.fleetmanager.model;

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
    private Bank bank; // Referência ao banco
    
    @Column(nullable = false, length = 10)
    private String code; // Código da agência (ex: 1234, 5678)
    
    @Column(nullable = false, length = 100)
    private String name; // Nome da agência
    
    @Column(length = 20)
    private String shortName; // Nome abreviado da agência
    
    @Column(length = 500)
    private String description; // Descrição da agência
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private AgencyStatus status; // Status da agência
    
    @Column(length = 20)
    private String phone; // Telefone da agência
    
    @Column(length = 200)
    private String address; // Endereço da agência
    
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
    private String notes; // Observações adicionais
    
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
