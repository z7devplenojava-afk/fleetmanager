package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import com.z7design.fleet_manager.model.enums.UserStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;

@Entity
@Table(name = "users")
@Getter
@Setter
@ToString(exclude = { "groups", "roles", "permissions" })
@EqualsAndHashCode(of = { "id" })
@JsonIgnoreProperties({ "groups", "hibernateLazyInitializer", "handler" })
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class User implements UserDetails, TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Pattern(regexp = "^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*|\\d{11}@2025)$", message = "Password must be strong (upper, lower, digit, special) or match CPF@2025")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false)
    private String email;

    @NotBlank(message = "Full name is required")
    @Size(min = 3, max = 100, message = "Full name must be between 3 and 100 characters")
    @Column(nullable = false)
    private String name;

    @Pattern(regexp = "^\\d{9,20}$", message = "O nÃºmero do WhatsApp deve conter apenas dÃ­gitos e ter entre 9 e 20 caracteres")
    @Column(nullable = true, length = 20)
    private String whatsapp;

    // Consentimento WhatsApp (LGPD + Meta Policy Compliance)
    @Column(name = "whatsapp_consent", nullable = false)
    @Builder.Default
    private Boolean whatsappConsent = false;

    @Column(name = "whatsapp_consent_date")
    private LocalDateTime whatsappConsentDate;

    @Column(name = "whatsapp_consent_ip", length = 45)
    private String whatsappConsentIp;

    @Column(name = "whatsapp_consent_user_agent", length = 500)
    private String whatsappConsentUserAgent;

    @ManyToMany(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @ManyToMany(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinTable(name = "user_permissions", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "permission_id"))
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    @NotNull(message = "User status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToMany(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinTable(name = "user_group_membership", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "group_id"))
    @JsonIgnore
    @Builder.Default
    private Set<UserGroupEntity> groups = new HashSet<>();

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonIgnore
    private Company company;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ===== CAMPOS DE SEGURANÃ‡A E LGPD =====

    @Column(name = "two_factor_enabled")
    @Builder.Default
    private Boolean twoFactorEnabled = false;

    @Column(name = "two_factor_whatsapp", length = 20)
    private String twoFactorWhatsapp;

    @Column(name = "require_password_change")
    @Builder.Default
    private Boolean requirePasswordChange = false;

    @Column(name = "last_password_change")
    private LocalDateTime lastPasswordChange;

    @Column(name = "first_access_completed")
    @Builder.Default
    private Boolean firstAccessCompleted = false;

    // ===== CAMPOS DE INFORMAÃ‡Ã•ES ADICIONAIS =====

    @Column(length = 500)
    private String avatar;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String position;

    @Column(name = "employee_code", length = 50)
    private String employeeCode;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String address;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (twoFactorEnabled == null) {
            twoFactorEnabled = false;
        }
        if (requirePasswordChange == null) {
            requirePasswordChange = false;
        }
        if (firstAccessCompleted == null) {
            firstAccessCompleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters e Setters explÃ­citos para resolver problemas de compilaÃ§Ã£o com
    // Lombok
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public Set<UserGroupEntity> getGroups() {
        return groups;
    }

    public void setGroups(Set<UserGroupEntity> groups) {
        this.groups = groups;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        // Adicionar todos os roles do usuÃ¡rio
        if (roles != null) {
            for (Role role : roles) {
                authorities.add(new SimpleGrantedAuthority(role.getName()));
                if (!role.getName().startsWith("ROLE_")) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                } else {
                    authorities.add(new SimpleGrantedAuthority(role.getName().substring(5)));
                }
                // Adicionar permissões do role
                if (role.getPermissions() != null) {
                    for (Permission permission : role.getPermissions()) {
                        authorities.add(new SimpleGrantedAuthority(permission.getName()));
                    }
                }
            }
        }
        // Adicionar permissÃµes individuais do usuÃ¡rio
        if (permissions != null) {
            for (Permission permission : permissions) {
                authorities.add(new SimpleGrantedAuthority(permission.getName()));
            }
        }
        // Adicionar permissÃµes dos grupos
        for (UserGroupEntity group : groups) {
            for (String permission : group.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(permission));
            }
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.BLOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isActive() {
        return active;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setAddress(String address) {
        this.address = address;
    }

}
