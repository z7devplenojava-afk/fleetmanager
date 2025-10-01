package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.VisitDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.Unit;
import br.com.fleetmanager.model.Visit;
import br.com.fleetmanager.model.enums.VisitStatus;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.UnitRepository;
import br.com.fleetmanager.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VisitService {
    
    private final VisitRepository visitRepository;
    private final EmployeeRepository employeeRepository;
    private final UnitRepository unitRepository;
    
    public List<VisitDTO> getVisitsBySupervisorAndMonth(UUID supervisorId, int year, int month) {
        List<Visit> visits = visitRepository.findBySupervisorIdAndYearAndMonth(supervisorId, year, month);
        return visits.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public VisitDTO createVisit(VisitDTO visitDTO) {
        // Verificar se supervisor existe
        Employee supervisor = employeeRepository.findById(visitDTO.getSupervisorId())
            .orElseThrow(() -> new ResourceNotFoundException("Supervisor não encontrado"));
        
        // Verificar se unidade existe
        Unit unit = unitRepository.findById(visitDTO.getUnitId())
            .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada"));
        
        // Verificar se já existe visita para este supervisor/unidade/data
        visitRepository.findBySupervisorIdAndUnitIdAndVisitDate(
            visitDTO.getSupervisorId(), 
            visitDTO.getUnitId(), 
            visitDTO.getVisitDate()
        ).ifPresent(existing -> {
            throw new RuntimeException("Já existe uma visita registrada para este supervisor, unidade e data");
        });
        
        Visit visit = Visit.builder()
            .visitDate(visitDTO.getVisitDate())
            .supervisor(supervisor)
            .unit(unit)
            .status(visitDTO.getStatus() != null ? visitDTO.getStatus() : VisitStatus.PENDING)
            .observations(visitDTO.getObservations())
            .arrivalTime(visitDTO.getArrivalTime())
            .departureTime(visitDTO.getDepartureTime())
            .securityCheck(visitDTO.getSecurityCheck())
            .equipmentCheck(visitDTO.getEquipmentCheck())
            .staffCheck(visitDTO.getStaffCheck())
            .procedureCheck(visitDTO.getProcedureCheck())
            .build();
        
        Visit savedVisit = visitRepository.save(visit);
        log.info("Visita criada com sucesso: ID={}, Supervisor={}, Unidade={}, Data={}", 
                savedVisit.getId(), supervisor.getName(), unit.getName(), visitDTO.getVisitDate());
        
        return convertToDTO(savedVisit);
    }
    
    public VisitDTO updateVisit(UUID id, VisitDTO visitDTO) {
        Visit visit = visitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Visita não encontrada"));
        
        // Atualizar campos
        if (visitDTO.getStatus() != null) {
            visit.setStatus(visitDTO.getStatus());
        }
        
        visit.setObservations(visitDTO.getObservations());
        visit.setArrivalTime(visitDTO.getArrivalTime());
        visit.setDepartureTime(visitDTO.getDepartureTime());
        visit.setSecurityCheck(visitDTO.getSecurityCheck());
        visit.setEquipmentCheck(visitDTO.getEquipmentCheck());
        visit.setStaffCheck(visitDTO.getStaffCheck());
        visit.setProcedureCheck(visitDTO.getProcedureCheck());
        
        Visit updatedVisit = visitRepository.save(visit);
        log.info("Visita atualizada: ID={}", id);
        
        return convertToDTO(updatedVisit);
    }
    
    public VisitDTO markVisitAsCompleted(UUID id) {
        Visit visit = visitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Visita não encontrada"));
        
        visit.setStatus(VisitStatus.COMPLETED);
        if (visit.getArrivalTime() == null) {
            visit.setArrivalTime(LocalDateTime.now());
        }
        if (visit.getDepartureTime() == null) {
            visit.setDepartureTime(LocalDateTime.now());
        }
        
        Visit completedVisit = visitRepository.save(visit);
        log.info("Visita marcada como realizada: ID={}", id);
        
        return convertToDTO(completedVisit);
    }
    
    public void deleteVisit(UUID id) {
        if (!visitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Visita não encontrada");
        }
        visitRepository.deleteById(id);
        log.info("Visita excluída: ID={}", id);
    }
    
    public Map<String, Object> getVisitStatistics(UUID supervisorId, int year, int month) {
        Long totalVisits = visitRepository.countBySupervisorIdAndYearAndMonth(supervisorId, year, month);
        Long completedVisits = visitRepository.countBySupervisorIdAndStatusAndYearAndMonth(supervisorId, VisitStatus.COMPLETED, year, month);
        Long pendingVisits = visitRepository.countBySupervisorIdAndStatusAndYearAndMonth(supervisorId, VisitStatus.PENDING, year, month);
        Long notCompletedVisits = visitRepository.countBySupervisorIdAndStatusAndYearAndMonth(supervisorId, VisitStatus.NOT_COMPLETED, year, month);
        
        double completionRate = totalVisits > 0 ? (completedVisits.doubleValue() / totalVisits.doubleValue()) * 100 : 0;
        
        return Map.of(
            "totalVisits", totalVisits,
            "completedVisits", completedVisits,
            "pendingVisits", pendingVisits,
            "notCompletedVisits", notCompletedVisits,
            "completionRate", Math.round(completionRate * 100.0) / 100.0
        );
    }
    
    public List<VisitDTO> getTodaysVisits(UUID supervisorId) {
        List<Visit> visits = visitRepository.findTodaysVisitsBySupervisor(supervisorId);
        return visits.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    public List<VisitDTO> generateMonthlyVisitsTemplate(UUID supervisorId, int year, int month) {
        // Buscar unidades ativas para o supervisor
        List<Unit> units = unitRepository.findByActiveTrue();
        
        YearMonth yearMonth = YearMonth.of(year, month);
        int daysInMonth = yearMonth.lengthOfMonth();
        
        Employee supervisor = employeeRepository.findById(supervisorId)
            .orElseThrow(() -> new ResourceNotFoundException("Supervisor não encontrado"));
        
        // Gerar template de visitas para todos os dias úteis do mês
        List<VisitDTO> template = units.stream()
            .flatMap(unit -> {
                return java.util.stream.IntStream.rangeClosed(1, daysInMonth)
                    .mapToObj(day -> {
                        LocalDate visitDate = LocalDate.of(year, month, day);
                        
                        // Verificar se já existe visita para esta data/unidade
                        boolean exists = visitRepository.findBySupervisorIdAndUnitIdAndVisitDate(
                            supervisorId, unit.getId(), visitDate
                        ).isPresent();
                        
                        if (!exists) {
                            return VisitDTO.builder()
                                .visitDate(visitDate)
                                .supervisorId(supervisorId)
                                .supervisorName(supervisor.getName())
                                .unitId(unit.getId())
                                .unitName(unit.getName())
                                .unitAddress(unit.getAddress())
                                .status(VisitStatus.PENDING)
                                .securityCheck(false)
                                .equipmentCheck(false)
                                .staffCheck(false)
                                .procedureCheck(false)
                                .build();
                        }
                        return null;
                    })
                    .filter(java.util.Objects::nonNull);
            })
            .collect(Collectors.toList());
        
        return template;
    }
    
    private VisitDTO convertToDTO(Visit visit) {
        return VisitDTO.builder()
            .id(visit.getId())
            .visitDate(visit.getVisitDate())
            .supervisorId(visit.getSupervisor().getId())
            .supervisorName(visit.getSupervisor().getName())
            .unitId(visit.getUnit().getId())
            .unitName(visit.getUnit().getName())
            .unitAddress(visit.getUnit().getAddress())
            .status(visit.getStatus())
            .observations(visit.getObservations())
            .arrivalTime(visit.getArrivalTime())
            .departureTime(visit.getDepartureTime())
            .securityCheck(visit.getSecurityCheck())
            .equipmentCheck(visit.getEquipmentCheck())
            .staffCheck(visit.getStaffCheck())
            .procedureCheck(visit.getProcedureCheck())
            .createdAt(visit.getCreatedAt())
            .updatedAt(visit.getUpdatedAt())
            .build();
    }
}
