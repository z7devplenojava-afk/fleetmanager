package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

       /**
        * Busca empresa por sigla
        */
       Optional<Company> findBySigla(String sigla);

       Optional<Company> findFirstBySiglaIgnoreCase(String sigla);

       /**
        * Verifica se existe empresa com a sigla
        */
       boolean existsBySigla(String sigla);

       /**
        * Busca empresa por CNPJ
        */
       Optional<Company> findByCnpj(String cnpj);

       /**
        * Busca empresa por CNPJ normalizado (apenas digitos)
        */
       @Query("SELECT c FROM Company c " +
                     "WHERE REPLACE(REPLACE(REPLACE(c.cnpj, '.', ''), '-', ''), '/', '') = :cnpj")
       List<Company> findByNormalizedCnpj(@Param("cnpj") String cnpj);

       @Query("SELECT c FROM Company c " +
                     "WHERE LOWER(REPLACE(REPLACE(REPLACE(c.name, ' ', ''), '.', ''), '-', '')) = " +
                     "LOWER(REPLACE(REPLACE(REPLACE(:normalizedName, ' ', ''), '.', ''), '-', ''))")
       Optional<Company> findByNormalizedName(@Param("normalizedName") String normalizedName);

       /**
        * Verifica se existe empresa com o CNPJ
        */
       boolean existsByCnpj(String cnpj);

       /**
        * Busca empresas por status
        */
       List<Company> findByStatus(CompanyStatus status);

       /**
        * Busca empresas ativas
        */
       List<Company> findByStatusOrderByNameAsc(CompanyStatus status);

       /**
        * Busca empresas por nome
        */
       @Query("SELECT c FROM Company c " +
                     "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     "ORDER BY c.name ASC")
       List<Company> searchCompanies(@Param("query") String query);

       /**
        * Busca empresas por sigla
        */
       @Query("SELECT c FROM Company c " +
                     "WHERE LOWER(c.sigla) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     "ORDER BY c.sigla ASC")
       List<Company> searchCompaniesBySigla(@Param("query") String query);

       /**
        * Busca todas as empresas ordenadas por nome
        */
       List<Company> findAllByOrderByNameAsc();

       /**
        * Busca empresa por ID com EPIs padrao carregados
        */
       @Query("SELECT DISTINCT c FROM Company c LEFT JOIN FETCH c.defaultEpis WHERE c.id = :id")
       Optional<Company> findByIdWithDefaultEpis(@Param("id") UUID id);

       /**
        * Busca todas as empresas com EPIs padrao carregados
        */
       @Query("SELECT DISTINCT c FROM Company c LEFT JOIN FETCH c.defaultEpis ORDER BY c.name ASC")
       List<Company> findAllWithDefaultEpis();

       /**
        * SECURITY: Busca empresas por IDs e status (para validacao de acesso)
        */
       List<Company> findByIdInAndStatus(Set<UUID> ids, CompanyStatus status);
}
