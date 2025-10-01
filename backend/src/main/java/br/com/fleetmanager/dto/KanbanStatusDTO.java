package br.com.fleetmanager.dto;

public class KanbanStatusDTO {
    private java.util.UUID id;
    private String name;
    private Integer orderIndex;
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
} 