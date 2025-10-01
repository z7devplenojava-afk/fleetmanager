package br.com.fleetmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import br.com.fleetmanager.model.enums.UserGroup;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@JsonIgnoreProperties({"users"})
@Table(name = "user_groups")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString(exclude = {"users"})
@EqualsAndHashCode(of = {"id"})
public class UserGroupEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "group_name", nullable = false, unique = true)
    private UserGroup groupName;
    
    @Column(name = "display_name", nullable = false)
    private String displayName;
    
    @Column(name = "description")
    private String description;
    
    @ManyToMany(mappedBy = "groups")
    @JsonIgnore
    private Set<User> users = new HashSet<>();
    
    @ElementCollection(targetClass = String.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_group_permissions", 
                     joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "permission")
    private Set<String> permissions = new HashSet<>();
} 