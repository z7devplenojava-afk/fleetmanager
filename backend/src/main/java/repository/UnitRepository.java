package br.com.fleetmanager.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.Unit;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {
    
    Optional<Unit> findByName(String name);
    
    Optional<Unit> findByEmail(String email);
    
    List<Unit> findByAddressContaining(String address);
    
    List<Unit> findByParentId(UUID parentId);
    
    List<Unit> findByNameContainingIgnoreCase(String name);
    
    List<Unit> findByEmailContainingIgnoreCase(String email);
    
    List<Unit> findByPhoneContaining(String phone);
    
    List<Unit> findByParentIsNull();
    
    boolean existsByName(String name);
    
    boolean existsByEmail(String email);
    
    // Buscar unidades ativas
    List<Unit> findByActiveTrue();
    
    // Buscar por código
    Optional<Unit> findByCode(String code);
    
    // Buscar por código e ativa
    Optional<Unit> findByCodeAndActiveTrue(String code);
    
    // Buscar unidades ativas por nome contendo
    List<Unit> findByActiveTrueAndNameContainingIgnoreCase(String name);
    
    // Buscar unidades raiz ativas
    List<Unit> findByParentIsNullAndActiveTrue();
    
    // Contar unidades ativas
    @Query("SELECT COUNT(u) FROM Unit u WHERE u.active = true")
    long countActiveUnits();
    
    // Buscar unidades por cliente
    List<Unit> findByClientId(UUID clientId);
    
    // Buscar unidades ativas por cliente
    List<Unit> findByClientIdAndActiveTrue(UUID clientId);
    
    // Método personalizado para buscar unidades sem carregar relações problemáticas
    @Query("SELECT u FROM Unit u WHERE u.id IS NOT NULL")
    List<Unit> findAllUnitsOnly();
    
    // Query nativa para buscar apenas campos básicos das unidades
    @Query(value = "SELECT u.id, u.name, u.description, u.address, u.phone, u.email, u.code, u.manager, u.active, u.created_at, u.updated_at FROM units u", nativeQuery = true)
    List<Object[]> findAllUnitsNative();
} 