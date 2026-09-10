package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.SSTTrainingDTO;
import com.z7design.fleet_manager.dto.CreateSSTTrainingDTO;
import com.z7design.fleet_manager.model.SSTTraining;
import com.z7design.fleet_manager.model.TrainingParticipation;
import com.z7design.fleet_manager.model.enums.TrainingStatus;
import com.z7design.fleet_manager.repository.SSTTrainingRepository;
import com.z7design.fleet_manager.repository.TrainingParticipationRepository;
import com.z7design.fleet_manager.service.SSTAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ServiÃ§o para gerenciamento de treinamentos SST
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
     * Cria um novo treinamento a partir de DTO
     */
    public SSTTraining createTrainingFromDTO(CreateSSTTrainingDTO dto) {
        log.info("Criando treinamento a partir de DTO: {}", dto.getName());
        SSTTraining training = SSTTraining.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .trainingType(dto.getTrainingType())
                .durationHours(dto.getDurationHours())
                .validityMonths(dto.getValidityMonths())
                .isMandatory(dto.getIsMandatory() != null ? dto.getIsMandatory() : true)
                .provider(dto.getProvider())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .requiredForRisks(dto.getRequiredForRisks())
                .build();
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

    // ========== PARTICIPAÃ‡Ã•ES EM TREINAMENTOS ==========

    /**
     * Cria uma nova participaÃ§Ã£o
     */
    public TrainingParticipation createParticipation(TrainingParticipation participation) {
        log.info("Criando participaÃ§Ã£o em treinamento para funcionÃ¡rio: {}", participation.getEmployee().getId());
        return participationRepository.save(participation);
    }

    /**
     * Busca todas as participaÃ§Ãµes
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getAllParticipations() {
        return participationRepository.findAll();
    }

    /**
     * Busca participaÃ§Ã£o por ID
     */
    @Transactional(readOnly = true)
    public TrainingParticipation getParticipationById(UUID id) {
        return participationRepository.findById(id).orElse(null);
    }

    /**
     * Busca participaÃ§Ãµes por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getParticipationsByEmployee(UUID employeeId) {
        return participationRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca participaÃ§Ãµes por treinamento
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> getParticipationsByTraining(UUID trainingId) {
        // TODO: Implementar quando o mÃ©todo estiver disponÃ­vel no repositÃ³rio
        return participationRepository.findAll().stream()
                .filter(participation -> participation.getTraining().getId().equals(trainingId))
                .toList();
    }

    /**
     * Atualiza participaÃ§Ã£o
     */
    public TrainingParticipation updateParticipation(UUID id, TrainingParticipation participation) {
        log.info("Atualizando participaÃ§Ã£o: {}", id);
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
     * Exclui participaÃ§Ã£o
     */
    public void deleteParticipation(UUID id) {
        log.info("Excluindo participaÃ§Ã£o: {}", id);
        participationRepository.deleteById(id);
    }

    // ========== TREINAMENTOS VENCIDOS/PRÃ“XIMOS DO VENCIMENTO ==========

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
     * Busca treinamentos prÃ³ximos do vencimento
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

    /**
     * Busca treinamentos de um funcionário que vencem antes de uma data
     */
    @Transactional(readOnly = true)
    public List<TrainingParticipation> findExpiringByEmployee(UUID employeeId, LocalDate cutoffDate) {
        List<TrainingParticipation> employeeParticipations = getParticipationsByEmployee(employeeId);
        
        return employeeParticipations.stream()
                .filter(participation -> {
                    if (participation.getCompletionDate() == null || participation.getTraining().getValidityMonths() == null) {
                        return false;
                    }
                    LocalDate expirationDate = participation.getCompletionDate().plusMonths(participation.getTraining().getValidityMonths());
                    return !expirationDate.isBefore(LocalDate.now()) && !expirationDate.isAfter(cutoffDate);
                })
                .toList();
    }

    // ========== AGENDAMENTO AUTOMÃTICO ==========

    /**
     * Agenda treinamento para funcionÃ¡rio
     */
    public TrainingParticipation scheduleTraining(UUID trainingId, UUID employeeId, LocalDate scheduledDate) {
        log.info("Agendando treinamento {} para funcionÃ¡rio {} em {}", trainingId, employeeId, scheduledDate);
        
        SSTTraining training = getTrainingById(trainingId);
        if (training == null) {
            throw new IllegalArgumentException("Treinamento nÃ£o encontrado");
        }
        
        TrainingParticipation participation = new TrainingParticipation();
        // TODO: Implementar quando Employee estiver disponÃ­vel
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
                    
                    // Cria alerta de reciclagem se necessÃ¡rio
                    if (participation.getTraining().getValidityMonths() != null) {
                        LocalDate expirationDate = completionDate.plusMonths(participation.getTraining().getValidityMonths());
                        alertService.createTrainingExpirationAlert(participation.getEmployee().getId(), 
                                participation.getTraining().getName(), expirationDate);
                    }
                    
                    return saved;
                })
                .orElse(null);
    }

    // ========== DTOs AGREGADOS ==========

    /**
     * Busca todos os treinamentos com informaÃ§Ãµes agregadas
     */
    @Transactional(readOnly = true)
    public List<SSTTrainingDTO> getAllTrainingsWithStats() {
        List<SSTTraining> trainings = trainingRepository.findAll();
        return trainings.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Busca treinamento por ID com informaÃ§Ãµes agregadas
     */
    @Transactional(readOnly = true)
    public SSTTrainingDTO getTrainingWithStatsById(UUID id) {
        SSTTraining training = trainingRepository.findById(id).orElse(null);
        if (training == null) {
            return null;
        }
        return toDTO(training);
    }

    /**
     * Converte entidade para DTO com estatÃ­sticas agregadas
     */
    private SSTTrainingDTO toDTO(SSTTraining training) {
        List<TrainingParticipation> participations = participationRepository.findByTraining(training);
        
        long totalParticipants = participations.size();
        long scheduledParticipants = participations.stream()
                .filter(p -> p.getStatus() == TrainingStatus.AGENDADO || p.getStatus() == TrainingStatus.EM_ANDAMENTO)
                .count();
        long completedParticipants = participations.stream()
                .filter(p -> p.getStatus() == TrainingStatus.CONCLUIDO)
                .count();
        
        // Contar certificados prÃ³ximos do vencimento (30 dias)
        LocalDate checkDate = LocalDate.now().plusDays(30);
        long certificatesExpiring = participations.stream()
                .filter(p -> {
                    if (p.getCompletionDate() == null || training.getValidityMonths() == null) {
                        return false;
                    }
                    LocalDate expirationDate = p.getCompletionDate().plusMonths(training.getValidityMonths());
                    return !expirationDate.isBefore(LocalDate.now()) && !expirationDate.isAfter(checkDate);
                })
                .count();
        
        // PrÃ³xima data agendada
        LocalDateTime nextScheduledDate = participations.stream()
                .filter(p -> p.getStatus() == TrainingStatus.AGENDADO && p.getParticipationDate() != null)
                .map(p -> p.getParticipationDate().atStartOfDay())
                .min(LocalDateTime::compareTo)
                .orElse(null);
        
        return SSTTrainingDTO.builder()
                .id(training.getId())
                .name(training.getName())
                .description(training.getDescription())
                .trainingType(training.getTrainingType())
                .durationHours(training.getDurationHours())
                .validityMonths(training.getValidityMonths())
                .isMandatory(training.getIsMandatory())
                .provider(training.getProvider())
                .isActive(training.getIsActive())
                .createdAt(training.getCreatedAt())
                .updatedAt(training.getUpdatedAt())
                .totalParticipants(totalParticipants)
                .scheduledParticipants(scheduledParticipants)
                .completedParticipants(completedParticipants)
                .certificatesExpiring(certificatesExpiring)
                .nextScheduledDate(nextScheduledDate)
                .build();
    }
}

