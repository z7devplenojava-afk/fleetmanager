package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementItemRepository extends JpaRepository<MeasurementItem, UUID> {

    // Buscar itens por boletim
    List<MeasurementItem> findByBulletinId(UUID bulletinId);

    // Buscar itens por centro de custo
    List<MeasurementItem> findByCostCenterId(String costCenterId);

    // Buscar itens por cÃ³digo
    List<MeasurementItem> findByCode(String code);

    // Buscar itens por descriÃ§Ã£o (contÃ©m)
    @Query("SELECT mi FROM MeasurementItem mi WHERE mi.description LIKE %:description%")
    List<MeasurementItem> findByDescriptionContaining(@Param("description") String description);

    // Deletar todos os itens de um boletim
    @Modifying
    @Transactional
    @Query("DELETE FROM MeasurementItem mi WHERE mi.bulletin.id = :bulletinId")
    void deleteByBulletinId(@Param("bulletinId") UUID bulletinId);
}
