package br.com.fleetmanager.service;

import br.com.fleetmanager.model.SSTTraining;
import br.com.fleetmanager.model.TrainingParticipation;
import br.com.fleetmanager.model.enums.TrainingStatus;
import br.com.fleetmanager.repository.SSTTrainingRepository;
import br.com.fleetmanager.repository.TrainingParticipationRepository;
import br.com.fleetmanager.service.SSTAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de treinamentos SST
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SSTTrainingService {

    private final SSTTrainingRepository trainingRepository;
    private final TrainingParticipationRepository participationRepository;
    private final SSTAlertService alertService;

    // ========== TREINAMENTOS ==========

    /**
     * Cria um novo treinamento
     */
    public SSTTraining createTraining(SSTTraining training) {
        log.info("Criando treinamento: {}", training.getName());
        return trainingRepository.save(training);
    }

    /**
     * Busca todos os treinamentos
     */
    @Transactional(readOnly = true)
    public List<SSTTraining> getAllTrainings() {
        return trainingRepository.findAll();
    }

    /**
     * Busca treinamento por ID
     */
    @Transactional(readOnly = true)
    public SSTTraining getTrainingById(UUID id) {
        return trainingRepository.findById(id).orElse(null);
    }

    /**
     * Busca treinamentos ativos
     */
    @Transactional(readOnly = true)
    public List<SSTTraining> getActiveTrainings() {
        return trainingRepository.findByIsActiveTrue();
    }

    /**
     * Atualiza treinamento
     */
    public SSTTraining updateTraining(UUID id, SSTTraining training) {
        log.info("Atualizando treinamento: {}", id);
        return trainingRepository.findById(id)
                .map(existing -> {
                    existing.setName(training.getName());
                    existing.setDescription(training.getDescription());
                    existing.setTrainingType(training.getTrainingType());
                    existing.setDurationHours(training.getDurationHours());
                    existing.setValidityMonths(training.getValidityMonths());
                    existing.setIsActive(training.getIsActive());
                    existing.setRequiredForRisks(training.getRequiredForRisks());
                    return trainingRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui treinamento
     */
    public void deleteTraining(UUID id) {
        log.info("Excluindo treinamento: {}", id);
        trainingRepository.deleteById(id);
    }

    // ========== PARTICIPAÇÕES EM TREINAMENTOS ==========

    /**
     * Cria uma nova participação
     */
    public TrainingParticipation createParticipation(TrainingParticipation participation) {
        log.info("Criando participação em treinamento para funcionário: {}", participation.getEmployee().getId());
        return participationRepository.save(participation);
    }

    /**
     * Busca todas as participações
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getAllParticipations() {
        return participationRepository.findAll();
    }

    /**
     * Busca participação por ID
     */
    @Transactional(readOnly = true)
    public TrainingParticipation getParticipationById(UUID id) {
        return participationRepository.findById(id).orElse(null);
    }

    /**
     * Busca participações por funcionário
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getParticipationsByEmployee(UUID employeeId) {
        return participationRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca participações por treinamento
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getParticipationsByTraining(UUID trainingId) {
        // TODO: Implementar quando o método estiver disponível no repositório
        return participationRepository.findAll().stream()
                .filter(participation -> participation.getTraining().getId().equals(trainingId))
                .toList();
    }

    /**
     * Atualiza participação
     */
    public TrainingParticipation updateParticipation(UUID id, TrainingParticipation participation) {
        log.info("Atualizando participação: {}", id);
        return participationRepository.findById(id)
                .map(existing -> {
                    existing.setTraining(participation.getTraining());
                    existing.setParticipationDate(participation.getParticipationDate());
                    existing.setCompletionDate(participation.getCompletionDate());
                    existing.setStatus(participation.getStatus());
                    existing.setInstructorName(participation.getInstructorName());
                    existing.setCertificateUrl(participation.getCertificateUrl());
                    existing.setNotes(participation.getNotes());
                    return participationRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui participação
     */
    public void deleteParticipation(UUID id) {
        log.info("Excluindo participação: {}", id);
        participationRepository.deleteById(id);
    }

    // ========== TREINAMENTOS VENCIDOS/PRÓXIMOS DO VENCIMENTO ==========

    /**
     * Busca treinamentos vencidos
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getExpiredTrainings() {
        // TODO: Implementar quando a query estiver corrigida
        return participationRepository.findAll().stream()
                .filter(participation -> {
                    if (participation.getCompletionDate() == null || participation.getTraining().getValidityMonths() == null) {
                        return false;
                    }
                    LocalDate expirationDate = participation.getCompletionDate().plusMonths(participation.getTraining().getValidityMonths());
                    return expirationDate.isBefore(LocalDate.now());
                })
                .toList();
    }

    /**
     * Busca treinamentos próximos do vencimento
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getExpiringTrainings(int daysAhead) {
        LocalDate checkDate = LocalDate.now().plusDays(daysAhead);
        
        return participationRepository.findAll().stream()
                .filter(participation -> {
                    if (participation.getCompletionDate() == null || participation.getTraining().getValidityMonths() == null) {
                        return false;
                    }
                    LocalDate expirationDate = participation.getCompletionDate().plusMonths(participation.getTraining().getValidityMonths());
                    return !expirationDate.isBefore(LocalDate.now()) && !expirationDate.isAfter(checkDate);
                })
                .toList();
    }

    // ========== AGENDAMENTO AUTOMÁTICO ==========

    /**
     * Agenda treinamento para funcionário
     */
    public TrainingParticipation scheduleTraining(UUID trainingId, UUID employeeId, LocalDate scheduledDate) {
        log.info("Agendando treinamento {} para funcionário {} em {}", trainingId, employeeId, scheduledDate);
        
        SSTTraining training = getTrainingById(trainingId);
        if (training == null) {
            throw new IllegalArgumentException("Treinamento não encontrado");
        }
        
        TrainingParticipation participation = new TrainingParticipation();
        // TODO: Implementar quando Employee estiver disponível
        // participation.setEmployee(employee);
        participation.setTraining(training);
        participation.setParticipationDate(scheduledDate);
        participation.setStatus(TrainingStatus.AGENDADO);
        
        TrainingParticipation saved = participationRepository.save(participation);
        
        // Cria alerta
        alertService.createTrainingExpirationAlert(employeeId, training.getName(), scheduledDate);
        
        return saved;
    }

    /**
     * Completa treinamento
     */
    public TrainingParticipation completeTraining(UUID participationId, LocalDate completionDate, String certificateUrl) {
        log.info("Completando treinamento: {}", participationId);
        
        return participationRepository.findById(participationId)
                .map(participation -> {
                    participation.setCompletionDate(completionDate);
                    participation.setStatus(TrainingStatus.CONCLUIDO);
                    participation.setCertificateUrl(certificateUrl);
                    
                    TrainingParticipation saved = participationRepository.save(participation);
                    
                    // Cria alerta de reciclagem se necessário
                    if (participation.getTraining().getValidityMonths() != null) {
                        LocalDate expirationDate = completionDate.plusMonths(participation.getTraining().getValidityMonths());
                        alertService.createTrainingExpirationAlert(participation.getEmployee().getId(), 
                                participation.getTraining().getName(), expirationDate);
                    }
                    
                    return saved;
                })
                .orElse(null);
    }
}
