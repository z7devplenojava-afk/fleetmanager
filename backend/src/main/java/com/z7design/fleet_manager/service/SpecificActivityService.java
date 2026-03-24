package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateSpecificActivityRequest;
import com.z7design.fleet_manager.dto.SpecificActivityResponse;
import com.z7design.fleet_manager.model.SpecificActivity;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.SpecificActivityRepository;
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
public class SpecificActivityService {

    @Autowired
    private SpecificActivityRepository specificActivityRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private WorkPostRepository workPostRepository;

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getAllSpecificActivities() {
        return specificActivityRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<SpecificActivityResponse> getSpecificActivityById(UUID id) {
        return specificActivityRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByEmployee(UUID employeeId) {
        return specificActivityRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByLocation(UUID locationId) {
        return specificActivityRepository.findByLocationId(locationId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByDate(LocalDate date) {
        return specificActivityRepository.findByActivityDate(date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByStatus(SpecificActivity.ActivityStatus status) {
        return specificActivityRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByType(SpecificActivity.ActivityType type) {
        return specificActivityRepository.findByActivityType(type).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByDateRange(LocalDate startDate, LocalDate endDate) {
        return specificActivityRepository.findByDateRange(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByEmployeeAndDateRange(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return specificActivityRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByLocationAndDateRange(UUID locationId, LocalDate startDate, LocalDate endDate) {
        return specificActivityRepository.findByLocationAndDateRange(locationId, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getSpecificActivitiesByTypeAndDateRange(SpecificActivity.ActivityType type, LocalDate startDate, LocalDate endDate) {
        return specificActivityRepository.findByActivityTypeAndDateRange(type, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SpecificActivityResponse createSpecificActivity(CreateSpecificActivityRequest request) {
        // Validar se o funcionÃ¡rio existe
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        // Validar se o local existe (se fornecido)
        WorkPost location = null;
        if (request.getLocationId() != null) {
            location = workPostRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));
        }

        // Converter activityType string para enum
        SpecificActivity.ActivityType activityType = SpecificActivity.ActivityType.valueOf(request.getActivityType());

        // Criar a atividade
        SpecificActivity activity = SpecificActivity.builder()
                .employee(employee)
                .activityType(activityType)
                .activityDate(request.getActivityDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(location)
                .description(request.getDescription())
                .observations(request.getObservations())
                .status(SpecificActivity.ActivityStatus.SCHEDULED)
                .isCompleted(false)
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        return mapToResponse(specificActivityRepository.save(activity));
    }

    public SpecificActivityResponse updateSpecificActivity(UUID id, CreateSpecificActivityRequest request) {
        SpecificActivity existingActivity = specificActivityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atividade especÃ­fica nÃ£o encontrada"));

        // Atualizar campos permitidos
        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));
            existingActivity.setEmployee(employee);
        }

        if (request.getActivityType() != null) {
            SpecificActivity.ActivityType activityType = SpecificActivity.ActivityType.valueOf(request.getActivityType());
            existingActivity.setActivityType(activityType);
        }

        if (request.getActivityDate() != null) {
            existingActivity.setActivityDate(request.getActivityDate());
        }

        existingActivity.setStartTime(request.getStartTime());
        existingActivity.setEndTime(request.getEndTime());
        existingActivity.setDescription(request.getDescription());
        existingActivity.setObservations(request.getObservations());

        // Validar e atualizar local se fornecido
        if (request.getLocationId() != null) {
            WorkPost location = workPostRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));
            existingActivity.setLocation(location);
        } else {
            existingActivity.setLocation(null);
        }

        existingActivity.setUpdatedAt(java.time.LocalDateTime.now());

        return mapToResponse(specificActivityRepository.save(existingActivity));
    }

    public void deleteSpecificActivity(UUID id) {
        if (!specificActivityRepository.existsById(id)) {
            throw new RuntimeException("Atividade especÃ­fica nÃ£o encontrada");
        }
        specificActivityRepository.deleteById(id);
    }

    public SpecificActivityResponse updateStatus(UUID id, SpecificActivity.ActivityStatus status) {
        SpecificActivity activity = specificActivityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atividade especÃ­fica nÃ£o encontrada"));
        
        activity.setStatus(status);
        activity.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(specificActivityRepository.save(activity));
    }

    public SpecificActivityResponse startActivity(UUID id) {
        SpecificActivity activity = specificActivityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atividade especÃ­fica nÃ£o encontrada"));
        
        activity.setStatus(SpecificActivity.ActivityStatus.IN_PROGRESS);
        activity.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(specificActivityRepository.save(activity));
    }

    public SpecificActivityResponse completeActivity(UUID id, String observations) {
        SpecificActivity activity = specificActivityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atividade especÃ­fica nÃ£o encontrada"));
        
        activity.setStatus(SpecificActivity.ActivityStatus.COMPLETED);
        activity.setIsCompleted(true);
        activity.setCompletionDate(java.time.LocalDateTime.now());
        
        if (observations != null && !observations.trim().isEmpty()) {
            activity.setCompletionNotes(observations);
        }
        activity.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(specificActivityRepository.save(activity));
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getTodayActivities() {
        return specificActivityRepository.findByActivityDate(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getPendingActivities() {
        return specificActivityRepository.findByStatus(SpecificActivity.ActivityStatus.SCHEDULED).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getPendingActivitiesByDate(LocalDate date) {
        return specificActivityRepository.findPendingActivitiesByDate(date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getOverdueActivities() {
        return specificActivityRepository.findOverdueActivities(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecificActivityResponse> getInProgressActivities() {
        return specificActivityRepository.findByStatus(SpecificActivity.ActivityStatus.IN_PROGRESS).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private SpecificActivityResponse mapToResponse(SpecificActivity activity) {
        SpecificActivityResponse.SimpleEmployee employeeData = null;
        if (activity.getEmployee() != null) {
            employeeData = new SpecificActivityResponse.SimpleEmployee(
                    activity.getEmployee().getId(),
                    activity.getEmployee().getName()
            );
        }

        SpecificActivityResponse.SimpleWorkPost locationData = null;
        if (activity.getLocation() != null) {
            locationData = new SpecificActivityResponse.SimpleWorkPost(
                    activity.getLocation().getId(),
                    activity.getLocation().getName()
            );
        }

        SpecificActivityResponse.SimpleUser assignedByData = null;
        if (activity.getAssignedBy() != null) {
            assignedByData = new SpecificActivityResponse.SimpleUser(
                    activity.getAssignedBy().getId(),
                    activity.getAssignedBy().getName()
            );
        }

        SpecificActivityResponse.SimpleUser supervisedByData = null;
        if (activity.getSupervisedBy() != null) {
            supervisedByData = new SpecificActivityResponse.SimpleUser(
                    activity.getSupervisedBy().getId(),
                    activity.getSupervisedBy().getName()
            );
        }

        return SpecificActivityResponse.builder()
                .id(activity.getId())
                .employee(employeeData)
                .activityType(activity.getActivityType() != null ? activity.getActivityType().name() : null)
                .activityDate(activity.getActivityDate())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .location(locationData)
                .description(activity.getDescription())
                .observations(activity.getObservations())
                .status(activity.getStatus() != null ? activity.getStatus().name() : null)
                .isCompleted(activity.getIsCompleted())
                .completionNotes(activity.getCompletionNotes())
                .assignedBy(assignedByData)
                .supervisedBy(supervisedByData)
                .completionDate(activity.getCompletionDate())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }
}

