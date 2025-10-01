package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.MedicalExamType;
import br.com.fleetmanager.model.enums.MedicalExamCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de tipos de exame médico
 */
@Repository
public interface MedicalExamTypeRepository extends JpaRepository<MedicalExamType, UUID> {

    /**
     * Busca tipos de exame por categoria
     */
    List<MedicalExamType> findByExamCategory(MedicalExamCategory examCategory);

    /**
     * Busca tipos de exame ativos
     */
    List<MedicalExamType> findByIsActiveTrue();

    /**
     * Busca tipos de exame por categoria e status ativo
     */
    List<MedicalExamType> findByExamCategoryAndIsActiveTrue(MedicalExamCategory examCategory);

    /**
     * Busca tipo de exame por nome
     */
    List<MedicalExamType> findByNameContainingIgnoreCase(String name);
}
