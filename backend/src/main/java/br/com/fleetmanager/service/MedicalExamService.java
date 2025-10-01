package br.com.fleetmanager.service;

import br.com.fleetmanager.model.MedicalExamType;
import br.com.fleetmanager.model.MedicalExam;
import br.com.fleetmanager.model.enums.MedicalExamStatus;
import br.com.fleetmanager.repository.MedicalExamTypeRepository;
import br.com.fleetmanager.repository.MedicalExamRepository;
import br.com.fleetmanager.service.SSTAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de exames médicos
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

    // ========== EXAMES MÉDICOS ==========

    /**
     * Cria um novo exame médico
     */
    public MedicalExam createExam(MedicalExam exam) {
        log.info("Criando exame médico para funcionário: {}", exam.getEmployee().getId());
        return examRepository.save(exam);
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
     * Busca exames por funcionário
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExamsByEmployee(UUID employeeId) {
        return examRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca exames por funcionário e tipo
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExamsByEmployeeAndType(UUID employeeId, UUID examTypeId) {
        // TODO: Implementar quando o método estiver disponível no repositório
        return examRepository.findByEmployeeId(employeeId).stream()
                .filter(exam -> exam.getExamType().getId().equals(examTypeId))
                .toList();
    }

    /**
     * Atualiza exame médico
     */
    public MedicalExam updateExam(UUID id, MedicalExam exam) {
        log.info("Atualizando exame médico: {}", id);
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
                    return examRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui exame médico
     */
    public void deleteExam(UUID id) {
        log.info("Excluindo exame médico: {}", id);
        examRepository.deleteById(id);
    }

    // ========== EXAMES VENCIDOS/PRÓXIMOS DO VENCIMENTO ==========

    /**
     * Busca exames vencidos
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExpiredExams() {
        // TODO: Implementar quando o método estiver disponível no repositório
        return examRepository.findAll().stream()
                .filter(exam -> exam.getNextExamDate() != null && exam.getNextExamDate().isBefore(LocalDate.now()))
                .toList();
    }

    /**
     * Busca exames próximos do vencimento
     */
    @Transactional(readOnly = true)
    public List<MedicalExam> getExpiringExams(int daysAhead) {
        LocalDate checkDate = LocalDate.now().plusDays(daysAhead);
        // TODO: Implementar quando o método estiver disponível no repositório
        return examRepository.findAll().stream()
                .filter(exam -> exam.getNextExamDate() != null && 
                               !exam.getNextExamDate().isBefore(LocalDate.now()) && 
                               !exam.getNextExamDate().isAfter(checkDate))
                .toList();
    }

    // ========== AGENDAMENTO AUTOMÁTICO ==========

    /**
     * Agenda exame admissional
     */
    public MedicalExam scheduleAdmissionExam(UUID employeeId) {
        log.info("Agendando exame admissional para funcionário: {}", employeeId);
        
        // TODO: Buscar tipo de exame admissional
        MedicalExamType admissionType = examTypeRepository.findAll().stream()
                .filter(type -> "ADMISSIONAL".equals(type.getExamCategory().toString()))
                .findFirst()
                .orElse(null);
        
        if (admissionType == null) {
            throw new IllegalArgumentException("Tipo de exame admissional não encontrado");
        }
        
        MedicalExam exam = new MedicalExam();
        // TODO: Implementar quando Employee estiver disponível
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
     * Agenda exame periódico
     */
    public MedicalExam schedulePeriodicExam(UUID employeeId) {
        log.info("Agendando exame periódico para funcionário: {}", employeeId);
        
        // TODO: Buscar tipo de exame periódico
        MedicalExamType periodicType = examTypeRepository.findAll().stream()
                .filter(type -> "PERIODICO".equals(type.getExamCategory().toString()))
                .findFirst()
                .orElse(null);
        
        if (periodicType == null) {
            throw new IllegalArgumentException("Tipo de exame periódico não encontrado");
        }
        
        MedicalExam exam = new MedicalExam();
        // TODO: Implementar quando Employee estiver disponível
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
        log.info("Agendando exame demissional para funcionário: {}", employeeId);
        
        // TODO: Buscar tipo de exame demissional
        MedicalExamType dismissalType = examTypeRepository.findAll().stream()
                .filter(type -> "DEMISSIONAL".equals(type.getExamCategory().toString()))
                .findFirst()
                .orElse(null);
        
        if (dismissalType == null) {
            throw new IllegalArgumentException("Tipo de exame demissional não encontrado");
        }
        
        MedicalExam exam = new MedicalExam();
        // TODO: Implementar quando Employee estiver disponível
        // exam.setEmployee(employee);
        exam.setExamType(dismissalType);
        exam.setScheduledDate(LocalDate.now().plusDays(1)); // Agenda para 1 dia
        exam.setStatus(MedicalExamStatus.PENDENTE);
        
        MedicalExam saved = examRepository.save(exam);
        
        // Cria alerta
        alertService.createMedicalExamExpirationAlert(employeeId, dismissalType.getName(), saved.getScheduledDate());
        
        return saved;
    }
}
