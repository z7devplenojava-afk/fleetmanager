package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.SSTTraining;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de treinamentos SST
 */
@Repository
public interface SSTTrainingRepository extends JpaRepository<SSTTraining, UUID> {

    /**
     * Busca treinamentos por tipo
     */
    List<SSTTraining> findByTrainingType(String trainingType);

    /**
     * Busca treinamentos ativos
     */
    List<SSTTraining> findByIsActiveTrue();

    /**
     * Busca treinamentos por tipo e status ativo
     */
    List<SSTTraining> findByTrainingTypeAndIsActiveTrue(String trainingType);

    /**
     * Busca treinamentos por nome
     */
    List<SSTTraining> findByNameContainingIgnoreCase(String name);

    /**
     * Busca treinamentos obrigatórios
     */
    List<SSTTraining> findByIsMandatoryTrue();

    /**
     * Busca treinamentos por fornecedor
     */
    List<SSTTraining> findByProviderContainingIgnoreCase(String provider);
}
