package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "equipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EquipmentStatus status;
    
    @Column(name = "ballistic_plate", length = 100)
    private String ballisticPlate;
    
    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;
    
    @Column(name = "six_year_expiry")
    private LocalDate sixYearExpiry;
    
    @Column(name = "weapon_registration_validity")
    private LocalDate weaponRegistrationValidity;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "usage_type")
    private EquipmentUsage usageType;
    
    @Column(name = "serial_number", unique = true, nullable = false, length = 100)
    private String serialNumber;
    
    @Column(name = "ca_number", length = 50)
    private String caNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "protection_level")
    private ProtectionLevel protectionLevel;
    
    @Column(name = "batch", length = 100)
    private String batch;
    
    @Column(name = "model", length = 100)
    private String model;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "size")
    private EquipmentSize size;
    
    @Column(name = "validity_date")
    private LocalDate validityDate;
    
    @Column(name = "is_dangerous", nullable = false)
    @Builder.Default
    private Boolean isDangerous = false;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "qr_code")
    private String qrCode;
    
    // Comentando temporariamente para resolver problema de inicialização
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "current_user_id")
    // private Employee currentUser;
    
    @Column(name = "current_user_id")
    private UUID currentUserId; // Usando apenas o ID por enquanto
    
    @Column(name = "last_maintenance_date")
    private LocalDate lastMaintenanceDate;
    
    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (sixYearExpiry == null && manufacturingDate != null) {
            sixYearExpiry = manufacturingDate.plusYears(6);
        }
        if (validityDate == null && manufacturingDate != null) {
            validityDate = manufacturingDate.plusYears(5); // Validade padrão de 5 anos
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (sixYearExpiry == null && manufacturingDate != null) {
            sixYearExpiry = manufacturingDate.plusYears(6);
        }
    }
    
    // Métodos auxiliares para verificar vencimentos
    public boolean isExpiringSoon(int days) {
        if (validityDate == null) return false;
        LocalDate alertDate = LocalDate.now().plusDays(days);
        return validityDate.isBefore(alertDate);
    }
    
    public boolean isWeaponRegistrationExpiringSoon(int days) {
        if (weaponRegistrationValidity == null) return false;
        LocalDate alertDate = LocalDate.now().plusDays(days);
        return weaponRegistrationValidity.isBefore(alertDate);
    }
    
    public boolean isExpired() {
        if (validityDate == null) return false;
        return validityDate.isBefore(LocalDate.now());
    }
    
    public boolean isWeaponRegistrationExpired() {
        if (weaponRegistrationValidity == null) return false;
        return weaponRegistrationValidity.isBefore(LocalDate.now());
    }
} 