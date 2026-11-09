package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleRentalExpenseDTO;
import com.z7design.fleet_manager.model.VehicleRentalExpense;
import com.z7design.fleet_manager.repository.VehicleRentalExpenseRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleRentalExpenseService {

    private final VehicleRentalExpenseRepository repository;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureTableAndSyncAllocation() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS vehicle_rental_expenses (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
                    client_name VARCHAR(255),
                    work_post_id UUID REFERENCES work_posts(id) ON DELETE SET NULL,
                    work_post_name VARCHAR(255),
                    contract_number VARCHAR(100),
                    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    category VARCHAR(80) NOT NULL DEFAULT 'MANUTENCAO',
                    description VARCHAR(500) NOT NULL,
                    document_number VARCHAR(100),
                    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
                    responsibility VARCHAR(50) NOT NULL DEFAULT 'CLIENTE',
                    reimbursement_status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
                    notes TEXT,
                    company_id UUID,
                    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """);

            jdbcTemplate.execute("""
                UPDATE vehicles v
                SET
                    client_id = COALESCE(v.client_id, sub.client_id),
                    client_name = COALESCE(NULLIF(v.client_name, ''), sub.client_name),
                    contract_id = COALESCE(v.contract_id, sub.contract_id),
                    allocation_contract_number = COALESCE(NULLIF(v.allocation_contract_number, ''), sub.contract_number),
                    allocation_start_date = COALESCE(v.allocation_start_date, sub.period_start),
                    allocation_end_date = COALESCE(v.allocation_end_date, sub.period_end)
                FROM (
                    SELECT DISTINCT ON (UPPER(TRIM(riv.plate)))
                        UPPER(TRIM(riv.plate)) AS plate_key,
                        riv.vehicle_id,
                        ri.client_id,
                        ri.client_name,
                        ri.contract_id,
                        ri.contract_number,
                        ri.period_start,
                        ri.period_end
                    FROM rental_invoice_vehicles riv
                    JOIN rental_invoices ri ON ri.id = riv.rental_invoice_id
                    ORDER BY UPPER(TRIM(riv.plate)), ri.issue_date DESC, ri.created_at DESC
                ) sub
                WHERE UPPER(TRIM(v.plate)) = sub.plate_key
                   OR (sub.vehicle_id IS NOT NULL AND v.id = sub.vehicle_id)
            """);

            jdbcTemplate.execute("""
                UPDATE vehicles v
                SET
                    work_post_id = wp_sub.wp_id,
                    location = COALESCE(NULLIF(v.location, ''), wp_sub.wp_name)
                FROM (
                    SELECT DISTINCT ON (wp.client_id)
                        wp.client_id,
                        wp.id AS wp_id,
                        wp.name AS wp_name
                    FROM work_posts wp
                    WHERE wp.client_id IS NOT NULL
                    ORDER BY wp.client_id, wp.created_at DESC
                ) wp_sub
                WHERE v.client_id = wp_sub.client_id
                  AND v.work_post_id IS NULL
            """);
        } catch (Exception e) {
            log.warn("Aviso ao verificar tabela vehicle_rental_expenses / sincronizar alocação: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<VehicleRentalExpenseDTO> listByVehicle(UUID vehicleId) {
        return repository.findByVehicleIdOrderByExpenseDateDescCreatedAtDesc(vehicleId)
                .stream()
                .map(VehicleRentalExpenseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public VehicleRentalExpenseDTO create(UUID vehicleId, VehicleRentalExpenseDTO dto) {
        VehicleRentalExpense entity = VehicleRentalExpense.builder()
                .vehicleId(vehicleId)
                .clientId(dto.getClientId())
                .clientName(dto.getClientName())
                .workPostId(dto.getWorkPostId())
                .workPostName(dto.getWorkPostName())
                .contractNumber(dto.getContractNumber())
                .expenseDate(dto.getExpenseDate() != null ? dto.getExpenseDate() : LocalDate.now())
                .category(dto.getCategory() != null && !dto.getCategory().isBlank() ? dto.getCategory() : "MANUTENCAO")
                .description(dto.getDescription() != null && !dto.getDescription().isBlank() ? dto.getDescription() : "Despesa de Locação")
                .documentNumber(dto.getDocumentNumber())
                .amount(dto.getAmount() != null ? dto.getAmount() : BigDecimal.ZERO)
                .responsibility(dto.getResponsibility() != null && !dto.getResponsibility().isBlank() ? dto.getResponsibility() : "CLIENTE")
                .reimbursementStatus(dto.getReimbursementStatus() != null && !dto.getReimbursementStatus().isBlank() ? dto.getReimbursementStatus() : "PENDENTE")
                .notes(dto.getNotes())
                .companyId(TenantContext.get())
                .build();
        return VehicleRentalExpenseDTO.fromEntity(repository.save(entity));
    }

    @Transactional
    public VehicleRentalExpenseDTO update(UUID expenseId, VehicleRentalExpenseDTO dto) {
        VehicleRentalExpense entity = repository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Despesa de locação não encontrada: " + expenseId));

        if (dto.getClientId() != null) entity.setClientId(dto.getClientId());
        if (dto.getClientName() != null) entity.setClientName(dto.getClientName());
        if (dto.getWorkPostId() != null) entity.setWorkPostId(dto.getWorkPostId());
        if (dto.getWorkPostName() != null) entity.setWorkPostName(dto.getWorkPostName());
        if (dto.getContractNumber() != null) entity.setContractNumber(dto.getContractNumber());
        if (dto.getExpenseDate() != null) entity.setExpenseDate(dto.getExpenseDate());
        if (dto.getCategory() != null && !dto.getCategory().isBlank()) entity.setCategory(dto.getCategory());
        if (dto.getDescription() != null && !dto.getDescription().isBlank()) entity.setDescription(dto.getDescription());
        entity.setDocumentNumber(dto.getDocumentNumber());
        if (dto.getAmount() != null) entity.setAmount(dto.getAmount());
        if (dto.getResponsibility() != null && !dto.getResponsibility().isBlank()) entity.setResponsibility(dto.getResponsibility());
        if (dto.getReimbursementStatus() != null && !dto.getReimbursementStatus().isBlank()) entity.setReimbursementStatus(dto.getReimbursementStatus());
        entity.setNotes(dto.getNotes());

        return VehicleRentalExpenseDTO.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(UUID expenseId) {
        repository.deleteById(expenseId);
    }
}
