package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Absence;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.AbsenceRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@Transactional
public class AbsenceService {

    private static final Logger log = LoggerFactory.getLogger(AbsenceService.class);

    @Autowired
    private AbsenceRepository absenceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<Absence> getAllAbsences() {
        try {
            log.info("ðŸ” Buscando todas as faltas com relacionamentos");
            List<Absence> absences = absenceRepository.findAllWithRelationships();
            log.info("âœ… Faltas encontradas: {} registros", absences.size());

            // Inicializar objetos necessÃ¡rios dentro da transaÃ§Ã£o para evitar
            // LazyInitializationException
            for (Absence absence : absences) {
                if (absence.getEmployee() != null) {
                    // ForÃ§ar inicializaÃ§Ã£o de campos bÃ¡sicos do Employee dentro da transaÃ§Ã£o
                    absence.getEmployee().getName();
                    absence.getEmployee().getId();
                    absence.getEmployee().getRegistrationNumber();
                }
                if (absence.getCoverageEmployee() != null) {
                    absence.getCoverageEmployee().getName();
                    absence.getCoverageEmployee().getId();
                }
                if (absence.getApprovedBy() != null) {
                    absence.getApprovedBy().getName();
                    absence.getApprovedBy().getId();
                }
            }

            return absences;
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar faltas com relacionamentos", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
                log.error("âŒ Tipo da causa: {}", e.getCause().getClass().getName());
                if (e.getCause().getCause() != null) {
                    log.error("âŒ Causa da causa: {}", e.getCause().getCause().getMessage());
                }
            }
            log.error("âŒ Stack trace completo:", e);
            throw new RuntimeException("Erro ao buscar faltas: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Optional<Absence> getAbsenceById(UUID id) {
        try {
            Optional<Absence> absenceOpt = absenceRepository.findByIdWithRelationships(id);
            if (absenceOpt.isPresent()) {
                Absence absence = absenceOpt.get();
                // Inicializar objetos necessÃ¡rios dentro da transaÃ§Ã£o
                if (absence.getEmployee() != null) {
                    absence.getEmployee().getName();
                    absence.getEmployee().getId();
                    absence.getEmployee().getRegistrationNumber();
                }
                if (absence.getCoverageEmployee() != null) {
                    absence.getCoverageEmployee().getName();
                    absence.getCoverageEmployee().getId();
                }
                if (absence.getApprovedBy() != null) {
                    absence.getApprovedBy().getName();
                    absence.getApprovedBy().getId();
                }
            }
            return absenceOpt;
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar falta por ID: {}", id, e);
            // Fallback para mÃ©todo padrÃ£o
            return absenceRepository.findById(id);
        }
    }

    public List<Absence> getAbsencesByEmployee(UUID employeeId) {
        return absenceRepository.findByEmployeeId(employeeId);
    }

    public List<Absence> getAbsencesByDate(LocalDate date) {
        return absenceRepository.findByAbsenceDate(date);
    }

    public List<Absence> getAbsencesByStatus(Absence.AbsenceStatus status) {
        return absenceRepository.findByStatus(status);
    }

    public List<Absence> getAbsencesByType(Absence.AbsenceType type) {
        return absenceRepository.findByAbsenceType(type);
    }

    public List<Absence> getAbsencesByDateRange(LocalDate startDate, LocalDate endDate) {
        return absenceRepository.findByDateRange(startDate, endDate);
    }

    public List<Absence> getAbsencesByEmployeeAndDateRange(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return absenceRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate);
    }

    public Absence createAbsence(Absence absence) {
        // Validar se o funcionÃ¡rio existe
        Employee employee = employeeRepository.findById(absence.getEmployee().getId())
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        // Validar se o funcionÃ¡rio que cobriu a falta existe (se fornecido)
        if (absence.getCoverageEmployee() != null) {
            Employee coverageEmployee = employeeRepository.findById(absence.getCoverageEmployee().getId())
                    .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio que cobriu a falta nÃ£o encontrado"));
            absence.setCoverageEmployee(coverageEmployee);
        }

        absence.setEmployee(employee);

        return absenceRepository.save(absence);
    }

    public Absence updateAbsence(UUID id, Absence updatedAbsence) {
        Absence existingAbsence = absenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Falta nÃ£o encontrada"));

        // Atualizar campos permitidos
        // IMPORTANTE: Atualizar absenceType sempre que fornecido (nÃ£o null)
        if (updatedAbsence.getAbsenceType() != null) {
            existingAbsence.setAbsenceType(updatedAbsence.getAbsenceType());
            log.info("âœ… Atualizando absenceType de '{}' para '{}'", existingAbsence.getAbsenceType(),
                    updatedAbsence.getAbsenceType());
        } else {
            log.warn("âš ï¸ absenceType Ã© null no update - mantendo valor atual: {}",
                    existingAbsence.getAbsenceType());
        }

        if (updatedAbsence.getAbsenceDate() != null) {
            existingAbsence.setAbsenceDate(updatedAbsence.getAbsenceDate());
        }
        if (updatedAbsence.getReason() != null) {
            existingAbsence.setReason(updatedAbsence.getReason());
        }
        if (updatedAbsence.getMedicalCertificateDays() != null) {
            existingAbsence.setMedicalCertificateDays(updatedAbsence.getMedicalCertificateDays());
        }
        if (updatedAbsence.getDocumentUrl() != null) {
            existingAbsence.setDocumentUrl(updatedAbsence.getDocumentUrl());
        }
        if (updatedAbsence.getStatus() != null) {
            existingAbsence.setStatus(updatedAbsence.getStatus());
        }
        if (updatedAbsence.getIsJustified() != null) {
            existingAbsence.setIsJustified(updatedAbsence.getIsJustified());
        }
        if (updatedAbsence.getCoverageNotes() != null) {
            existingAbsence.setCoverageNotes(updatedAbsence.getCoverageNotes());
        }

        // Validar e atualizar funcionÃ¡rio que cobriu a falta se fornecido
        if (updatedAbsence.getCoverageEmployee() != null) {
            Employee coverageEmployee = employeeRepository.findById(updatedAbsence.getCoverageEmployee().getId())
                    .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio que cobriu a falta nÃ£o encontrado"));
            existingAbsence.setCoverageEmployee(coverageEmployee);
        }

        return absenceRepository.save(existingAbsence);
    }

    public void deleteAbsence(UUID id) {
        if (!absenceRepository.existsById(id)) {
            throw new RuntimeException("Falta nÃ£o encontrada");
        }
        absenceRepository.deleteById(id);
    }

    public Absence updateStatus(UUID id, Absence.AbsenceStatus status) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Falta nÃ£o encontrada"));

        absence.setStatus(status);
        absence.setUpdatedAt(java.time.LocalDateTime.now());

        return absenceRepository.save(absence);
    }

    public List<Absence> getPendingAbsences() {
        return absenceRepository.findByStatus(Absence.AbsenceStatus.PENDING);
    }

    public List<Absence> getTodayAbsences() {
        return absenceRepository.findByAbsenceDate(LocalDate.now());
    }

    public Long getEmployeeAbsenceCount(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return absenceRepository.countApprovedAbsencesByEmployeeAndDateRange(employeeId, startDate, endDate);
    }

    @Transactional
    public Absence approveAbsence(UUID absenceId, String observacoes) {
        Absence absence = absenceRepository.findById(absenceId)
                .orElseThrow(() -> new RuntimeException("Afastamento nÃ£o encontrado"));

        if (absence.getStatus() != Absence.AbsenceStatus.PENDING) {
            throw new IllegalArgumentException("Apenas afastamentos pendentes podem ser aprovados");
        }

        absence.setStatus(Absence.AbsenceStatus.APPROVED);
        // TODO: Buscar o usuÃ¡rio atual do contexto de seguranÃ§a para setar approvedBy

        Absence savedAbsence = absenceRepository.save(absence);

        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o para evitar
        // LazyInitializationException
        try {
            if (savedAbsence.getEmployee() != null) {
                savedAbsence.getEmployee().getName();
                savedAbsence.getEmployee().getId();
                savedAbsence.getEmployee().getRegistrationNumber();
            }
            if (savedAbsence.getCoverageEmployee() != null) {
                savedAbsence.getCoverageEmployee().getName();
                savedAbsence.getCoverageEmployee().getId();
            }
            if (savedAbsence.getApprovedBy() != null) {
                savedAbsence.getApprovedBy().getName();
                savedAbsence.getApprovedBy().getId();
            }
        } catch (Exception e) {
            log.warn("Erro ao inicializar relacionamentos do afastamento {}: {}", absenceId, e.getMessage());
        }

        return savedAbsence;
    }

    @Transactional
    public Absence rejectAbsence(UUID absenceId, String motivo) {
        Absence absence = absenceRepository.findById(absenceId)
                .orElseThrow(() -> new RuntimeException("Afastamento nÃ£o encontrado"));

        if (absence.getStatus() != Absence.AbsenceStatus.PENDING) {
            throw new IllegalArgumentException("Apenas afastamentos pendentes podem ser rejeitados");
        }

        absence.setStatus(Absence.AbsenceStatus.REJECTED);
        // TODO: Buscar o usuÃ¡rio atual do contexto de seguranÃ§a para setar approvedBy

        Absence savedAbsence = absenceRepository.save(absence);

        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o para evitar
        // LazyInitializationException
        try {
            if (savedAbsence.getEmployee() != null) {
                savedAbsence.getEmployee().getName();
                savedAbsence.getEmployee().getId();
                savedAbsence.getEmployee().getRegistrationNumber();
            }
            if (savedAbsence.getCoverageEmployee() != null) {
                savedAbsence.getCoverageEmployee().getName();
                savedAbsence.getCoverageEmployee().getId();
            }
            if (savedAbsence.getApprovedBy() != null) {
                savedAbsence.getApprovedBy().getName();
                savedAbsence.getApprovedBy().getId();
            }
        } catch (Exception e) {
            log.warn("Erro ao inicializar relacionamentos do afastamento {}: {}", absenceId, e.getMessage());
        }

        return savedAbsence;
    }
}
