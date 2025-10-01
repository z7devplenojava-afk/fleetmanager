package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    
    Optional<Role> findByName(String name);
    
    boolean existsByName(String name);
    
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.name = :permissionName")
    List<Role> findByPermissionName(@Param("permissionName") String permissionName);
    
    @Query("SELECT r FROM Role r WHERE r.name IN :roleNames")
    List<Role> findByNames(@Param("roleNames") List<String> roleNames);
    
    @Query("SELECT r FROM Role r ORDER BY r.name")
    List<Role> findAllOrderByName();
} 