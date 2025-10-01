package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.JobCandidateDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.JobCandidate;
import br.com.fleetmanager.model.JobVacancy;
import br.com.fleetmanager.model.enums.CandidateStatus;
import br.com.fleetmanager.repository.JobCandidateRepository;
import br.com.fleetmanager.repository.JobVacancyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobCandidateService {
    
    @Autowired
    private JobCandidateRepository jobCandidateRepository;
    
    @Autowired
    private JobVacancyRepository jobVacancyRepository;
    
    private final Path uploadPath = Paths.get("uploads/cv");
    
    public JobCandidateService() {
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível criar o diretório de uploads", e);
        }
    }
    
    // Buscar todos os candidatos
    public List<JobCandidateDTO> getAllCandidates() {
        return jobCandidateRepository.findRecentCandidates().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Buscar candidatos por vaga
    public List<JobCandidateDTO> getCandidatesByVacancy(UUID vacancyId) {
        return jobCandidateRepository.findByJobVacancyIdOrderByCreatedAtDesc(vacancyId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Buscar candidatos por status
    public List<JobCandidateDTO> getCandidatesByStatus(CandidateStatus status) {
        return jobCandidateRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Buscar candidato por ID
    public JobCandidateDTO getCandidateById(UUID id) {
        JobCandidate candidate = jobCandidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));
        return convertToDTO(candidate);
    }
    
    // Criar novo candidato
    public JobCandidateDTO createCandidate(JobCandidateDTO candidateDTO, MultipartFile curriculumFile) {
        // Verificar se a vaga existe
        JobVacancy vacancy = jobVacancyRepository.findById(candidateDTO.getJobVacancyId())
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + candidateDTO.getJobVacancyId()));
        
        JobCandidate candidate = convertToEntity(candidateDTO);
        candidate.setJobVacancy(vacancy);
        candidate.setStatus(CandidateStatus.PENDING);
        
        // Processar upload do currículo
        if (curriculumFile != null && !curriculumFile.isEmpty()) {
            String fileName = processCurriculumUpload(curriculumFile);
            candidate.setCurriculumFileName(fileName);
            candidate.setCurriculumFilePath(uploadPath.resolve(fileName).toString());
            candidate.setCurriculumFileSize(curriculumFile.getSize());
        }
        
        JobCandidate savedCandidate = jobCandidateRepository.save(candidate);
        
        // Incrementar número de candidaturas na vaga
        vacancy.setApplications(vacancy.getApplications() + 1);
        jobVacancyRepository.save(vacancy);
        
        return convertToDTO(savedCandidate);
    }
    
    // Atualizar candidato
    public JobCandidateDTO updateCandidate(UUID id, JobCandidateDTO candidateDTO) {
        JobCandidate existingCandidate = jobCandidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));
        
        // Atualizar campos
        existingCandidate.setName(candidateDTO.getName());
        existingCandidate.setEmail(candidateDTO.getEmail());
        existingCandidate.setPhone(candidateDTO.getPhone());
        existingCandidate.setCpf(candidateDTO.getCpf());
        existingCandidate.setAddress(candidateDTO.getAddress());
        existingCandidate.setCity(candidateDTO.getCity());
        existingCandidate.setState(candidateDTO.getState());
        existingCandidate.setEducationLevel(candidateDTO.getEducationLevel());
        existingCandidate.setExperienceYears(candidateDTO.getExperienceYears());
        existingCandidate.setCurrentPosition(candidateDTO.getCurrentPosition());
        existingCandidate.setCurrentCompany(candidateDTO.getCurrentCompany());
        existingCandidate.setExpectedSalary(candidateDTO.getExpectedSalary());
        existingCandidate.setAvailability(candidateDTO.getAvailability());
        existingCandidate.setNotes(candidateDTO.getNotes());
        
        if (candidateDTO.getStatus() != null) {
            existingCandidate.setStatus(candidateDTO.getStatus());
        }
        
        JobCandidate updatedCandidate = jobCandidateRepository.save(existingCandidate);
        return convertToDTO(updatedCandidate);
    }
    
    // Atualizar status do candidato
    public JobCandidateDTO updateCandidateStatus(UUID id, CandidateStatus status, String notes) {
        JobCandidate candidate = jobCandidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));
        
        candidate.setStatus(status);
        if (notes != null && !notes.trim().isEmpty()) {
            candidate.setNotes(notes);
        }
        
        JobCandidate updatedCandidate = jobCandidateRepository.save(candidate);
        return convertToDTO(updatedCandidate);
    }
    
    // Excluir candidato
    public void deleteCandidate(UUID id) {
        JobCandidate candidate = jobCandidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));
        
        // Deletar arquivo do currículo se existir
        if (candidate.getCurriculumFilePath() != null) {
            try {
                Path filePath = Paths.get(candidate.getCurriculumFilePath());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log do erro mas não falhar a operação
                System.err.println("Erro ao deletar arquivo: " + e.getMessage());
            }
        }
        
        jobCandidateRepository.deleteById(id);
    }
    
    // Download do currículo
    public Resource downloadCurriculum(UUID id) {
        JobCandidate candidate = jobCandidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));
        
        if (candidate.getCurriculumFilePath() == null) {
            throw new ResourceNotFoundException("Currículo não encontrado para este candidato");
        }
        
        try {
            Path filePath = Paths.get(candidate.getCurriculumFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Arquivo não encontrado: " + candidate.getCurriculumFileName());
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Erro ao acessar arquivo: " + candidate.getCurriculumFileName());
        }
    }
    
    // Estatísticas de candidatos
    public long getCandidatesCount() {
        return jobCandidateRepository.count();
    }
    
    public long getCandidatesCountByStatus(CandidateStatus status) {
        return jobCandidateRepository.countByStatus(status);
    }
    
    public long getCandidatesCountByVacancy(UUID vacancyId) {
        return jobCandidateRepository.countByJobVacancyId(vacancyId);
    }
    
    // Processar upload do currículo
    private String processCurriculumUpload(MultipartFile file) {
        // Validar tipo de arquivo
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Nome do arquivo não pode ser nulo");
        }
        
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!fileExtension.equals(".pdf") && !fileExtension.equals(".doc") && !fileExtension.equals(".docx")) {
            throw new IllegalArgumentException("Apenas arquivos PDF e Word são aceitos");
        }
        
        // Validar tamanho (2MB = 2 * 1024 * 1024 bytes)
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new IllegalArgumentException("Arquivo muito grande. Tamanho máximo: 2MB");
        }
        
        // Gerar nome único para o arquivo
        String fileName = UUID.randomUUID().toString() + fileExtension;
        
        try {
            Path targetPath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo: " + e.getMessage());
        }
    }
    
    // Conversão de Entity para DTO
    private JobCandidateDTO convertToDTO(JobCandidate candidate) {
        return new JobCandidateDTO(
            candidate.getId(),
            candidate.getJobVacancy().getId(),
            candidate.getJobVacancy().getTitle(),
            candidate.getName(),
            candidate.getEmail(),
            candidate.getPhone(),
            candidate.getCpf(),
            candidate.getAddress(),
            candidate.getCity(),
            candidate.getState(),
            candidate.getEducationLevel(),
            candidate.getExperienceYears(),
            candidate.getCurrentPosition(),
            candidate.getCurrentCompany(),
            candidate.getExpectedSalary(),
            candidate.getAvailability(),
            candidate.getCurriculumFileName(),
            candidate.getCurriculumFilePath(),
            candidate.getCurriculumFileSize(),
            candidate.getStatus(),
            candidate.getNotes(),
            candidate.getCreatedAt(),
            candidate.getUpdatedAt(),
            candidate.getRequiresCnh(),
            candidate.getCnhCategory(),
            candidate.getCurriculumUrl() != null ? candidate.getCurriculumUrl() : (candidate.getCurriculumFileName() != null ? "/uploads/cv/" + candidate.getCurriculumFileName() : null)
        );
    }
    
    // Conversão de DTO para Entity
    private JobCandidate convertToEntity(JobCandidateDTO dto) {
        JobCandidate candidate = new JobCandidate();
        candidate.setName(dto.getName());
        candidate.setEmail(dto.getEmail());
        candidate.setPhone(dto.getPhone());
        candidate.setCpf(dto.getCpf());
        candidate.setAddress(dto.getAddress());
        candidate.setCity(dto.getCity());
        candidate.setState(dto.getState());
        candidate.setEducationLevel(dto.getEducationLevel());
        candidate.setExperienceYears(dto.getExperienceYears());
        candidate.setCurrentPosition(dto.getCurrentPosition());
        candidate.setCurrentCompany(dto.getCurrentCompany());
        candidate.setExpectedSalary(dto.getExpectedSalary());
        candidate.setAvailability(dto.getAvailability());
        candidate.setNotes(dto.getNotes());
        candidate.setRequiresCnh(dto.getRequiresCnh());
        candidate.setCnhCategory(dto.getCnhCategory());
        candidate.setCurriculumUrl(dto.getCurriculumUrl());
        if (dto.getStatus() != null) {
            candidate.setStatus(dto.getStatus());
        }
        return candidate;
    }
    
    // Verificar se já existe candidato com mesmo CPF ou email
    public boolean existsByCpfOrEmail(String cpf, String email) {
        return !jobCandidateRepository.findByCpf(cpf).isEmpty() || 
               !jobCandidateRepository.findByEmail(email).isEmpty();
    }
} 