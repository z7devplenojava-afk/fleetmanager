package br.com.fleetmanager.service;

import br.com.fleetmanager.model.FinancialTransaction;
import br.com.fleetmanager.repository.FinancialTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialTransactionService {
    private final FinancialTransactionRepository repository;

    public List<FinancialTransaction> findAll() {
        return repository.findAllWithSupplier();
    }

    public Optional<FinancialTransaction> findById(UUID id) {
        FinancialTransaction entity = repository.findByIdWithUnit(id);
        return Optional.ofNullable(entity);
    }

    public FinancialTransaction save(FinancialTransaction transaction) {
        // Validar se a unidade existe
        if (transaction.getUnit() == null || transaction.getUnit().getId() == null) {
            throw new IllegalArgumentException("Unidade é obrigatória para transações financeiras");
        }
        // Valor padrão para status
        if (transaction.getStatus() == null || transaction.getStatus().isBlank()) {
            transaction.setStatus("PENDING");
        }
        return repository.save(transaction);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    public List<FinancialTransaction> findByType(String type) {
        return repository.findAll().stream().filter(t -> t.getType().equalsIgnoreCase(type)).toList();
    }

    public List<FinancialTransaction> findByStatus(String status) {
        return repository.findAll().stream().filter(t -> t.getStatus().equalsIgnoreCase(status)).toList();
    }

    public List<FinancialTransaction> findByCategory(String category) {
        return repository.findAll().stream().filter(t -> t.getCategory().equalsIgnoreCase(category)).toList();
    }

    public List<FinancialTransaction> findByDate(java.time.LocalDate date) {
        return repository.findAll().stream().filter(t -> t.getDate().equals(date)).toList();
    }

    // Novos métodos para busca por unidade
    public List<FinancialTransaction> findByUnitId(UUID unitId) {
        return repository.findByUnitIdWithSupplier(unitId);
    }
    
    public List<FinancialTransaction> findByUnitIdAndType(UUID unitId, String type) {
        return repository.findByUnitIdAndType(unitId, type);
    }
    
    public List<FinancialTransaction> findByUnitIdAndStatus(UUID unitId, String status) {
        return repository.findByUnitIdAndStatus(unitId, status);
    }
    
    public List<FinancialTransaction> findByUnitIdAndCategory(UUID unitId, String category) {
        return repository.findByUnitIdAndCategory(unitId, category);
    }
    
    public List<FinancialTransaction> findByUnitIdAndDate(UUID unitId, java.time.LocalDate date) {
        return repository.findByUnitIdAndDate(unitId, date);
    }
    
    public List<FinancialTransaction> findByUnitIdAndDateBetween(UUID unitId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return repository.findByUnitIdAndDateBetween(unitId, startDate, endDate);
    }
    
    public List<FinancialTransaction> findByUnitIds(List<UUID> unitIds) {
        return repository.findByUnitIdIn(unitIds);
    }
    
    public List<FinancialTransaction> findByUnitIdsAndType(List<UUID> unitIds, String type) {
        return repository.findByUnitIdInAndType(unitIds, type);
    }
    
    public List<FinancialTransaction> findByUnitIdsAndDateBetween(List<UUID> unitIds, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return repository.findByUnitIdInAndDateBetween(unitIds, startDate, endDate);
    }
    
    // Métodos para cálculos por unidade
    public Double sumAmountByUnitAndType(UUID unitId, String type) {
        return repository.sumAmountByUnitAndType(unitId, type);
    }
    
    public Double sumAmountByUnitAndPeriod(UUID unitId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return repository.sumAmountByUnitAndPeriod(unitId, startDate, endDate);
    }
    
    public Double sumAmountByUnitsAndPeriod(List<UUID> unitIds, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return repository.sumAmountByUnitsAndPeriod(unitIds, startDate, endDate);
    }
} 