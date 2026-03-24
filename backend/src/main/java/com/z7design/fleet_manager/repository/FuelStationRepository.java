package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FuelStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FuelStationRepository extends JpaRepository<FuelStation, UUID> {
    
    // Buscar por nome (case insensitive)
    Optional<FuelStation> findByNameIgnoreCase(String name);
    
    // Buscar por CNPJ
    Optional<FuelStation> findByCnpj(String cnpj);
    
    // Buscar por cidade
    List<FuelStation> findByCityIgnoreCase(String city);
    
    // Buscar por estado
    List<FuelStation> findByStateIgnoreCase(String state);
    
    // Buscar por marca/bandeira
    List<FuelStation> findByBrandIgnoreCase(String brand);
    
    // Buscar por status
    List<FuelStation> findByStatus(FuelStation.FuelStationStatus status);
    
    // Buscar por cidade e estado
    List<FuelStation> findByCityIgnoreCaseAndStateIgnoreCase(String city, String state);
    
    // Buscar por nome contendo (case insensitive)
    List<FuelStation> findByNameContainingIgnoreCase(String name);
    
    // Buscar por endereÃ§o contendo (case insensitive)
    List<FuelStation> findByAddressContainingIgnoreCase(String address);
    
    // Buscar postos ativos
    List<FuelStation> findByStatusOrderByNameAsc(FuelStation.FuelStationStatus status);
    
    // Buscar por coordenadas aproximadas (dentro de um raio)
    @Query("SELECT f FROM FuelStation f WHERE " +
           "SQRT(POWER(f.latitude - :lat, 2) + POWER(f.longitude - :lng, 2)) <= :radius " +
           "AND f.status = 'ACTIVE' " +
           "ORDER BY SQRT(POWER(f.latitude - :lat, 2) + POWER(f.longitude - :lng, 2))")
    List<FuelStation> findNearbyStations(@Param("lat") Double latitude, 
                                        @Param("lng") Double longitude, 
                                        @Param("radius") Double radius);
    
    // Contar por status
    long countByStatus(FuelStation.FuelStationStatus status);
    
    // Verificar se existe por CNPJ
    boolean existsByCnpj(String cnpj);
    
    // Verificar se existe por nome
    boolean existsByNameIgnoreCase(String name);
}

