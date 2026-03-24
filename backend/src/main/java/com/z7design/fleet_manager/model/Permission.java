package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    // Getters e Setters explÃ­citos para resolver problemas de compilaÃ§Ã£o com
    // Lombok
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public static PermissionBuilder builder() {
        return new PermissionBuilder();
    }

    public static class PermissionBuilder {
        private Permission instance = new Permission();

        public PermissionBuilder name(String name) {
            instance.setName(name);
            return this;
        }

        public PermissionBuilder description(String description) {
            instance.setDescription(description);
            return this;
        }

        public Permission build() {
            return instance;
        }
    }
}
