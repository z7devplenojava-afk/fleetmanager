package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.JobVacancyDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.JobVacancy;
import com.z7design.fleet_manager.model.enums.VacancyStatus;
import com.z7design.fleet_manager.repository.JobVacancyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobVacancyService {
    
    @Autowired
    private JobVacancyRepository jobVacancyRepository;
    
    // Buscar todas as vagas
    public List<JobVacancyDTO> getAllJobVacancies() {
        return jobVacancyRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Buscar vagas com filtros
    public List<JobVacancyDTO> getJobVacanciesWithFilters(String status, String position, String location) {
        List<JobVacancy> vacancies;
        
        if (status != null && !status.isEmpty()) {
            VacancyStatus vacancyStatus = VacancyStatus.valueOf(status.toUpperCase());
            if (position != null && !position.isEmpty()) {
                vacancies = jobVacancyRepository.findByStatusAndPositionContainingIgnoreCase(vacancyStatus, position);
            } else if (location != null && !location.isEmpty()) {
                vacancies = jobVacancyRepository.findByStatusAndLocationContainingIgnoreCase(vacancyStatus, location);
            } else {
                vacancies = jobVacancyRepository.findByStatus(vacancyStatus);
            }
        } else if (position != null && !position.isEmpty()) {
            vacancies = jobVacancyRepository.findByPositionContainingIgnoreCase(position);
        } else if (location != null && !location.isEmpty()) {
            vacancies = jobVacancyRepository.findByLocationContainingIgnoreCase(location);
        } else {
            vacancies = jobVacancyRepository.findAll();
        }
        
        return vacancies.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Buscar vagas pÃºblicas (abertas)
    public List<JobVacancyDTO> getPublicJobVacancies() {
        List<JobVacancy> vacancies = jobVacancyRepository.findByStatusOrderByCreatedAtDesc(VacancyStatus.OPEN);
        return vacancies.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Buscar vaga por ID
    public JobVacancyDTO getJobVacancyById(UUID id) {
        JobVacancy vacancy = jobVacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga nÃ£o encontrada com ID: " + id));
        return convertToDTO(vacancy);
    }
    
    // Criar nova vaga
    public JobVacancyDTO createJobVacancy(JobVacancyDTO vacancyDTO) {
        // Verificar se jÃ¡ existe uma vaga com o mesmo tÃ­tulo
        List<JobVacancy> existingVacancies = jobVacancyRepository.findByTitleContainingIgnoreCase(vacancyDTO.getTitle());
        if (!existingVacancies.isEmpty()) {
            throw new IllegalArgumentException("JÃ¡ existe uma vaga com o tÃ­tulo: " + vacancyDTO.getTitle());
        }
        
        JobVacancy vacancy = convertToEntity(vacancyDTO);
        vacancy.setStatus(VacancyStatus.OPEN);
        vacancy.setApplications(0);
        
        JobVacancy savedVacancy = jobVacancyRepository.save(vacancy);
        return convertToDTO(savedVacancy);
    }
    
    // Atualizar vaga
    public JobVacancyDTO updateJobVacancy(UUID id, JobVacancyDTO vacancyDTO) {
        JobVacancy existingVacancy = jobVacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga nÃ£o encontrada com ID: " + id));
        
        // Verificar se jÃ¡ existe outra vaga com o mesmo tÃ­tulo (ignorando a atual)
        List<JobVacancy> existingVacancies = jobVacancyRepository.findByTitleContainingIgnoreCase(vacancyDTO.getTitle());
        boolean hasDuplicate = existingVacancies.stream()
                .anyMatch(v -> !v.getId().equals(id) && v.getTitle().equalsIgnoreCase(vacancyDTO.getTitle()));
        
        if (hasDuplicate) {
            throw new IllegalArgumentException("JÃ¡ existe uma vaga com o tÃ­tulo: " + vacancyDTO.getTitle());
        }
        
        // Atualizar campos
        existingVacancy.setTitle(vacancyDTO.getTitle());
        existingVacancy.setPosition(vacancyDTO.getPosition());
        existingVacancy.setLocation(vacancyDTO.getLocation());
        existingVacancy.setRequirements(vacancyDTO.getRequirements());
        existingVacancy.setWorkSchedule(vacancyDTO.getWorkSchedule());
        existingVacancy.setSalary(vacancyDTO.getSalary());
        existingVacancy.setBenefits(vacancyDTO.getBenefits());
        existingVacancy.setDeadline(vacancyDTO.getDeadline());
        existingVacancy.setRequiresCnh(vacancyDTO.getRequiresCnh());
        existingVacancy.setCnhCategory(vacancyDTO.getCnhCategory());
        
        if (vacancyDTO.getStatus() != null) {
            existingVacancy.setStatus(vacancyDTO.getStatus());
        }
        
        JobVacancy updatedVacancy = jobVacancyRepository.save(existingVacancy);
        return convertToDTO(updatedVacancy);
    }
    
    // Excluir vaga
    public void deleteJobVacancy(UUID id) {
        System.out.println("ðŸ” [DEBUG] Tentando excluir vaga com ID: " + id);
        
        if (!jobVacancyRepository.existsById(id)) {
            System.out.println("âŒ [DEBUG] Vaga nÃ£o encontrada com ID: " + id);
            throw new ResourceNotFoundException("Vaga nÃ£o encontrada com ID: " + id);
        }
        
        System.out.println("âœ… [DEBUG] Vaga encontrada, procedendo com exclusÃ£o...");
        jobVacancyRepository.deleteById(id);
        System.out.println("âœ… [DEBUG] Vaga excluÃ­da com sucesso do banco de dados");
    }
    
    // Atualizar status da vaga
    public JobVacancyDTO updateVacancyStatus(UUID id, VacancyStatus status) {
        JobVacancy vacancy = jobVacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga nÃ£o encontrada com ID: " + id));
        
        vacancy.setStatus(status);
        JobVacancy updatedVacancy = jobVacancyRepository.save(vacancy);
        return convertToDTO(updatedVacancy);
    }
    
    // Incrementar nÃºmero de candidaturas
    public void incrementApplications(UUID id) {
        JobVacancy vacancy = jobVacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga nÃ£o encontrada com ID: " + id));
        
        vacancy.setApplications(vacancy.getApplications() + 1);
        jobVacancyRepository.save(vacancy);
    }
    
    // Buscar vagas vencendo em breve
    public List<JobVacancyDTO> getVacanciesExpiringSoon(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = now.plusDays(days);
        
        return jobVacancyRepository.findVacanciesExpiringSoon(now, deadline).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // EstatÃ­sticas de vagas
    public long getOpenVacanciesCount() {
        return jobVacancyRepository.countOpenVacancies(LocalDateTime.now());
    }
    
    public long getVacanciesCountByStatus(VacancyStatus status) {
        return jobVacancyRepository.countByStatus(status);
    }
    
    // ConversÃ£o de Entity para DTO
    @Transactional(readOnly = true)
    private JobVacancyDTO convertToDTO(JobVacancy vacancy) {
        // Inicializar coleÃ§Ãµes lazy dentro da transaÃ§Ã£o
        if (vacancy.getRequirements() != null) {
            vacancy.getRequirements().size(); // ForÃ§a inicializaÃ§Ã£o
        }
        if (vacancy.getBenefits() != null) {
            vacancy.getBenefits().size(); // ForÃ§a inicializaÃ§Ã£o
        }
        
        return new JobVacancyDTO(
                vacancy.getId(),
                vacancy.getTitle(),
                vacancy.getPosition(),
                vacancy.getFunction(), // ADICIONADO
                vacancy.getLocation(),
                vacancy.getRequirements(),
                vacancy.getWorkSchedule(),
                vacancy.getSalary(),
                vacancy.getBenefits(),
                vacancy.getDeadline(),
                vacancy.getStatus(),
                vacancy.getApplications(),
                vacancy.getCreatedAt(),
                vacancy.getUpdatedAt(),
                vacancy.getRequiresCnh(),
                vacancy.getCnhCategory()
        );
    }
    
    // ConversÃ£o de DTO para Entity
    private JobVacancy convertToEntity(JobVacancyDTO dto) {
        JobVacancy vacancy = new JobVacancy();
        vacancy.setTitle(dto.getTitle());
        vacancy.setPosition(dto.getPosition());
        vacancy.setFunction(dto.getFunction()); // ADICIONADO
        vacancy.setLocation(dto.getLocation());
        vacancy.setRequirements(dto.getRequirements());
        vacancy.setWorkSchedule(dto.getWorkSchedule());
        vacancy.setSalary(dto.getSalary());
        vacancy.setBenefits(dto.getBenefits());
        vacancy.setDeadline(dto.getDeadline());
        vacancy.setRequiresCnh(dto.getRequiresCnh());
        vacancy.setCnhCategory(dto.getCnhCategory());
        if (dto.getStatus() != null) {
            vacancy.setStatus(dto.getStatus());
        }
        if (dto.getApplications() != null) {
            vacancy.setApplications(dto.getApplications());
        }
        return vacancy;
    }
} 
