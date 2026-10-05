package com.z7design.fleet_manager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.FeriasColetivas;

@Repository
public interface FeriasColetivasRepository extends JpaRepository<FeriasColetivas, UUID> {

    List<FeriasColetivas> findByDataInicioBetween(LocalDate inicio, LocalDate fim);

    List<FeriasColetivas> findByStatusOrderByDataInicioDesc(String status);

    @Query("SELECT f FROM FeriasColetivas f WHERE f.dataFim >= :data ORDER BY f.dataInicio ASC")
    List<FeriasColetivas> findAtivasByData(@Param("data") LocalDate data);

    boolean existsByDataInicioAndDataFim(LocalDate dataInicio, LocalDate dataFim);

    /** Fase 2: coletivas pendentes de processamento (validacao de elegibilidade). */
    boolean existsByStatusIn(List<String> statuses);
}
