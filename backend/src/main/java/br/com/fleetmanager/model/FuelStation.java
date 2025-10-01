package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fuel_stations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelStation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(nullable = false)
    private String address;
    
    @Column
    private String city;
    
    @Column
    private String state;
    
    @Column
    private String zipCode;
    
    @Column
    private String phone;
    
    @Column
    private String email;
    
    @Column
    private String cnpj;
    
    @Column
    private String brand; // Marca da bandeira (Ex: Petrobras, Shell, etc.)
    
    @Column
    private String manager; // Nome do gerente
    
    @Column
    private String managerPhone; // Telefone do gerente
    
    @Column
    private String managerEmail; // Email do gerente
    
    @Column
    private String operatingHours; // Horário de funcionamento
    
    @Column
    private String services; // Serviços oferecidos (lavagem, conveniência, etc.)
    
    @Column
    private String paymentMethods; // Formas de pagamento aceitas
    
    @Column
    private BigDecimal latitude; // Latitude para GPS
    
    @Column
    private BigDecimal longitude; // Longitude para GPS
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FuelStationStatus status = FuelStationStatus.ACTIVE;
    
    @Column
    private String notes; // Observações adicionais
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum FuelStationStatus {
        ACTIVE("Ativo"),
        INACTIVE("Inativo"),
        MAINTENANCE("Em Manutenção"),
        CLOSED("Fechado");
        
        private final String displayName;
        
        FuelStationStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
