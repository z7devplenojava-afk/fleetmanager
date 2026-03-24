package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;
import java.util.UUID;

import com.z7design.fleet_manager.model.Permission;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"), inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions;

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

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public static RoleBuilder builder() {
        return new RoleBuilder();
    }

    public static class RoleBuilder {
        private Role instance = new Role();

        public RoleBuilder name(String name) {
            instance.setName(name);
            return this;
        }

        public RoleBuilder description(String description) {
            instance.setDescription(description);
            return this;
        }

        public RoleBuilder permissions(Set<Permission> permissions) {
            instance.setPermissions(permissions);
            return this;
        }

        public Role build() {
            return instance;
        }
    }
}
