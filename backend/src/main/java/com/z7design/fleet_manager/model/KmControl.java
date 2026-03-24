package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.model.Vehicle.FuelType;

@Entity
@Table(name = "km_controls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KmControl {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "supervisor", nullable = false, length = 100)
    private String supervisor;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false)
    private FuelType fuelType;
    
    @Column(name = "initial_km", nullable = false)
    private Integer initialKm;
    
    @Column(name = "final_km", nullable = false)
    private Integer finalKm;
    
    @Column(name = "total_km", nullable = false)
    private Integer totalKm;
    
    @Column(name = "value", nullable = false, precision = 10, scale = 2)
    private BigDecimal value;
    
    @Column(name = "shift_start", nullable = false)
    private LocalTime shiftStart;
    
    @Column(name = "shift_end", nullable = false)
    private LocalTime shiftEnd;
    
    @Column(name = "work_post", nullable = false, length = 100)
    private String workPost;
    
    @Column(name = "problem_description", columnDefinition = "TEXT")
    private String problemDescription;
    
    @Column(name = "work_post_performance", columnDefinition = "TEXT")
    private String workPostPerformance;
    
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;
    
    @Column(name = "initial_km_justification", columnDefinition = "TEXT")
    private String initialKmJustification;
    
    @Column(name = "final_km_justification", columnDefinition = "TEXT")
    private String finalKmJustification;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
    
    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;
    
    @Column(name = "dashboard_photo_url", length = 500)
    private String dashboardPhotoUrl;
    
    @Column(name = "dashboard_photo_description", columnDefinition = "TEXT")
    private String dashboardPhotoDescription;
    
    @Column(name = "fuel_quantity", length = 20)
    private String fuelQuantity;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // MÃ©todo para calcular KM total e validar automaticamente
    @PrePersist
    @PreUpdate
    public void calculateTotalKmAndValidate() {
        System.out.println("=== CALCULANDO KM TOTAL ===");
        System.out.println("KM Inicial: " + initialKm);
        System.out.println("KM Final: " + finalKm);
        System.out.println("Justificativa Inicial: " + initialKmJustification);
        System.out.println("Justificativa Final: " + finalKmJustification);
        
        // Calcular KM total com nova lÃ³gica
        if (initialKm != null && finalKm != null) {
            // Se KM final Ã© 0 e hÃ¡ justificativa, usar KM inicial como total
            if (finalKm == 0 && (finalKmJustification != null && !finalKmJustification.trim().isEmpty())) {
                this.totalKm = initialKm;
                System.out.println("Caso 1: KM final = 0 com justificativa -> Total = " + this.totalKm);
            }
            // Se KM inicial Ã© 0 e hÃ¡ justificativa, usar KM final como total
            else if (initialKm == 0 && (initialKmJustification != null && !initialKmJustification.trim().isEmpty())) {
                this.totalKm = finalKm;
                System.out.println("Caso 2: KM inicial = 0 com justificativa -> Total = " + this.totalKm);
            }
            // Se ambos sÃ£o 0 com justificativas, total Ã© 0
            else if (initialKm == 0 && finalKm == 0 && 
                     (initialKmJustification != null && !initialKmJustification.trim().isEmpty()) &&
                     (finalKmJustification != null && !finalKmJustification.trim().isEmpty())) {
                this.totalKm = 0;
                System.out.println("Caso 3: Ambos = 0 com justificativas -> Total = " + this.totalKm);
            }
            // Caso normal: final - inicial
            else {
                this.totalKm = finalKm - initialKm;
                System.out.println("Caso 4: Normal -> Total = " + this.totalKm);
            }
        }
        // Se apenas um dos valores estÃ¡ preenchido, usar esse valor como total
        else if (initialKm != null && finalKm == null) {
            this.totalKm = initialKm;
            System.out.println("Caso 5: Apenas KM inicial -> Total = " + this.totalKm);
        }
        else if (finalKm != null && initialKm == null) {
            this.totalKm = finalKm;
            System.out.println("Caso 6: Apenas KM final -> Total = " + this.totalKm);
        }
        // Se nenhum estÃ¡ preenchido, total Ã© 0
        else {
            this.totalKm = 0;
            System.out.println("Caso 7: Nenhum preenchido -> Total = " + this.totalKm);
        }
        
        System.out.println("KM Total calculado: " + this.totalKm);
        System.out.println("=== FIM DO CÃLCULO ===");
        
        // Validar KM - permitir 0 quando hÃ¡ justificativa
        if (initialKm != null && finalKm != null) {
            // Se KM final Ã© 0 e hÃ¡ justificativa, permitir
            if (finalKm == 0 && (finalKmJustification != null && !finalKmJustification.trim().isEmpty())) {
                // Permitir KM final = 0 quando hÃ¡ justificativa
            }
            // Se KM inicial Ã© 0 e hÃ¡ justificativa, permitir
            else if (initialKm == 0 && (initialKmJustification != null && !initialKmJustification.trim().isEmpty())) {
                // Permitir KM inicial = 0 quando hÃ¡ justificativa
            }
            // Se ambos sÃ£o 0 com justificativas, permitir
            else if (initialKm == 0 && finalKm == 0 && 
                     (initialKmJustification != null && !initialKmJustification.trim().isEmpty()) &&
                     (finalKmJustification != null && !finalKmJustification.trim().isEmpty())) {
                // Permitir ambos 0 quando hÃ¡ justificativas
            }
            // ValidaÃ§Ã£o normal
            else if (initialKm > finalKm) {
                throw new IllegalArgumentException("KM inicial nÃ£o pode ser maior que KM final");
            }
        }
    }
}

