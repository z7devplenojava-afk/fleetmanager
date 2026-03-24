package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.RondaPrioridade;
import com.z7design.fleet_manager.model.enums.RondaStatus;
import com.z7design.fleet_manager.model.enums.RondaTipo;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RondaService {
    
    private final RondaRepository rondaRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final UserRepository userRepository;
    
    public Page<RondaDTO> findAll(Pageable pageable) {
        log.info("Buscando todas as rondas com paginaÃ§Ã£o");
        try {
            Page<Ronda> rondas = rondaRepository.findAllWithRelationships(pageable);
            log.info("âœ… Rondas encontradas: {} registros", rondas.getTotalElements());
            return rondas.map(this::convertToDTO);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar todas as rondas", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
                log.error("âŒ Stack trace completo:", e);
            }
            throw e;
        }
    }
    
    public RondaDTO findById(UUID id) {
        log.info("Buscando ronda por ID: {}", id);
        Ronda ronda = rondaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ronda nÃ£o encontrada com ID: " + id));
        return convertToDTO(ronda);
    }
    
    public Page<RondaDTO> search(
            RondaStatus status,
            RondaTipo tipo,
            RondaPrioridade prioridade,
            UUID responsavelId,
            UUID localId,
            LocalDateTime dataInicio,
            LocalDateTime dataFim,
            String searchTerm,
            Pageable pageable) {
        log.info("Buscando rondas com filtros - status: {}, tipo: {}, prioridade: {}, searchTerm: {}", 
                status, tipo, prioridade, searchTerm);
        try {
            // Normalizar searchTerm - tratar string vazia como null
            String normalizedSearchTerm = (searchTerm != null && searchTerm.trim().isEmpty()) ? null : searchTerm;
            
            // Se nÃ£o hÃ¡ filtros, usar findAll para evitar problemas com a query complexa
            boolean hasFilters = status != null || tipo != null || prioridade != null || 
                               responsavelId != null || localId != null || 
                               dataInicio != null || dataFim != null || normalizedSearchTerm != null;
            
            Page<Ronda> rondas;
            if (!hasFilters) {
                log.info("Sem filtros, usando findAllWithRelationships");
                rondas = rondaRepository.findAllWithRelationships(pageable);
            } else {
                // Converter enums para String para a query nativa
                String statusStr = status != null ? status.name() : null;
                String tipoStr = tipo != null ? tipo.name() : null;
                String prioridadeStr = prioridade != null ? prioridade.name() : null;
                
                // Primeiro buscar os IDs com a query nativa
                Page<Ronda> rondasPage = rondaRepository.search(
                        statusStr, tipoStr, prioridadeStr, responsavelId, localId,
                        dataInicio, dataFim, normalizedSearchTerm, pageable);
                
                // Buscar as rondas com relaÃ§Ãµes carregadas
                List<UUID> ids = rondasPage.getContent().stream()
                        .map(Ronda::getId)
                        .toList();
                
                List<Ronda> rondasWithRelations = ids.isEmpty() 
                        ? new ArrayList<>() 
                        : rondaRepository.findAllByIdsWithRelationships(ids);
                
                // Criar um mapa para acesso rÃ¡pido
                Map<UUID, Ronda> rondaMap = rondasWithRelations.stream()
                        .collect(Collectors.toMap(Ronda::getId, r -> r));
                
                // Substituir as rondas na pÃ¡gina com as que tÃªm relaÃ§Ãµes carregadas
                List<Ronda> contentWithRelations = rondasPage.getContent().stream()
                        .map(r -> rondaMap.getOrDefault(r.getId(), r))
                        .toList();
                
                // Criar nova pÃ¡gina com as relaÃ§Ãµes carregadas
                rondas = new PageImpl<>(
                        contentWithRelations, 
                        rondasPage.getPageable(), 
                        rondasPage.getTotalElements());
            }
            
            log.info("âœ… Rondas encontradas no repository: {} registros", rondas.getTotalElements());
            
            // Converter para DTO
            return rondas.map(this::convertToDTO);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar rondas no repository", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
                log.error("âŒ Tipo da causa: {}", e.getCause().getClass().getName());
            }
            throw e;
        }
    }
    
    @Transactional
    public RondaDTO create(CreateRondaDTO dto, String currentUserIdentifier) {
        log.info("Criando nova ronda: {}", dto.getNome());
        
        Employee responsavel = employeeRepository.findById(dto.getResponsavelId())
                .orElseThrow(() -> new RuntimeException("ResponsÃ¡vel nÃ£o encontrado"));
        
        Employee supervisor = dto.getSupervisorId() != null
                ? employeeRepository.findById(dto.getSupervisorId())
                        .orElseThrow(() -> new RuntimeException("Supervisor nÃ£o encontrado"))
                : null;
        
        WorkPost local = workPostRepository.findById(dto.getLocalId())
                .orElseThrow(() -> new RuntimeException("Local nÃ£o encontrado"));
        
        User createdBy = userRepository.findByUsername(currentUserIdentifier)
                .orElseGet(() -> userRepository.findByEmail(currentUserIdentifier)
                        .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado: " + currentUserIdentifier)));
        
        Ronda ronda = Ronda.builder()
                .nome(dto.getNome())
                .descricao(dto.getDescricao())
                .tipo(dto.getTipo() != null ? dto.getTipo() : RondaTipo.PREVENTIVA)
                .prioridade(dto.getPrioridade() != null ? dto.getPrioridade() : RondaPrioridade.MEDIA)
                .status(RondaStatus.AGENDADA)
                .dataInicio(dto.getDataInicio())
                .dataFim(dto.getDataFim())
                .duracaoEstimada(dto.getDuracaoEstimada())
                .responsavel(responsavel)
                .supervisor(supervisor)
                .local(local)
                .endereco(dto.getEndereco())
                .observacoes(dto.getObservacoes())
                .createdBy(createdBy)
                .build();
        
        Ronda saved = rondaRepository.save(ronda);
        log.info("Ronda criada com sucesso: {}", saved.getId());
        
        return convertToDTO(saved);
    }
    
    @Transactional
    public RondaDTO update(UUID id, CreateRondaDTO dto, String currentUserIdentifier) {
        log.info("Atualizando ronda: {}", id);
        
        Ronda ronda = rondaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ronda nÃ£o encontrada"));
        
        if (dto.getNome() != null) ronda.setNome(dto.getNome());
        if (dto.getDescricao() != null) ronda.setDescricao(dto.getDescricao());
        if (dto.getTipo() != null) ronda.setTipo(dto.getTipo());
        if (dto.getPrioridade() != null) ronda.setPrioridade(dto.getPrioridade());
        if (dto.getDataInicio() != null) ronda.setDataInicio(dto.getDataInicio());
        if (dto.getDataFim() != null) ronda.setDataFim(dto.getDataFim());
        if (dto.getDuracaoEstimada() != null) ronda.setDuracaoEstimada(dto.getDuracaoEstimada());
        if (dto.getEndereco() != null) ronda.setEndereco(dto.getEndereco());
        if (dto.getObservacoes() != null) ronda.setObservacoes(dto.getObservacoes());
        
        if (dto.getResponsavelId() != null) {
            Employee responsavel = employeeRepository.findById(dto.getResponsavelId())
                    .orElseThrow(() -> new RuntimeException("ResponsÃ¡vel nÃ£o encontrado"));
            ronda.setResponsavel(responsavel);
        }
        
        if (dto.getSupervisorId() != null) {
            Employee supervisor = employeeRepository.findById(dto.getSupervisorId())
                    .orElseThrow(() -> new RuntimeException("Supervisor nÃ£o encontrado"));
            ronda.setSupervisor(supervisor);
        }
        
        if (dto.getLocalId() != null) {
            WorkPost local = workPostRepository.findById(dto.getLocalId())
                    .orElseThrow(() -> new RuntimeException("Local nÃ£o encontrado"));
            ronda.setLocal(local);
        }
        
        User updatedBy = userRepository.findByUsername(currentUserIdentifier)
                .orElseGet(() -> userRepository.findByEmail(currentUserIdentifier)
                        .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado: " + currentUserIdentifier)));
        ronda.setUpdatedBy(updatedBy);
        
        Ronda saved = rondaRepository.save(ronda);
        log.info("Ronda atualizada com sucesso: {}", saved.getId());
        
        return convertToDTO(saved);
    }
    
    @Transactional
    public void delete(UUID id) {
        log.info("Excluindo ronda: {}", id);
        if (!rondaRepository.existsById(id)) {
            throw new RuntimeException("Ronda nÃ£o encontrada");
        }
        rondaRepository.deleteById(id);
        log.info("Ronda excluÃ­da com sucesso: {}", id);
    }
    
    @Transactional
    public RondaDTO iniciar(UUID id) {
        log.info("Iniciando ronda: {}", id);
        Ronda ronda = rondaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ronda nÃ£o encontrada"));
        
        if (ronda.getStatus() != RondaStatus.AGENDADA) {
            throw new RuntimeException("Apenas rondas agendadas podem ser iniciadas");
        }
        
        ronda.setStatus(RondaStatus.EM_ANDAMENTO);
        Ronda saved = rondaRepository.save(ronda);
        log.info("Ronda iniciada com sucesso: {}", saved.getId());
        
        return convertToDTO(saved);
    }
    
    @Transactional
    public RondaDTO concluir(UUID id, String observacoes) {
        log.info("Concluindo ronda: {}", id);
        Ronda ronda = rondaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ronda nÃ£o encontrada"));
        
        if (ronda.getStatus() != RondaStatus.EM_ANDAMENTO) {
            throw new RuntimeException("Apenas rondas em andamento podem ser concluÃ­das");
        }
        
        ronda.setStatus(RondaStatus.CONCLUIDA);
        if (observacoes != null) {
            ronda.setObservacoes(observacoes);
        }
        
        // Calcular duraÃ§Ã£o real
        if (ronda.getDataInicio() != null) {
            long minutes = ChronoUnit.MINUTES.between(ronda.getDataInicio(), LocalDateTime.now());
            ronda.setDuracaoReal((int) minutes);
        }
        
        Ronda saved = rondaRepository.save(ronda);
        log.info("Ronda concluÃ­da com sucesso: {}", saved.getId());
        
        return convertToDTO(saved);
    }
    
    @Transactional
    public RondaDTO cancelar(UUID id, String motivo) {
        log.info("Cancelando ronda: {}", id);
        Ronda ronda = rondaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ronda nÃ£o encontrada"));
        
        if (!List.of(RondaStatus.AGENDADA, RondaStatus.EM_ANDAMENTO).contains(ronda.getStatus())) {
            throw new RuntimeException("Apenas rondas agendadas ou em andamento podem ser canceladas");
        }
        
        ronda.setStatus(RondaStatus.CANCELADA);
        if (motivo != null) {
            ronda.setObservacoes(motivo);
        }
        
        Ronda saved = rondaRepository.save(ronda);
        log.info("Ronda cancelada com sucesso: {}", saved.getId());
        
        return convertToDTO(saved);
    }
    
    public RondaStatsDTO getStats() {
        log.info("Calculando estatÃ­sticas de rondas");
        
        long total = rondaRepository.count();
        long agendadas = rondaRepository.countByStatus(RondaStatus.AGENDADA);
        long emAndamento = rondaRepository.countByStatus(RondaStatus.EM_ANDAMENTO);
        long concluidas = rondaRepository.countByStatus(RondaStatus.CONCLUIDA);
        long canceladas = rondaRepository.countByStatus(RondaStatus.CANCELADA);
        long atrasadas = rondaRepository.countByStatus(RondaStatus.ATRASADA);
        
        double percentualConclusao = total > 0 ? (concluidas * 100.0 / total) : 0.0;
        
        // Calcular tempo mÃ©dio de conclusÃ£o
        List<Ronda> rondasConcluidas = rondaRepository.findAll().stream()
                .filter(r -> r.getStatus() == RondaStatus.CONCLUIDA && r.getDuracaoReal() != null)
                .toList();
        
        double tempoMedioConclusao = rondasConcluidas.stream()
                .mapToInt(Ronda::getDuracaoReal)
                .average()
                .orElse(0.0);
        
        long rondasHoje = rondaRepository.countTodayRondas();
        
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime endOfWeek = LocalDateTime.now();
        long rondasSemana = rondaRepository.countWeekRondas(startOfWeek, endOfWeek);
        
        return RondaStatsDTO.builder()
                .total(total)
                .agendadas(agendadas)
                .emAndamento(emAndamento)
                .concluidas(concluidas)
                .canceladas(canceladas)
                .atrasadas(atrasadas)
                .percentualConclusao(percentualConclusao)
                .tempoMedioConclusao(tempoMedioConclusao)
                .rondasHoje(rondasHoje)
                .rondasSemana(rondasSemana)
                .build();
    }
    
    public List<RondaDTO> getRondasRelatorio(
            RondaStatus status,
            RondaTipo tipo,
            UUID responsavelId,
            UUID localId,
            LocalDateTime dataInicio,
            LocalDateTime dataFim) {
        log.info("Gerando relatÃ³rio de rondas com filtros");
        try {
            Pageable pageable = Pageable.unpaged();
            // Converter enums para String para a query nativa
            String statusStr = status != null ? status.name() : null;
            String tipoStr = tipo != null ? tipo.name() : null;
            
            Page<Ronda> rondas = rondaRepository.search(
                    statusStr, tipoStr, null, responsavelId, localId,
                    dataInicio, dataFim, null, pageable);
            log.info("âœ… Rondas encontradas para relatÃ³rio: {} registros", rondas.getTotalElements());
            return rondas.getContent().stream()
                    .map(this::convertToDTO)
                    .toList();
        } catch (Exception e) {
            log.error("âŒ Erro ao gerar relatÃ³rio de rondas", e);
            throw e;
        }
    }
    
    private RondaDTO convertToDTO(Ronda ronda) {
        try {
            if (ronda == null) {
                log.error("âŒ Tentativa de converter Ronda nula para DTO");
                throw new IllegalArgumentException("Ronda nÃ£o pode ser nula");
            }
            
            // Acessar as relaÃ§Ãµes de forma segura
            Employee responsavel = null;
            Employee supervisor = null;
            WorkPost local = null;
            User createdBy = null;
            
            try {
                responsavel = ronda.getResponsavel();
                if (responsavel != null) {
                    // ForÃ§ar inicializaÃ§Ã£o se necessÃ¡rio
                    responsavel.getName();
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao acessar responsÃ¡vel da ronda {}: {}", ronda.getId(), e.getMessage());
            }
            
            try {
                supervisor = ronda.getSupervisor();
                if (supervisor != null) {
                    supervisor.getName();
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao acessar supervisor da ronda {}: {}", ronda.getId(), e.getMessage());
            }
            
            try {
                local = ronda.getLocal();
                if (local != null) {
                    local.getName();
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao acessar local da ronda {}: {}", ronda.getId(), e.getMessage());
            }
            
            try {
                createdBy = ronda.getCreatedBy();
                if (createdBy != null) {
                    createdBy.getName();
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao acessar createdBy da ronda {}: {}", ronda.getId(), e.getMessage());
            }
            
            return RondaDTO.builder()
                    .id(ronda.getId())
                    .nome(ronda.getNome() != null ? ronda.getNome() : "")
                    .descricao(ronda.getDescricao())
                    .tipo(ronda.getTipo())
                    .prioridade(ronda.getPrioridade())
                    .status(ronda.getStatus())
                    .dataInicio(ronda.getDataInicio())
                    .dataFim(ronda.getDataFim())
                    .duracaoEstimada(ronda.getDuracaoEstimada())
                    .duracaoReal(ronda.getDuracaoReal())
                    .responsavelId(responsavel != null ? responsavel.getId() : null)
                    .responsavelNome(responsavel != null ? responsavel.getName() : "N/A")
                    .supervisorId(supervisor != null ? supervisor.getId() : null)
                    .supervisorNome(supervisor != null ? supervisor.getName() : null)
                    .localId(local != null ? local.getId() : null)
                    .localNome(local != null ? local.getName() : "N/A")
                    .endereco(ronda.getEndereco())
                    .observacoes(ronda.getObservacoes())
                    .checkpoints(new ArrayList<>()) // TODO: Implementar checkpoints
                    .equipamentos(new ArrayList<>()) // TODO: Implementar equipamentos
                    .createdAt(ronda.getCreatedAt())
                    .updatedAt(ronda.getUpdatedAt())
                    .createdBy(createdBy != null ? createdBy.getName() : null)
                    .build();
        } catch (Exception e) {
            log.error("âŒ Erro ao converter Ronda para DTO - ID: {}", ronda != null ? ronda.getId() : "null", e);
            log.error("âŒ Stack trace completo:", e);
            throw new RuntimeException("Erro ao converter Ronda para DTO: " + e.getMessage(), e);
        }
    }
}


