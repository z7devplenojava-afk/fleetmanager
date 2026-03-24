package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_extract_data_holerites")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractDataHolerites {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "nome", nullable = false, length = 255)
    private String nome;
    
    @Column(name = "cpf", nullable = false, length = 20)
    private String cpf;
    
    @Column(name = "codigo", length = 50)
    private String codigo;
    
    @Column(name = "mes_referencia", nullable = false, length = 7)
    private String mesReferencia;
    
    @Column(name = "ano_referencia", nullable = false)
    private Integer anoReferencia;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 
