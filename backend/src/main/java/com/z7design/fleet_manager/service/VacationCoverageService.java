package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateVacationCoverageRequest;
import com.z7design.fleet_manager.dto.VacationCoverageResponse;
import com.z7design.fleet_manager.model.VacationCoverage;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.repository.VacationCoverageRepository;
import com.z7design.fleet_manager.repository.VacationRepository;
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
public class VacationCoverageService {

    @Autowired
    private VacationCoverageRepository vacationCoverageRepository;

    @Autowired
    private VacationRepository vacationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private WorkPostRepository workPostRepository;

    @Transactional(readOnly = true)
    public List<VacationCoverageResponse> getAllVacationCoverages() {
        return vacationCoverageRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<VacationCoverageResponse> getVacationCoverageById(UUID id) {
        return vacationCoverageRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<VacationCoverageResponse> getVacationCoveragesByEmployee(UUID employeeId) {
        return vacationCoverageRepository.findByVacationEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacationCoverageResponse> getVacationCoveragesBySubstitute(UUID substituteEmployeeId) {
        return vacationCoverageRepository.findBySubstituteEmployeeId(substituteEmployeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacationCoverageResponse> getVacationCoveragesByStatus(VacationCoverage.CoverageStatus status) {
        return vacationCoverageRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacationCoverageResponse> getVacationCoveragesByDateRange(LocalDate startDate, LocalDate endDate) {
        return vacationCoverageRepository.findByDateRange(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public VacationCoverageResponse createVacationCoverage(CreateVacationCoverageRequest request) {
        // Validar se o funcionÃ¡rio existe
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        // Criar ou buscar vacation
        Vacation vacation;
        if (request.getVacationId() != null) {
            vacation = vacationRepository.findById(request.getVacationId())
                    .orElseThrow(() -> new RuntimeException("FÃ©rias nÃ£o encontradas"));
        } else {
            // Criar vacation temporÃ¡ria para esta cobertura
            // Calcular dias de fÃ©rias
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
            int daysTaken = (int) daysBetween;
            
            vacation = Vacation.builder()
                    .employee(employee)
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .daysTaken(daysTaken)
                    .remainingDays(30 - daysTaken) // Assumindo 30 dias de direito
                    .status(VacationStatus.APPROVED)
                    .build();
            vacation = vacationRepository.save(vacation);
        }

        // Validar e buscar substituto (se fornecido)
        Employee substitute = null;
        if (request.getSubstituteEmployeeId() != null) {
            substitute = employeeRepository.findById(request.getSubstituteEmployeeId())
                    .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio substituto nÃ£o encontrado"));
        }

        // Validar e buscar local (se fornecido)
        WorkPost location = null;
        if (request.getLocationId() != null) {
            location = workPostRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));
        }

        // Converter shift string para enum
        VacationCoverage.ShiftType shiftType = VacationCoverage.ShiftType.valueOf(request.getShift());

        // Determinar status inicial
        VacationCoverage.CoverageStatus status = substitute != null 
                ? VacationCoverage.CoverageStatus.PENDING 
                : VacationCoverage.CoverageStatus.NO_COVERAGE;

        // Criar cobertura
        VacationCoverage coverage = VacationCoverage.builder()
                .vacation(vacation)
                .substituteEmployee(substitute)
                .coverageStartDate(request.getStartDate())
                .coverageEndDate(request.getEndDate())
                .location(location)
                .shift(shiftType)
                .status(status)
                .observations(request.getObservations())
                .isConfirmed(false)
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        return mapToResponse(vacationCoverageRepository.save(coverage));
    }

    public VacationCoverageResponse updateVacationCoverage(UUID id, CreateVacationCoverageRequest request) {
        VacationCoverage existingCoverage = vacationCoverageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cobertura de fÃ©rias nÃ£o encontrada"));

        // Atualizar campos permitidos
        if (request.getStartDate() != null) {
            existingCoverage.setCoverageStartDate(request.getStartDate());
        }
        
        if (request.getEndDate() != null) {
            existingCoverage.setCoverageEndDate(request.getEndDate());
        }

        if (request.getShift() != null) {
            VacationCoverage.ShiftType shiftType = VacationCoverage.ShiftType.valueOf(request.getShift());
            existingCoverage.setShift(shiftType);
        }

        existingCoverage.setObservations(request.getObservations());

        // Atualizar substituto se fornecido
        if (request.getSubstituteEmployeeId() != null) {
            Employee substitute = employeeRepository.findById(request.getSubstituteEmployeeId())
                    .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio substituto nÃ£o encontrado"));
            existingCoverage.setSubstituteEmployee(substitute);
            // Se tinha NO_COVERAGE e agora tem substituto, mudar para PENDING
            if (existingCoverage.getStatus() == VacationCoverage.CoverageStatus.NO_COVERAGE) {
                existingCoverage.setStatus(VacationCoverage.CoverageStatus.PENDING);
            }
        }

        // Atualizar local se fornecido
        if (request.getLocationId() != null) {
            WorkPost location = workPostRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));
            existingCoverage.setLocation(location);
        } else {
            existingCoverage.setLocation(null);
        }

        existingCoverage.setUpdatedAt(java.time.LocalDateTime.now());

        return mapToResponse(vacationCoverageRepository.save(existingCoverage));
    }

    public void deleteVacationCoverage(UUID id) {
        if (!vacationCoverageRepository.existsById(id)) {
            throw new RuntimeException("Cobertura de fÃ©rias nÃ£o encontrada");
        }
        vacationCoverageRepository.deleteById(id);
    }

    public VacationCoverageResponse updateStatus(UUID id, VacationCoverage.CoverageStatus status) {
        VacationCoverage coverage = vacationCoverageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cobertura de fÃ©rias nÃ£o encontrada"));
        
        coverage.setStatus(status);
        
        // Se confirmar, registrar data e confirmaÃ§Ã£o
        if (status == VacationCoverage.CoverageStatus.CONFIRMED) {
            coverage.setIsConfirmed(true);
            coverage.setConfirmationDate(java.time.LocalDateTime.now());
        }
        
        coverage.setUpdatedAt(java.time.LocalDateTime.now());
        
        return mapToResponse(vacationCoverageRepository.save(coverage));
    }

    @Transactional(readOnly = true)
    public List<VacationCoverageResponse> getVacationCoveragesNeedingAttention() {
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusWeeks(1);
        
        return vacationCoverageRepository.findByDateRange(today, nextWeek).stream()
                .filter(coverage -> coverage.getStatus() == VacationCoverage.CoverageStatus.PENDING ||
                                  coverage.getStatus() == VacationCoverage.CoverageStatus.NO_COVERAGE)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private VacationCoverageResponse mapToResponse(VacationCoverage coverage) {
        VacationCoverageResponse.SimpleEmployee employeeData = null;
        if (coverage.getVacation() != null && coverage.getVacation().getEmployee() != null) {
            employeeData = new VacationCoverageResponse.SimpleEmployee(
                    coverage.getVacation().getEmployee().getId(),
                    coverage.getVacation().getEmployee().getName()
            );
        }

        VacationCoverageResponse.SimpleEmployee substituteData = null;
        if (coverage.getSubstituteEmployee() != null) {
            substituteData = new VacationCoverageResponse.SimpleEmployee(
                    coverage.getSubstituteEmployee().getId(),
                    coverage.getSubstituteEmployee().getName()
            );
        }

        VacationCoverageResponse.SimpleWorkPost locationData = null;
        if (coverage.getLocation() != null) {
            locationData = new VacationCoverageResponse.SimpleWorkPost(
                    coverage.getLocation().getId(),
                    coverage.getLocation().getName()
            );
        }

        return VacationCoverageResponse.builder()
                .id(coverage.getId())
                .employee(employeeData)
                .substituteEmployee(substituteData)
                .startDate(coverage.getCoverageStartDate())
                .endDate(coverage.getCoverageEndDate())
                .location(locationData)
                .shift(coverage.getShift() != null ? coverage.getShift().name() : null)
                .status(coverage.getStatus() != null ? coverage.getStatus().name() : null)
                .observations(coverage.getObservations())
                .isConfirmed(coverage.getIsConfirmed())
                .confirmedById(coverage.getConfirmedBy() != null ? coverage.getConfirmedBy().getId() : null)
                .confirmationDate(coverage.getConfirmationDate())
                .createdAt(coverage.getCreatedAt())
                .updatedAt(coverage.getUpdatedAt())
                .build();
    }
}

