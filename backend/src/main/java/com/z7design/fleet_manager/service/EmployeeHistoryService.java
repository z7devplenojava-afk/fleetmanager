package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EmployeeHistoryDTO;
import com.z7design.fleet_manager.dto.EmployeeHistoryRequestDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.EmployeeHistory;
import com.z7design.fleet_manager.repository.EmployeeHistoryRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeHistoryService {

    private final EmployeeHistoryRepository employeeHistoryRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<EmployeeHistoryDTO> getByEmployee(UUID employeeId) {
        return employeeHistoryRepository.findByEmployeeIdOrderByEventDateDesc(employeeId)
                .stream()
                .map(EmployeeHistoryDTO::fromEntity)
                .toList();
    }

    public EmployeeHistoryDTO create(UUID employeeId, EmployeeHistoryRequestDTO request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("FuncionÃ¡rio nÃ£o encontrado"));

        EmployeeHistory history = EmployeeHistory.builder()
                .employee(employee)
                .eventType(request.getEventType())
                .eventDate(request.getEventDate())
                .description(request.getDescription())
                .relatedDocumentUrl(request.getRelatedDocumentUrl())
                .createdBy(request.getCreatedBy())
                .build();

        EmployeeHistory saved = employeeHistoryRepository.save(history);
        log.info("HistÃ³rico criado com sucesso. ID: {}", saved.getId());
        return EmployeeHistoryDTO.fromEntity(saved);
    }

    public EmployeeHistoryDTO update(UUID id, EmployeeHistoryRequestDTO request) {
        EmployeeHistory history = employeeHistoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HistÃ³rico nÃ£o encontrado"));

        if (request.getEventType() != null) history.setEventType(request.getEventType());
        if (request.getEventDate() != null) history.setEventDate(request.getEventDate());
        if (request.getDescription() != null) history.setDescription(request.getDescription());
        if (request.getRelatedDocumentUrl() != null) history.setRelatedDocumentUrl(request.getRelatedDocumentUrl());
        if (request.getCreatedBy() != null) history.setCreatedBy(request.getCreatedBy());

        EmployeeHistory saved = employeeHistoryRepository.save(history);
        log.info("HistÃ³rico atualizado com sucesso. ID: {}", saved.getId());
        return EmployeeHistoryDTO.fromEntity(saved);
    }

    public void delete(UUID id) {
        EmployeeHistory history = employeeHistoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HistÃ³rico nÃ£o encontrado"));
        employeeHistoryRepository.delete(history);
        log.info("HistÃ³rico excluÃ­do com sucesso. ID: {}", id);
    }
}
