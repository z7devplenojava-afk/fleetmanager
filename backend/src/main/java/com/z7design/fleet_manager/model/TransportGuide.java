package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.TransportGuideStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "transport_guides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 18)
    private String cnpj;

    @Column(nullable = false)
    private String empresa;

    @Column(length = 50)
    private String numeroColete;

    @Column(nullable = false, length = 50)
    private String numeroArma;

    @Column(nullable = false, length = 20)
    private String calibre;

    @Column(nullable = false)
    private Integer qtdMunicoes;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String origem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String destino;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String trajeto;

    @Column(nullable = false)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransportGuideStatus status;

    @Column(length = 500)
    private String arquivoGuiaPath;

    @Column(nullable = false)
    private String createdBy;

    private String approvedBy;

    private LocalDateTime approvedAt;

    private String rejectedBy;

    private LocalDateTime rejectedAt;

    private String rejectionReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = TransportGuideStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}




























