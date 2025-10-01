package br.com.fleetmanager.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "units")
public class Unit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    @Column(nullable = false)
    private String name;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column
    private String description;
    
    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 255, message = "Address must be between 5 and 255 characters")
    @Column(nullable = false)
    private String address;
    
    // Coordenadas geográficas para otimização de rota
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "address_city")
    private String addressCity;
    
    @Column(name = "address_state") 
    private String addressState;
    
    @Column(name = "address_zip_code")
    private String addressZipCode;
    
    @Pattern(regexp = "^(\\()?[0-9]{2}(\\))?\\s?[0-9]{4,5}-?[0-9]{4}$", message = "Phone number must be in the format (XX) XXXX-XXXX or (XX) XXXXX-XXXX")
    @Column
    private String phone;
    
    @Email(message = "Invalid email format")
    @Column
    private String email;
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonBackReference
    private Unit parent;
    
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"parent", "children", "employees", "payrolls", "locations", "client"})
    @Builder.Default
    private List<Unit> children = new ArrayList<>();
    
    @OneToMany(mappedBy = "unit", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"unit", "user", "position"})
    @Builder.Default
    private List<Employee> employees = new ArrayList<>();
    
    @OneToMany(mappedBy = "unit", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"position", "unit", "documents", "benefits", "scaleHistory", "occurrences", "payrolls", "epis", "employee"})
    @Builder.Default
    private List<Payroll> payrolls = new ArrayList<>();
    
    @OneToMany(mappedBy = "unit", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"unit"})
    @Builder.Default
    private List<Location> locations = new ArrayList<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties("units")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Client client;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(length = 20, unique = true)
    private String code;
    
    @Column(length = 100)
    private String manager;
    
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        
        // Garantir que as listas sejam inicializadas
        if (children == null) children = new ArrayList<>();
        if (employees == null) employees = new ArrayList<>();
        if (payrolls == null) payrolls = new ArrayList<>();
        if (locations == null) locations = new ArrayList<>();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 