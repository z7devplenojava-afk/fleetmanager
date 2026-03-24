package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.EquipmentSize;
import com.z7design.fleet_manager.model.enums.EquipmentStatus;
import com.z7design.fleet_manager.model.enums.EquipmentUsage;
import com.z7design.fleet_manager.model.enums.ProtectionLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade para gestÃ£o de equipamentos de seguranÃ§a
 * Mapeia a tabela 'equipments' criada pela V154
 */
@Entity
@Table(name = "equipments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Equipment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentStatus status;
    
    @Column(name = "ballistic_plate")
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
    
    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;
    
    @Column(name = "ca_number")
    private String caNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "protection_level")
    private ProtectionLevel protectionLevel;
    
    @Column(name = "batch")
    private String batch;
    
    @Column(name = "model")
    private String model;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "size")
    private EquipmentSize size;
    
    @Column(name = "validity_date")
    private LocalDate validityDate;
    
    @Column(name = "is_dangerous", nullable = false)
    @Builder.Default
    private Boolean isDangerous = false;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "qr_code")
    private String qrCode;
    
    @Column(name = "current_user_id")
    private UUID currentUserId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_user_id", insertable = false, updatable = false)
    private Employee currentUser;
    
    @Column(name = "last_maintenance_date")
    private LocalDate lastMaintenanceDate;
    
    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // MÃ©todos auxiliares
    public boolean isExpired() {
        return validityDate != null && validityDate.isBefore(LocalDate.now());
    }
    
    public boolean isExpiringSoon(int days) {
        if (validityDate == null) return false;
        LocalDate alertDate = LocalDate.now().plusDays(days);
        return validityDate.isBefore(alertDate);
    }
    
    public boolean isWeaponRegistrationExpired() {
        return weaponRegistrationValidity != null && weaponRegistrationValidity.isBefore(LocalDate.now());
    }
    
    public boolean isWeaponRegistrationExpiringSoon(int days) {
        if (weaponRegistrationValidity == null) return false;
        LocalDate alertDate = LocalDate.now().plusDays(days);
        return weaponRegistrationValidity.isBefore(alertDate);
    }
    
    public Boolean getIsDangerous() {
        return isDangerous;
    }
}


