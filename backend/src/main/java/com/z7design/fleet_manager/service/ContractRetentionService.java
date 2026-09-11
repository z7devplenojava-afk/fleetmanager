package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ContractRetentionDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class ContractRetentionService {

    private final ContractRetentionRepository retentionRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final MeasurementBulletinRepository bulletinRepository;
    private final UnitRepository unitRepository;

    @Transactional(readOnly = true)
    public List<ContractRetentionDTO> getAllRetentions() {
        log.info("Buscando todas as retenções contratuais");
        return retentionRepository.findAll().stream()
                .map(ContractRetentionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractRetentionDTO getRetentionById(UUID id) {
        log.info("Buscando retenção contratual por ID: {}", id);
        ContractRetention retention = retentionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retenção contratual não encontrada: " + id));
        return ContractRetentionDTO.fromEntity(retention);
    }

    @Transactional
    public ContractRetentionDTO createRetention(ContractRetentionDTO dto) {
        log.info("Criando nova retenção contratual");

        ContractRetention retention = new ContractRetention();
        updateEntityFromDto(retention, dto);

        retention.calculateValues();
        retention = retentionRepository.save(retention);
        log.info("Retenção contratual criada com sucesso - ID: {}", retention.getId());

        return ContractRetentionDTO.fromEntity(retention);
    }

    @Transactional
    public ContractRetentionDTO updateRetention(UUID id, ContractRetentionDTO dto) {
        log.info("Atualizando retenção contratual: {}", id);

        ContractRetention retention = retentionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retenção contratual não encontrada: " + id));

        updateEntityFromDto(retention, dto);
        retention.calculateValues();
        retention = retentionRepository.save(retention);

        log.info("Retenção contratual atualizada com sucesso - ID: {}", retention.getId());
        return ContractRetentionDTO.fromEntity(retention);
    }

    @Transactional
    public ContractRetentionDTO updateStatus(UUID id, RetentionStatus status, LocalDate actualReleaseDate) {
        log.info("Atualizando status da retenção contratual {}: {}", id, status);

        ContractRetention retention = retentionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retenção contratual não encontrada: " + id));

        retention.setStatus(status);
        if (status == RetentionStatus.LIBERADO && actualReleaseDate != null) {
            retention.setActualReleaseDate(actualReleaseDate);
        } else if (status == RetentionStatus.LIBERADO && retention.getActualReleaseDate() == null) {
            retention.setActualReleaseDate(LocalDate.now());
        }

        retention = retentionRepository.save(retention);
        return ContractRetentionDTO.fromEntity(retention);
    }

    @Transactional
    public void deleteRetention(UUID id) {
        log.info("Deletando retenção contratual: {}", id);
        if (!retentionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Retenção contratual não encontrada: " + id);
        }
        retentionRepository.deleteById(id);
    }

    private void updateEntityFromDto(ContractRetention retention, ContractRetentionDTO dto) {
        if (dto.getReferenceMonth() != null) {
            retention.setReferenceMonth(dto.getReferenceMonth());
        }
        if (dto.getMeasuredValue() != null) {
            retention.setMeasuredValue(dto.getMeasuredValue());
        }
        if (dto.getRmuDiscount() != null) {
            retention.setRmuDiscount(dto.getRmuDiscount());
        }
        if (dto.getRetentionRate() != null) {
            retention.setRetentionRate(dto.getRetentionRate());
        }
        if (dto.getStatus() != null) {
            retention.setStatus(dto.getStatus());
        }
        if (dto.getExpectedReleaseDate() != null) {
            retention.setExpectedReleaseDate(dto.getExpectedReleaseDate());
        }
        if (dto.getActualReleaseDate() != null) {
            retention.setActualReleaseDate(dto.getActualReleaseDate());
        }
        if (dto.getNotes() != null) {
            retention.setNotes(dto.getNotes());
        }

        // Medição associada
        if (dto.getMeasurementId() != null) {
            MeasurementBulletin bulletin = bulletinRepository.findById(dto.getMeasurementId()).orElse(null);
            if (bulletin != null) {
                retention.setMeasurement(bulletin);
                if (retention.getClient() == null && bulletin.getClient() != null) {
                    retention.setClient(bulletin.getClient());
                }
                if (retention.getContract() == null && bulletin.getContract() != null) {
                    retention.setContract(bulletin.getContract());
                }
                if (retention.getUnit() == null && bulletin.getUnit() != null) {
                    retention.setUnit(bulletin.getUnit());
                }
                if (retention.getMeasuredValue() == null || retention.getMeasuredValue().compareTo(BigDecimal.ZERO) == 0) {
                    retention.setMeasuredValue(bulletin.getSubtotal());
                }
            }
        }

        // Cliente
        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(retention::setClient);
        }

        // Contrato
        if (dto.getContractId() != null) {
            contractRepository.findById(dto.getContractId()).ifPresent(retention::setContract);
        }

        // Unidade
        if (dto.getUnitId() != null) {
            unitRepository.findById(dto.getUnitId()).ifPresent(retention::setUnit);
        }
    }
}
