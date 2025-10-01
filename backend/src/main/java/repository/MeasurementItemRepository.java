package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.MeasurementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementItemRepository extends JpaRepository<MeasurementItem, UUID> {

    // Buscar itens por boletim
    List<MeasurementItem> findByBulletinId(UUID bulletinId);

    // Buscar itens por centro de custo
    List<MeasurementItem> findByCostCenterId(String costCenterId);

    // Buscar itens por código
    List<MeasurementItem> findByCode(String code);

    // Buscar itens por descrição (contém)
    @Query("SELECT mi FROM MeasurementItem mi WHERE mi.description LIKE %:description%")
    List<MeasurementItem> findByDescriptionContaining(@Param("description") String description);

    // Deletar todos os itens de um boletim
    void deleteByBulletinId(UUID bulletinId);
}