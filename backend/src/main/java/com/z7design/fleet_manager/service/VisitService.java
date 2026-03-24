package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateVisitDTO;
import com.z7design.fleet_manager.dto.VisitDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.VisitStatus;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VisitService {

    private final VisitRepository visitRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public Page<VisitDTO> findAll(Pageable pageable) {
        log.info("Buscando todas as visitas com paginaÃ§Ã£o");
        try {
            Page<Visit> visits = visitRepository.findAll(pageable);
            log.info("Encontradas {} visitas", visits.getTotalElements());
            
            // Converter com tratamento de erro individual para cada visita
            List<VisitDTO> dtos = visits.getContent().stream()
                    .map(visit -> {
                        try {
                            return convertToDTO(visit);
                        } catch (Exception e) {
                            log.warn("Erro ao converter visita {} para DTO, pulando: {}", visit != null ? visit.getId() : "null", e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(java.util.stream.Collectors.toList());
            
            return new PageImpl<>(dtos, pageable, visits.getTotalElements());
        } catch (Exception e) {
            log.error("Erro ao buscar visitas: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar visitas", e);
        }
    }

    public VisitDTO findById(UUID id) {
        log.info("Buscando visita por ID: {}", id);
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada com ID: " + id));
        return convertToDTO(visit);
    }

    public Page<VisitDTO> findBySupervisorId(UUID supervisorId, Pageable pageable) {
        log.info("Buscando visitas por supervisor: {}", supervisorId);
        Page<Visit> visits = visitRepository.findBySupervisorId(supervisorId, pageable);
        
        List<VisitDTO> dtos = visits.getContent().stream()
                .map(visit -> {
                    try {
                        return convertToDTO(visit);
                    } catch (Exception e) {
                        log.warn("Erro ao converter visita {} para DTO, pulando: {}", visit != null ? visit.getId() : "null", e.getMessage());
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtos, pageable, visits.getTotalElements());
    }

    public Page<VisitDTO> findByVisitDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        log.info("Buscando visitas entre {} e {}", startDate, endDate);
        Page<Visit> visits = visitRepository.findByVisitDateBetween(startDate, endDate, pageable);
        
        List<VisitDTO> dtos = visits.getContent().stream()
                .map(visit -> {
                    try {
                        return convertToDTO(visit);
                    } catch (Exception e) {
                        log.warn("Erro ao converter visita {} para DTO, pulando: {}", visit != null ? visit.getId() : "null", e.getMessage());
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtos, pageable, visits.getTotalElements());
    }

    public List<VisitDTO> findScheduledVisitsForToday() {
        log.info("Buscando visitas agendadas para hoje");
        List<Visit> visits = visitRepository.findScheduledVisitsForToday();
        return visits.stream()
                .map(visit -> {
                    try {
                        return convertToDTO(visit);
                    } catch (Exception e) {
                        log.warn("Erro ao converter visita {} para DTO, pulando: {}", visit != null ? visit.getId() : "null", e.getMessage());
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    public List<VisitDTO> findSupervisorVisitsForToday(UUID supervisorId) {
        log.info("Buscando visitas do supervisor {} para hoje", supervisorId);
        List<Visit> visits = visitRepository.findSupervisorVisitsForToday(supervisorId);
        return visits.stream()
                .map(visit -> {
                    try {
                        return convertToDTO(visit);
                    } catch (Exception e) {
                        log.warn("Erro ao converter visita {} para DTO, pulando: {}", visit != null ? visit.getId() : "null", e.getMessage());
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public VisitDTO create(CreateVisitDTO createVisitDTO, String currentUserIdentifier) {
        log.info("Criando nova visita para supervisor: {}", createVisitDTO.getSupervisorId());

        // Buscar entidades relacionadas
        Employee supervisor = employeeRepository.findById(createVisitDTO.getSupervisorId())
                .orElseThrow(() -> new RuntimeException("Supervisor nÃ£o encontrado"));

        WorkPost workPost = workPostRepository.findById(createVisitDTO.getWorkPostId())
                .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));

        Client client = clientRepository.findById(createVisitDTO.getClientId())
                .orElseThrow(() -> new RuntimeException("Cliente nÃ£o encontrado"));

        // Tentar buscar usuÃ¡rio por username primeiro, depois por email
        User createdBy = userRepository.findByUsername(currentUserIdentifier)
                .orElseGet(() -> userRepository.findByEmail(currentUserIdentifier)
                        .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado: " + currentUserIdentifier)));

        try {
            // Criar visita
            Visit visit = Visit.builder()
                    .supervisor(supervisor)
                    .workPost(workPost)
                    .client(client)
                    .visitDate(createVisitDTO.getVisitDate())
                    .visitTime(createVisitDTO.getVisitTime())
                    .description(createVisitDTO.getDescription())
                    .observations(createVisitDTO.getObservations())
                    .status(createVisitDTO.getStatus() != null ? createVisitDTO.getStatus() : VisitStatus.SCHEDULED)
                    .cancellationReason(createVisitDTO.getCancellationReason())
                    // .presentEmployees(...) // Removido
                    // .attachedFiles(...) // Removido
                    // .photos(...) // Removido
                    // .latitude(...) // Removido
                    // .longitude(...) // Removido
                    // .locationAddress(...) // Removido
                    // .qrCodeScanned(...) // Removido
                    // .qrCodeVerified(...) // Removido
                    .createdBy(createdBy)
                    .build();

            log.debug("Visit entity criada: status={}, cancellationReason={}", visit.getStatus(), visit.getCancellationReason());

            Visit savedVisit = visitRepository.save(visit);
            log.info("Visita criada com sucesso: {}", savedVisit.getId());

            return convertToDTO(savedVisit);
        } catch (Exception e) {
            log.error("Erro ao salvar visita no banco de dados: {}", e.getMessage(), e);
            log.error("Stack trace completo:", e);
            throw new RuntimeException("Erro ao salvar visita: " + e.getMessage(), e);
        }
    }

    @Transactional
    public VisitDTO update(UUID id, CreateVisitDTO updateDTO, String currentUserIdentifier) {
        log.info("Atualizando visita: {}", id);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada"));

        // Tentar buscar usuÃ¡rio por username primeiro, depois por email
        User updatedBy = userRepository.findByUsername(currentUserIdentifier)
                .orElseGet(() -> userRepository.findByEmail(currentUserIdentifier)
                        .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado: " + currentUserIdentifier)));

        // Atualizar campos
        if (updateDTO.getSupervisorId() != null) {
            Employee supervisor = employeeRepository.findById(updateDTO.getSupervisorId())
                    .orElseThrow(() -> new RuntimeException("Supervisor nÃ£o encontrado"));
            visit.setSupervisor(supervisor);
        }

        if (updateDTO.getWorkPostId() != null) {
            WorkPost workPost = workPostRepository.findById(updateDTO.getWorkPostId())
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));
            visit.setWorkPost(workPost);
        }

        if (updateDTO.getClientId() != null) {
            Client client = clientRepository.findById(updateDTO.getClientId())
                    .orElseThrow(() -> new RuntimeException("Cliente nÃ£o encontrado"));
            visit.setClient(client);
        }

        if (updateDTO.getVisitDate() != null) {
            visit.setVisitDate(updateDTO.getVisitDate());
        }

        if (updateDTO.getVisitTime() != null) {
            visit.setVisitTime(updateDTO.getVisitTime());
        }

        if (updateDTO.getDescription() != null) {
            visit.setDescription(updateDTO.getDescription());
        }

        if (updateDTO.getObservations() != null) {
            visit.setObservations(updateDTO.getObservations());
        }

        if (updateDTO.getStatus() != null) {
            visit.setStatus(updateDTO.getStatus());
        }

        if (updateDTO.getCancellationReason() != null) {
            visit.setCancellationReason(updateDTO.getCancellationReason());
        }

        // Campos removidos temporariamente - Visit.java refatorado
        // if (updateDTO.getPresentEmployees() != null) {
        //     visit.setPresentEmployees(updateDTO.getPresentEmployees());
        // }
        // if (updateDTO.getAttachedFiles() != null) {
        //     visit.setAttachedFiles(updateDTO.getAttachedFiles());
        // }
        // if (updateDTO.getPhotos() != null) {
        //     visit.setPhotos(updateDTO.getPhotos());
        // }
        // if (updateDTO.getLatitude() != null) {
        //     visit.setLatitude(updateDTO.getLatitude());
        // }
        // if (updateDTO.getLongitude() != null) {
        //     visit.setLongitude(updateDTO.getLongitude());
        // }
        // if (updateDTO.getLocationAddress() != null) {
        //     visit.setLocationAddress(updateDTO.getLocationAddress());
        // }
        // if (updateDTO.getQrCodeScanned() != null) {
        //     visit.setQrCodeScanned(updateDTO.getQrCodeScanned());
        // }
        // if (updateDTO.getQrCodeVerified() != null) {
        //     visit.setQrCodeVerified(updateDTO.getQrCodeVerified());
        // }

        visit.setUpdatedBy(updatedBy);

        Visit savedVisit = visitRepository.save(visit);
        log.info("Visita atualizada com sucesso: {}", savedVisit.getId());

        return convertToDTO(savedVisit);
    }

    @Transactional
    public void delete(UUID id) {
        log.info("Excluindo visita: {}", id);
        
        if (!visitRepository.existsById(id)) {
            throw new RuntimeException("Visita nÃ£o encontrada");
        }

        visitRepository.deleteById(id);
        log.info("Visita excluÃ­da com sucesso: {}", id);
    }

    // MÃ©todos de upload desabilitados temporariamente - campos removidos do Visit.java
    /*
    @Transactional
    public String uploadFile(UUID visitId, MultipartFile file) {
        log.info("Fazendo upload de arquivo para visita: {}", visitId);
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada"));
        String fileName = fileStorageService.storeFile(file);
        // visit.setAttachedFiles(...) // Campo removido
        visitRepository.save(visit);
        log.info("Arquivo uploadado com sucesso: {}", fileName);
        return fileName;
    }

    @Transactional
    public String uploadPhoto(UUID visitId, MultipartFile photo) {
        log.info("Fazendo upload de foto para visita: {}", visitId);
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visita nÃ£o encontrada"));
        String fileName = fileStorageService.storeFile(photo);
        // visit.setPhotos(...) // Campo removido
        visitRepository.save(visit);
        log.info("Foto uploadada com sucesso: {}", fileName);
        return fileName;
    }
    */

    private VisitDTO convertToDTO(Visit visit) {
        if (visit == null) {
            return null;
        }
        
        VisitDTO.VisitDTOBuilder builder = VisitDTO.builder()
                .id(visit.getId())
                .visitDate(visit.getVisitDate())
                .visitTime(visit.getVisitTime())
                .description(visit.getDescription())
                .observations(visit.getObservations())
                .status(visit.getStatus())
                .cancellationReason(visit.getCancellationReason())
                .latitude(visit.getLatitude())
                .longitude(visit.getLongitude())
                .locationAddress(visit.getLocationAddress())
                .qrCodeScanned(visit.getQrCodeScanned())
                .qrCodeVerified(visit.getQrCodeVerified())
                .presentEmployees(java.util.Collections.emptyList()) // Lista vazia por enquanto
                .attachedFiles(java.util.Collections.emptyList()) // Lista vazia por enquanto
                .photos(java.util.Collections.emptyList()) // Lista vazia por enquanto
                .createdAt(visit.getCreatedAt())
                .updatedAt(visit.getUpdatedAt());
        
        // Tratar relacionamentos de forma segura
        try {
            if (visit.getSupervisor() != null) {
                try {
                    builder.supervisorId(visit.getSupervisor().getId());
                    builder.supervisorName(visit.getSupervisor().getName());
                } catch (Exception e) {
                    log.warn("Erro ao acessar supervisor da visita {}: {}", visit.getId(), e.getMessage());
                    builder.supervisorName("N/A");
                }
            } else {
                builder.supervisorName("N/A");
            }
        } catch (Exception e) {
            log.warn("Erro ao processar supervisor da visita {}: {}", visit.getId(), e.getMessage());
            builder.supervisorName("N/A");
        }
        
        try {
            if (visit.getWorkPost() != null) {
                try {
                    builder.workPostId(visit.getWorkPost().getId());
                    builder.workPostName(visit.getWorkPost().getName());
                } catch (Exception e) {
                    log.warn("Erro ao acessar posto de trabalho da visita {}: {}", visit.getId(), e.getMessage());
                    builder.workPostName("N/A");
                }
            } else {
                builder.workPostName("N/A");
            }
        } catch (Exception e) {
            log.warn("Erro ao processar posto de trabalho da visita {}: {}", visit.getId(), e.getMessage());
            builder.workPostName("N/A");
        }
        
        try {
            if (visit.getClient() != null) {
                try {
                    builder.clientId(visit.getClient().getId());
                    builder.clientName(visit.getClient().getName());
                } catch (Exception e) {
                    log.warn("Erro ao acessar cliente da visita {}: {}", visit.getId(), e.getMessage());
                    builder.clientName("N/A");
                }
            } else {
                builder.clientName("N/A");
            }
        } catch (Exception e) {
            log.warn("Erro ao processar cliente da visita {}: {}", visit.getId(), e.getMessage());
            builder.clientName("N/A");
        }
        
        try {
            if (visit.getVisitSchedule() != null) {
                try {
                    builder.visitScheduleId(visit.getVisitSchedule().getId());
                } catch (Exception e) {
                    log.warn("Erro ao acessar agendamento da visita {}: {}", visit.getId(), e.getMessage());
                    // NÃ£o definir visitScheduleId em caso de erro
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao processar agendamento da visita {}: {}", visit.getId(), e.getMessage());
            // NÃ£o definir visitScheduleId em caso de erro
        }
        
        try {
            if (visit.getCreatedBy() != null) {
                try {
                    builder.createdByName(visit.getCreatedBy().getName());
                } catch (Exception e) {
                    log.warn("Erro ao acessar criador da visita {}: {}", visit.getId(), e.getMessage());
                    // NÃ£o definir createdByName em caso de erro
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao processar criador da visita {}: {}", visit.getId(), e.getMessage());
            // NÃ£o definir createdByName em caso de erro
        }
        
        try {
            if (visit.getUpdatedBy() != null) {
                try {
                    builder.updatedByName(visit.getUpdatedBy().getName());
                } catch (Exception e) {
                    log.warn("Erro ao acessar atualizador da visita {}: {}", visit.getId(), e.getMessage());
                    // NÃ£o definir updatedByName em caso de erro
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao processar atualizador da visita {}: {}", visit.getId(), e.getMessage());
            // NÃ£o definir updatedByName em caso de erro
        }
        
        return builder.build();
    }

    public List<String> getPresentEmployeeNames(List<UUID> employeeIds) {
        if (employeeIds == null || employeeIds.isEmpty()) {
            return List.of();
        }
        
        return employeeRepository.findAllById(employeeIds)
                .stream()
                .map(Employee::getName)
                .collect(Collectors.toList());
    }
}
