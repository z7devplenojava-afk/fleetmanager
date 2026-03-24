package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateWorkPostAssignmentRequest;
import com.z7design.fleet_manager.dto.WorkPostAssignmentResponse;
import com.z7design.fleet_manager.model.WorkPostAssignment;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.WorkPostAssignmentRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class WorkPostAssignmentService {

    @Autowired
    private WorkPostAssignmentRepository workPostAssignmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private WorkPostRepository workPostRepository;

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getAllWorkPostAssignments() {
        return workPostAssignmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<WorkPostAssignmentResponse> getWorkPostAssignmentById(UUID id) {
        return workPostAssignmentRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByEmployee(UUID employeeId) {
        return workPostAssignmentRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByWorkPost(UUID workPostId) {
        return workPostAssignmentRepository.findByWorkPostId(workPostId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByDate(LocalDate date) {
        return workPostAssignmentRepository.findByAssignmentDate(date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByStatus(WorkPostAssignment.AssignmentStatus status) {
        return workPostAssignmentRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByDateRange(LocalDate startDate, LocalDate endDate) {
        return workPostAssignmentRepository.findByDateRange(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByEmployeeAndDateRange(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return workPostAssignmentRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getWorkPostAssignmentsByWorkPostAndDateRange(UUID workPostId, LocalDate startDate, LocalDate endDate) {
        return workPostAssignmentRepository.findByWorkPostAndDateRange(workPostId, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WorkPostAssignmentResponse createWorkPostAssignment(CreateWorkPostAssignmentRequest request) {
        // Validar se o funcionÃ¡rio existe
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        // Validar se o posto de trabalho existe
        WorkPost workPost = workPostRepository.findById(request.getWorkPostId())
                .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));

        // Verificar conflitos de horÃ¡rio para o mesmo funcionÃ¡rio na mesma data
        List<WorkPostAssignment> existingAssignments = workPostAssignmentRepository
                .findActiveAssignmentsByDateAndEmployee(request.getAssignmentDate(), employee.getId());
        
        if (!existingAssignments.isEmpty()) {
            throw new RuntimeException("FuncionÃ¡rio jÃ¡ possui atribuiÃ§Ã£o ativa nesta data");
        }

        // Verificar conflitos de horÃ¡rio para o mesmo posto na mesma data
        List<WorkPostAssignment> existingPostAssignments = workPostAssignmentRepository
                .findActiveAssignmentsByDateAndPost(request.getAssignmentDate(), workPost.getId());
        
        if (!existingPostAssignments.isEmpty()) {
            throw new RuntimeException("Posto de trabalho jÃ¡ possui atribuiÃ§Ã£o ativa nesta data");
        }

        // Converter ShiftType string para enum
        WorkPostAssignment.ShiftType shiftType = WorkPostAssignment.ShiftType.valueOf(request.getShiftType());

        // Criar a atribuiÃ§Ã£o
        WorkPostAssignment assignment = WorkPostAssignment.builder()
                .employee(employee)
                .workPost(workPost)
                .assignmentDate(request.getAssignmentDate())
                .shiftType(shiftType)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(WorkPostAssignment.AssignmentStatus.PENDING)
                .isPrimaryAssignment(request.getIsPrimaryAssignment() != null ? request.getIsPrimaryAssignment() : true)
                .isBackupAssignment(request.getIsBackupAssignment() != null ? request.getIsBackupAssignment() : false)
                .observations(request.getObservations())
                .specialInstructions(request.getSpecialInstructions())
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        return mapToResponse(workPostAssignmentRepository.save(assignment));
    }

    public WorkPostAssignmentResponse updateWorkPostAssignment(UUID id, CreateWorkPostAssignmentRequest request) {
        WorkPostAssignment existingAssignment = workPostAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AtribuiÃ§Ã£o de posto nÃ£o encontrada"));

        // Atualizar campos permitidos
        if (request.getAssignmentDate() != null) {
            existingAssignment.setAssignmentDate(request.getAssignmentDate());
        }
        
        if (request.getShiftType() != null) {
            WorkPostAssignment.ShiftType shiftType = WorkPostAssignment.ShiftType.valueOf(request.getShiftType());
            existingAssignment.setShiftType(shiftType);
        }
        
        existingAssignment.setStartTime(request.getStartTime());
        existingAssignment.setEndTime(request.getEndTime());
        existingAssignment.setObservations(request.getObservations());
        existingAssignment.setSpecialInstructions(request.getSpecialInstructions());
        
        if (request.getIsPrimaryAssignment() != null) {
            existingAssignment.setIsPrimaryAssignment(request.getIsPrimaryAssignment());
        }
        
        if (request.getIsBackupAssignment() != null) {
            existingAssignment.setIsBackupAssignment(request.getIsBackupAssignment());
        }
        
        existingAssignment.setUpdatedAt(java.time.LocalDateTime.now());

        // Validar e atualizar funcionÃ¡rio se fornecido
        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));
            existingAssignment.setEmployee(employee);
        }

        // Validar e atualizar posto de trabalho se fornecido
        if (request.getWorkPostId() != null) {
            WorkPost workPost = workPostRepository.findById(request.getWorkPostId())
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));
            existingAssignment.setWorkPost(workPost);
        }

        return mapToResponse(workPostAssignmentRepository.save(existingAssignment));
    }

    public void deleteWorkPostAssignment(UUID id) {
        if (!workPostAssignmentRepository.existsById(id)) {
            throw new RuntimeException("AtribuiÃ§Ã£o de posto nÃ£o encontrada");
        }
        workPostAssignmentRepository.deleteById(id);
    }

    public WorkPostAssignmentResponse updateStatus(UUID id, WorkPostAssignment.AssignmentStatus status) {
        WorkPostAssignment assignment = workPostAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AtribuiÃ§Ã£o de posto nÃ£o encontrada"));
        
        assignment.setStatus(status);
        assignment.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(workPostAssignmentRepository.save(assignment));
    }

    public WorkPostAssignmentResponse confirmAssignment(UUID id) {
        WorkPostAssignment assignment = workPostAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AtribuiÃ§Ã£o de posto nÃ£o encontrada"));
        
        assignment.setStatus(WorkPostAssignment.AssignmentStatus.CONFIRMED);
        assignment.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(workPostAssignmentRepository.save(assignment));
    }

    public WorkPostAssignmentResponse completeAssignment(UUID id) {
        WorkPostAssignment assignment = workPostAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AtribuiÃ§Ã£o de posto nÃ£o encontrada"));
        
        assignment.setStatus(WorkPostAssignment.AssignmentStatus.COMPLETED);
        assignment.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(workPostAssignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getTodayAssignments() {
        return workPostAssignmentRepository.findByAssignmentDate(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getPendingAssignments() {
        return workPostAssignmentRepository.findByStatus(WorkPostAssignment.AssignmentStatus.PENDING).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkPostAssignmentResponse> getActiveAssignments() {
        return workPostAssignmentRepository.findByStatus(WorkPostAssignment.AssignmentStatus.CONFIRMED).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private WorkPostAssignmentResponse mapToResponse(WorkPostAssignment assignment) {
        WorkPostAssignmentResponse.SimpleEmployee employeeData = null;
        if (assignment.getEmployee() != null) {
            employeeData = new WorkPostAssignmentResponse.SimpleEmployee(
                    assignment.getEmployee().getId(),
                    assignment.getEmployee().getName()
            );
        }

        WorkPostAssignmentResponse.SimpleWorkPost workPostData = null;
        if (assignment.getWorkPost() != null) {
            workPostData = new WorkPostAssignmentResponse.SimpleWorkPost(
                    assignment.getWorkPost().getId(),
                    assignment.getWorkPost().getName()
            );
        }

        String shift = assignment.getShiftType() != null ? assignment.getShiftType().name() : null;

        String status = null;
        if (assignment.getStatus() != null) {
            switch (assignment.getStatus()) {
                case PENDING -> status = "SCHEDULED";
                case ACTIVE, CONFIRMED -> status = "CONFIRMED";
                case COMPLETED -> status = "COMPLETED";
                case CANCELLED -> status = "CANCELLED";
                case MODIFIED -> status = "MODIFIED";
                default -> status = assignment.getStatus().name();
            }
        }

        return WorkPostAssignmentResponse.builder()
                .id(assignment.getId())
                .employee(employeeData)
                .workPost(workPostData)
                .assignmentDate(assignment.getAssignmentDate())
                .shift(shift)
                .startTime(assignment.getStartTime())
                .endTime(assignment.getEndTime())
                .status(status)
                .primaryAssignment(assignment.getIsPrimaryAssignment())
                .backupAssignment(assignment.getIsBackupAssignment())
                .observations(assignment.getObservations())
                .specialInstructions(assignment.getSpecialInstructions())
                .assignedById(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getId() : null)
                .assignmentDateTime(assignment.getAssignmentDateTime())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }
}

