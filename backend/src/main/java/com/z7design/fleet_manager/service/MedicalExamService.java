package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.MedicalExamType;
import com.z7design.fleet_manager.model.MedicalExam;
import com.z7design.fleet_manager.model.enums.MedicalExamStatus;
import com.z7design.fleet_manager.repository.MedicalExamTypeRepository;
import com.z7design.fleet_manager.repository.MedicalExamRepository;
import com.z7design.fleet_manager.service.SSTAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * ServiÃ§o para gerenciamento de exames mÃ©dicos
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MedicalExamService {

    private final MedicalExamTypeRepository examTypeRepository;
    private final MedicalExamRepository examRepository;
    private final SSTAlertService alertService;

    // ========== TIPOS DE EXAME ==========

    /**
     * Cria um novo tipo de exame
     */
    public MedicalExamType createExamType(MedicalExamType examType) {
        log.info("Criando tipo de exame: {}", examType.getName());
        return examTypeRepository.save(examType);
    }

    /**
     * Busca todos os tipos de exame
     */
    @Transactional(readOnly = true)
    public List<MedicalExamType> getAllExamTypes() {
        return examTypeRepository.findAll();
    }

    /**
     * Busca tipo de exame por ID
     */
    @Transactional(readOnly = true)
    public MedicalExamType getExamTypeById(UUID id) {
        return examTypeRepository.findById(id).orElse(null);
    }

    /**
     * Atualiza tipo de exame
     */
    public MedicalExamType updateExamType(UUID id, MedicalExamType examType) {
        log.info("Atualizando tipo de exame: {}", id);
        return examTypeRepository.findById(id)
                .map(existing -> {
                    existing.setName(examType.getName());
                    existing.setDescription(examType.getDescription());
                    existing.setExamCategory(examType.getExamCategory());
                    existing.setValidityMonths(examType.getValidityMonths());
                    existing.setIsActive(examType.getIsActive());
                    return examTypeRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui tipo de exame
     */
    public void deleteExamType(UUID id) {
        log.info("Excluindo tipo de exame: {}", id);
        examTypeRepository.deleteById(id);
    }

    // ========== EXAMES MÃ‰DICOS ==========

    /**
     * Cria um novo exame mÃ©dico
     */
    public MedicalExam createExam(MedicalExam exam) {
        log.info("Criando exame medico para funcionario: {}", exam.getEmployee().getId());
        calculateNextExamDate(exam);
        syncEmployeeExamDates(exam);
        return examRepository.save(exam);
    }

    /**
     * Calcula a data do proximo exame quando nao informada:
     * validade = validityMonths do tipo (padrao 12 meses = 1 ano, ex.: ASO).
     */
    private void calculateNextExamDate(MedicalExam exam) {
        if (exam.getExamDate() == null || exam.getNextExamDate() != null) {
            return;
        }
        Integer validityMonths = exam.getExamType() != null ? exam.getExamType().getValidityMonths() : null;
        int months = (validityMonths != null && validityMonths > 0) ? validityMonths : 12;
        exam.setNextExamDate(exam.getExamDate().plusMonths(months));
        log.info("Proximo exame calculado automaticamente: {} (validade de {} meses)", exam.getNextExamDate(), months);
    }

    /**
     * Espelha a data do exame no cadastro do funcionario (ASO) e recalcula o
     * proximo vencimento (1 ano), mantendo o scheduler de alertas consistente.
     */
    private void syncEmployeeExamDates(MedicalExam exam) {
        if (exam.getEmployee() == null || exam.getExamDate() == null) {
            return;
        }
        com.z7design.fleet_manager.model.Employee employee = exam.getEmployee();
        employee.setExameMedicoData(exam.getExamDate());
        employee.setNextExameMedico(exam.getNextExamDate() != null
                ? exam.getNextExamDate()
                : exam.getExamDate().plusYears(1));
    }

    /**
     * Busca todos os exames
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getAllExams() {
        return examRepository.findAll();
    }

    /**
     * Busca exame por ID
     */
    @Transactional(readOnly = true)
    public MedicalExam getExamById(UUID id) {
        return examRepository.findById(id).orElse(null);
    }

    /**
     * Busca exames por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExamsByEmployee(UUID employeeId) {
        return examRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca exames por funcionÃ¡rio e tipo
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExamsByEmployeeAndType(UUID employeeId, UUID examTypeId) {
        // TODO: Implementar quando o mÃ©todo estiver disponÃ­vel no repositÃ³rio
        return examRepository.findByEmployeeId(employeeId).stream()
                .filter(exam -> exam.getExamType().getId().equals(examTypeId))
                .toList();
    }

    /**
     * Atualiza exame mÃ©dico
     */
    public MedicalExam updateExam(UUID id, MedicalExam exam) {
        log.info("Atualizando exame mÃ©dico: {}", id);
        return examRepository.findById(id)
                .map(existing -> {
                    existing.setExamType(exam.getExamType());
                    existing.setExamDate(exam.getExamDate());
                    existing.setNextExamDate(exam.getNextExamDate());
                    existing.setStatus(exam.getStatus());
                    existing.setResult(exam.getResult());
                    existing.setDoctorName(exam.getDoctorName());
                    existing.setClinicName(exam.getClinicName());
                    existing.setDocumentUrl(exam.getDocumentUrl());
                    existing.setNotes(exam.getNotes());
                    calculateNextExamDate(existing);
                    syncEmployeeExamDates(existing);
                    return examRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui exame mÃ©dico
     */
    public void deleteExam(UUID id) {
        log.info("Excluindo exame mÃ©dico: {}", id);
        examRepository.deleteById(id);
    }

    // ========== EXAMES VENCIDOS/PRÃ“XIMOS DO VENCIMENTO ==========

    /**
     * Busca exames vencidos
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExpiredExams() {
        // TODO: Implementar quando o mÃ©todo estiver disponÃ­vel no repositÃ³rio
        return examRepository.findAll().stream()
                .filter(exam -> exam.getNextExamDate() != null && exam.getNextExamDate().isBefore(LocalDate.now()))
                .toList();
    }

    /**
     * Busca exames prÃ³ximos do vencimento
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExpiringExams(int daysAhead) {
        LocalDate checkDate = LocalDate.now().plusDays(daysAhead);
        // TODO: Implementar quando o mÃ©todo estiver disponÃ­vel no repositÃ³rio
        return examRepository.findAll().stream()
                .filter(exam -> exam.getNextExamDate() != null && 
                               !exam.getNextExamDate().isBefore(LocalDate.now()) && 
                               !exam.getNextExamDate().isAfter(checkDate))
                .toList();
    }

    // ========== AGENDAMENTO AUTOMÃTICO ==========

    /**
     * Agenda exame admissional
     */
    public MedicalExam scheduleAdmissionExam(UUID employeeId) {
        log.info("Agendando exame admissional para funcionÃ¡rio: {}", employeeId);
        
        // TODO: Buscar tipo de exame admissional
        MedicalExamType admissionType = examTypeRepository.findAll().stream()
                .filter(type -> "ADMISSIONAL".equals(type.getExamCategory().toString()))
                .findFirst()
                .orElse(null);
        
        if (admissionType == null) {
            throw new IllegalArgumentException("Tipo de exame admissional nÃ£o encontrado");
        }
        
        MedicalExam exam = new MedicalExam();
        // TODO: Implementar quando Employee estiver disponÃ­vel
        // exam.setEmployee(employee);
        exam.setExamType(admissionType);
        exam.setScheduledDate(LocalDate.now().plusDays(7)); // Agenda para 7 dias
        exam.setStatus(MedicalExamStatus.PENDENTE);
        
        MedicalExam saved = examRepository.save(exam);
        
        // Cria alerta
        alertService.createMedicalExamExpirationAlert(employeeId, admissionType.getName(), saved.getScheduledDate());
        
        return saved;
    }

    /**
     * Agenda exame periÃ³dico
     */
    public MedicalExam schedulePeriodicExam(UUID employeeId) {
        log.info("Agendando exame periÃ³dico para funcionÃ¡rio: {}", employeeId);
        
        // TODO: Buscar tipo de exame periÃ³dico
        MedicalExamType periodicType = examTypeRepository.findAll().stream()
                .filter(type -> "PERIODICO".equals(type.getExamCategory().toString()))
                .findFirst()
                .orElse(null);
        
        if (periodicType == null) {
            throw new IllegalArgumentException("Tipo de exame periÃ³dico nÃ£o encontrado");
        }
        
        MedicalExam exam = new MedicalExam();
        // TODO: Implementar quando Employee estiver disponÃ­vel
        // exam.setEmployee(employee);
        exam.setExamType(periodicType);
        exam.setScheduledDate(LocalDate.now().plusDays(7)); // Agenda para 7 dias
        exam.setStatus(MedicalExamStatus.PENDENTE);
        
        MedicalExam saved = examRepository.save(exam);
        
        // Cria alerta
        alertService.createMedicalExamExpirationAlert(employeeId, periodicType.getName(), saved.getScheduledDate());
        
        return saved;
    }

    /**
     * Agenda exame demissional
     */
    public MedicalExam scheduleDismissalExam(UUID employeeId) {
        log.info("Agendando exame demissional para funcionÃ¡rio: {}", employeeId);
        
        // TODO: Buscar tipo de exame demissional
        MedicalExamType dismissalType = examTypeRepository.findAll().stream()
                .filter(type -> "DEMISSIONAL".equals(type.getExamCategory().toString()))
                .findFirst()
                .orElse(null);
        
        if (dismissalType == null) {
            throw new IllegalArgumentException("Tipo de exame demissional nÃ£o encontrado");
        }
        
        MedicalExam exam = new MedicalExam();
        // TODO: Implementar quando Employee estiver disponÃ­vel
        // exam.setEmployee(employee);
        exam.setExamType(dismissalType);
        exam.setScheduledDate(LocalDate.now().plusDays(1)); // Agenda para 1 dia
        exam.setStatus(MedicalExamStatus.PENDENTE);
        
        MedicalExam saved = examRepository.save(exam);
        
        // Cria alerta
        alertService.createMedicalExamExpirationAlert(employeeId, dismissalType.getName(), saved.getScheduledDate());
        
        return saved;
    }

    // ========== CONSULTAS ==========

    /**
     * Busca nomes Ãºnicos de clÃ­nicas dos exames mÃ©dicos
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctClinicNames() {
        log.debug("Buscando nomes Ãºnicos de clÃ­nicas");
        return examRepository.findDistinctClinicNames();
    }
}

