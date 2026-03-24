package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import java.util.List;
import com.z7design.fleet_manager.model.Opportunity;

@Entity
@Table(name = "kanban_status")
public class KanbanStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "status")
    private List<Opportunity> opportunities;

    // Getters e Setters
    public java.util.UUID getId() {
        return id;
    }
    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    // ...
} 
