package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fleet_work_order_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetWorkOrderHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    /** STATUS_CHANGE, NOTE, PART_ADDED, COST_UPDATE, ODOMETER, MECHANIC_ASSIGNED */
    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "performed_by", length = 255)
    private String performedBy;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
