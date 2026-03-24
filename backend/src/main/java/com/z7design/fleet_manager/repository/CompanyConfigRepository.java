package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CompanyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyConfigRepository extends JpaRepository<CompanyConfig, UUID> {

    /**
     * Busca a configuraÃ§Ã£o ativa da empresa
     */
    @Query("SELECT cc FROM CompanyConfig cc WHERE cc.active = true ORDER BY cc.createdAt DESC")
    Optional<CompanyConfig> findActiveConfig();

    /**
     * Verifica se existe uma configuraÃ§Ã£o ativa
     */
    @Query("SELECT COUNT(cc) > 0 FROM CompanyConfig cc WHERE cc.active = true")
    boolean existsActiveConfig();

    /**
     * Busca por CNPJ
     */
    Optional<CompanyConfig> findByCnpjAndActiveTrue(String cnpj);

    /**
     * Verifica se CNPJ jÃ¡ existe para outra empresa
     */
    @Query("SELECT COUNT(cc) > 0 FROM CompanyConfig cc WHERE cc.cnpj = :cnpj AND cc.id != :id AND cc.active = true")
    boolean existsByCnpjAndIdNotAndActiveTrue(String cnpj, UUID id);
}

