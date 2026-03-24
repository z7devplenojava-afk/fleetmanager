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
@Table(name = "banks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bank {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 10, unique = true)
    private String code; // CÃ³digo do banco (ex: 001, 237, 341)
    
    @Column(nullable = false, length = 100)
    private String name; // Nome do banco (ex: Banco do Brasil, Bradesco, ItaÃº)
    
    @Column(length = 20)
    private String shortName; // Nome abreviado (ex: BB, Bradesco, ItaÃº)
    
    @Column(length = 20)
    private String cnpj; // CNPJ do banco
    
    @Column(length = 500)
    private String description; // DescriÃ§Ã£o adicional
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private BankStatus status; // Status do banco
    
    @Column(length = 100)
    private String website; // Site do banco
    
    @Column(length = 20)
    private String phone; // Telefone de contato
    
    @Column(length = 200)
    private String address; // EndereÃ§o principal
    
    @Column(length = 50)
    private String city; // Cidade
    
    @Column(length = 2)
    private String state; // Estado (UF)
    
    @Column(length = 10)
    private String zipCode; // CEP
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum BankStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }
}

