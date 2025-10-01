package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Remanejamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RemanejamentoRepository extends JpaRepository<Remanejamento, UUID> {
    List<Remanejamento> findByEmployeeId(UUID employeeId);
} 