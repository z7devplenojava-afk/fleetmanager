package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "holidays", 
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"date", "name"},
           name = "unique_holiday_date_name"
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private HolidayType type;

    @Column(name = "is_optional", nullable = false)
    private Boolean isOptional = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "state_code", length = 2)
    private String stateCode; // Para feriados estaduais

    @Column(name = "city_name", length = 100)
    private String cityName; // Para feriados municipais

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum HolidayType {
        NATIONAL,
        STATE,
        MUNICIPAL,
        CONVENTION
    }
}






