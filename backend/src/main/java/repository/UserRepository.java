package br.com.fleetmanager.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    /**
     * Busca usuários ativos
     */
    List<User> findByActiveTrue();
    
    /**
     * Busca usuários com permissões financeiras
     */
    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.roles r " +
           "WHERE u.active = true AND " +
           "(r.name IN ('SUPER_ADMIN', 'ADMIN', 'FINANCEIRO') OR " +
           "EXISTS (SELECT p FROM u.permissions p WHERE p.name IN ('FINANCIAL_READ', 'FINANCIAL_WRITE', 'FINANCIAL_CREATE')))")
    List<User> findUsersWithFinancialPermissions();
    
    /**
     * Busca usuários que são supervisores
     */
    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.roles r " +
           "WHERE u.active = true AND r.name = 'SUPERVISOR'")
    List<User> findSupervisors();
} 