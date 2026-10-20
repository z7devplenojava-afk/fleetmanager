package com.z7design.fleet_manager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "cid10_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cid10Entry {

    @Id
    @Column(length = 15)
    private String code;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 150)
    private String category;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
