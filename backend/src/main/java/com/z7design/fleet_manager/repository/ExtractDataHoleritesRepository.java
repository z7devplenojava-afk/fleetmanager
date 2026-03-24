package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ExtractDataHolerites;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExtractDataHoleritesRepository extends JpaRepository<ExtractDataHolerites, UUID> {
    
    /**
     * Buscar por CPF
     */
    Optional<ExtractDataHolerites> findByCpf(String cpf);
    
    /**
     * Buscar por CPF e perÃ­odo
     */
    Optional<ExtractDataHolerites> findByCpfAndMesReferenciaAndAnoReferencia(String cpf, String mesReferencia, Integer anoReferencia);
    
    /**
     * Buscar por perÃ­odo
     */
    List<ExtractDataHolerites> findByMesReferenciaAndAnoReferencia(String mesReferencia, Integer anoReferencia);
    
    /**
     * Buscar por nome (parcial)
     */
    @Query("SELECT e FROM ExtractDataHolerites e WHERE LOWER(e.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    List<ExtractDataHolerites> findByNomeContainingIgnoreCase(@Param("nome") String nome);
    
    /**
     * Verificar se jÃ¡ existe registro para CPF e perÃ­odo
     */
    boolean existsByCpfAndMesReferenciaAndAnoReferencia(String cpf, String mesReferencia, Integer anoReferencia);
} 
