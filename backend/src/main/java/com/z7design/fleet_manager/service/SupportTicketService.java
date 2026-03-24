package com.z7design.fleet_manager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.AddTicketMessageRequest;
import com.z7design.fleet_manager.dto.CreateTicketRequest;
import com.z7design.fleet_manager.dto.SupportTicketDTO;
import com.z7design.fleet_manager.dto.TicketMessageDTO;
import com.z7design.fleet_manager.dto.UpdateTicketRequest;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.SupportAgent;
import com.z7design.fleet_manager.model.SupportTicket;
import com.z7design.fleet_manager.model.TicketMessage;
import com.z7design.fleet_manager.model.enums.TicketCategory;
import com.z7design.fleet_manager.model.enums.TicketPriority;
import com.z7design.fleet_manager.model.enums.TicketStatus;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.SupportAgentRepository;
import com.z7design.fleet_manager.repository.SupportTicketRepository;
import com.z7design.fleet_manager.repository.TicketMessageRepository;
import com.z7design.fleet_manager.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class SupportTicketService {
    
    @Autowired
    private SupportTicketRepository ticketRepository;
    
    @Autowired
    private SupportAgentRepository agentRepository;
    
    @Autowired
    private TicketMessageRepository messageRepository;
    
    @Autowired
    private CompanyRepository companyRepository;
    
    @Autowired
    private SupportAgentService agentService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Criar novo ticket
     */
    public SupportTicketDTO createTicket(CreateTicketRequest request) {
        log.info("Criando novo ticket: {}", request.getTitle());
        
        SupportTicket ticket = new SupportTicket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setCategory(request.getCategory());
        ticket.setStatus(TicketStatus.OPEN);
        
        // Se customerUserId for fornecido, buscar dados do usuÃ¡rio
        if (request.getCustomerUserId() != null) {
            User customer = userRepository.findById(request.getCustomerUserId())
                .orElseThrow(() -> new BusinessException("UsuÃ¡rio nÃ£o encontrado"));
            ticket.setCustomerName(customer.getName());
            ticket.setCustomerEmail(customer.getEmail());
            ticket.setCustomerPhone(customer.getPhone() != null ? customer.getPhone() : request.getCustomerPhone());
        } else {
            // Se nÃ£o fornecido, usar dados fornecidos diretamente
            if (request.getCustomerName() == null || request.getCustomerName().trim().isEmpty()) {
                throw new BusinessException("Nome do cliente Ã© obrigatÃ³rio quando nÃ£o Ã© fornecido customerUserId");
            }
            if (request.getCustomerEmail() == null || request.getCustomerEmail().trim().isEmpty()) {
                throw new BusinessException("Email do cliente Ã© obrigatÃ³rio quando nÃ£o Ã© fornecido customerUserId");
            }
            ticket.setCustomerName(request.getCustomerName());
            ticket.setCustomerEmail(request.getCustomerEmail());
            ticket.setCustomerPhone(request.getCustomerPhone());
        }
        
        // Atribuir empresa, se fornecida
        if (request.getCompanyId() != null) {
            Company company = companyRepository.findById(request.getCompanyId())
                .orElse(null);
            ticket.setCompany(company);
        }
        
        // Atribuir agente, se fornecido
        if (request.getAssignedToAgentId() != null) {
            SupportAgent agent = agentRepository.findById(request.getAssignedToAgentId())
                .orElseThrow(() -> new BusinessException("Agente nÃ£o encontrado"));
            ticket.setAssignedTo(agent);
            
            // Incrementar contador do agente
            agentService.incrementAgentTicketCount(agent.getId());
        }
        
        ticket = ticketRepository.save(ticket);
        
        // Criar mensagem inicial com a descriÃ§Ã£o
        TicketMessage initialMessage = new TicketMessage();
        initialMessage.setTicket(ticket);
        initialMessage.setContent(request.getDescription());
        initialMessage.setSenderName(ticket.getCustomerName());
        initialMessage.setSenderEmail(ticket.getCustomerEmail());
        initialMessage.setIsSupport(false);
        messageRepository.save(initialMessage);
        
        log.info("Ticket criado com sucesso: {}", ticket.getId());
        
        return SupportTicketDTO.fromEntity(ticket, true);
    }
    
    /**
     * Buscar todos os tickets
     */
    public Page<SupportTicketDTO> getAllTickets(Pageable pageable) {
        log.info("Buscando todos os tickets");
        try {
            return ticketRepository.findAll(pageable)
                .map(ticket -> SupportTicketDTO.fromEntity(ticket, false));
        } catch (Exception e) {
            log.error("Erro ao buscar todos os tickets: {}", e.getMessage(), e);
            throw new BusinessException("Erro ao buscar tickets: " + e.getMessage());
        }
    }
    
    /**
     * Buscar ticket por ID
     */
    public SupportTicketDTO getTicketById(UUID id) {
        log.info("Buscando ticket por ID: {}", id);
        SupportTicket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new BusinessException("Ticket nÃ£o encontrado"));
        return SupportTicketDTO.fromEntity(ticket, true);
    }
    
    /**
     * Buscar tickets por status
     */
    public Page<SupportTicketDTO> getTicketsByStatus(TicketStatus status, Pageable pageable) {
        log.info("Buscando tickets com status: {}", status);
        return ticketRepository.findByStatus(status, pageable)
            .map(ticket -> SupportTicketDTO.fromEntity(ticket, false));
    }
    
    /**
     * Buscar tickets por agente
     */
    public Page<SupportTicketDTO> getTicketsByAgent(UUID agentId, Pageable pageable) {
        log.info("Buscando tickets do agente: {}", agentId);
        return ticketRepository.findByAssignedToId(agentId, pageable)
            .map(ticket -> SupportTicketDTO.fromEntity(ticket, false));
    }
    
    /**
     * Buscar tickets com filtros
     */
    public Page<SupportTicketDTO> getTicketsWithFilters(
            TicketStatus status,
            TicketPriority priority,
            TicketCategory category,
            UUID agentId,
            Pageable pageable) {
        
        log.info("Buscando tickets com filtros");
        return ticketRepository.findByFilters(status, priority, category, agentId, pageable)
            .map(ticket -> SupportTicketDTO.fromEntity(ticket, false));
    }
    
    /**
     * Buscar tickets por texto
     */
    public Page<SupportTicketDTO> searchTickets(String searchTerm, Pageable pageable) {
        log.info("Buscando tickets com termo: {}", searchTerm);
        return ticketRepository.searchTickets(searchTerm, pageable)
            .map(ticket -> SupportTicketDTO.fromEntity(ticket, false));
    }
    
    /**
     * Atualizar ticket
     */
    public SupportTicketDTO updateTicket(UUID ticketId, UpdateTicketRequest request) {
        log.info("Atualizando ticket: {}", ticketId);
        
        SupportTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new BusinessException("Ticket nÃ£o encontrado"));
        
        UUID previousAgentId = ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null;
        
        if (request.getTitle() != null) {
            ticket.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            ticket.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            TicketStatus oldStatus = ticket.getStatus();
            ticket.setStatus(request.getStatus());
            
            // Se mudou para RESOLVED, incrementar contador do agente
            if (request.getStatus() == TicketStatus.RESOLVED && 
                oldStatus != TicketStatus.RESOLVED && 
                ticket.getAssignedTo() != null) {
                agentService.incrementAgentResolvedCount(ticket.getAssignedTo().getId());
            }
        }
        if (request.getCategory() != null) {
            ticket.setCategory(request.getCategory());
        }
        if (request.getCustomerPhone() != null) {
            ticket.setCustomerPhone(request.getCustomerPhone());
        }
        if (request.getAssignedToAgentId() != null) {
            SupportAgent agent = agentRepository.findById(request.getAssignedToAgentId())
                .orElseThrow(() -> new BusinessException("Agente nÃ£o encontrado"));
            ticket.setAssignedTo(agent);
            
            // Atualizar contadores se mudou de agente
            if (previousAgentId == null || !previousAgentId.equals(agent.getId())) {
                agentService.incrementAgentTicketCount(agent.getId());
            }
        }
        
        ticket = ticketRepository.save(ticket);
        
        return SupportTicketDTO.fromEntity(ticket, true);
    }
    
    /**
     * Atribuir ticket a um agente
     */
    public SupportTicketDTO assignTicketToAgent(UUID ticketId, UUID agentId) {
        log.info("Atribuindo ticket {} ao agente {}", ticketId, agentId);
        
        SupportTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new BusinessException("Ticket nÃ£o encontrado"));
        
        SupportAgent agent = agentRepository.findById(agentId)
            .orElseThrow(() -> new BusinessException("Agente nÃ£o encontrado"));
        
        UUID previousAgentId = ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null;
        
        ticket.setAssignedTo(agent);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        
        // Incrementar contador do novo agente se mudou
        if (previousAgentId == null || !previousAgentId.equals(agentId)) {
            agentService.incrementAgentTicketCount(agentId);
        }
        
        ticket = ticketRepository.save(ticket);
        
        return SupportTicketDTO.fromEntity(ticket, true);
    }
    
    /**
     * Adicionar mensagem ao ticket
     */
    public TicketMessageDTO addMessageToTicket(UUID ticketId, AddTicketMessageRequest request, UUID agentId) {
        log.info("Adicionando mensagem ao ticket: {}", ticketId);
        
        SupportTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new BusinessException("Ticket nÃ£o encontrado"));
        
        TicketMessage message = new TicketMessage();
        message.setTicket(ticket);
        message.setContent(request.getContent());
        message.setSenderName(request.getSenderName());
        message.setSenderEmail(request.getSenderEmail());
        message.setIsSupport(request.getIsSupport());
        
        if (agentId != null) {
            SupportAgent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new BusinessException("Agente nÃ£o encontrado"));
            message.setAgent(agent);
        }
        
        message = messageRepository.save(message);
        
        // Atualizar o timestamp do ticket
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        
        return TicketMessageDTO.fromEntity(message);
    }
    
    /**
     * Buscar mensagens de um ticket
     */
    public List<TicketMessageDTO> getTicketMessages(UUID ticketId) {
        log.info("Buscando mensagens do ticket: {}", ticketId);
        
        // Verificar se o ticket existe
        if (!ticketRepository.existsById(ticketId)) {
            throw new BusinessException("Ticket nÃ£o encontrado");
        }
        
        return messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
            .map(TicketMessageDTO::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Deletar ticket
     */
    public void deleteTicket(UUID ticketId) {
        log.info("Deletando ticket: {}", ticketId);
        
        SupportTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new BusinessException("Ticket nÃ£o encontrado"));
        
        ticketRepository.delete(ticket);
        log.info("Ticket deletado com sucesso");
    }
    
    /**
     * Obter mÃ©tricas de atendimento
     */
    public TicketMetrics getTicketMetrics() {
        log.info("Calculando mÃ©tricas de atendimento");
        
        try {
            Long totalTickets = ticketRepository.count();
            Long openTickets = ticketRepository.countByStatus(TicketStatus.OPEN);
            Long inProgressTickets = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
            Long resolvedTickets = ticketRepository.countByStatus(TicketStatus.RESOLVED);
            Long closedTickets = ticketRepository.countByStatus(TicketStatus.CLOSED);
            
            // Tratar possÃ­veis valores null
            totalTickets = totalTickets != null ? totalTickets : 0L;
            openTickets = openTickets != null ? openTickets : 0L;
            inProgressTickets = inProgressTickets != null ? inProgressTickets : 0L;
            resolvedTickets = resolvedTickets != null ? resolvedTickets : 0L;
            closedTickets = closedTickets != null ? closedTickets : 0L;
            
            Double averageResolutionTime = null;
            Double resolutionRate = null;
            
            try {
                averageResolutionTime = ticketRepository.getAverageResolutionTime();
            } catch (Exception e) {
                log.warn("Erro ao calcular tempo mÃ©dio de resoluÃ§Ã£o: {}", e.getMessage());
            }
            
            try {
                resolutionRate = ticketRepository.getResolutionRate(LocalDateTime.now().minusDays(30));
            } catch (Exception e) {
                log.warn("Erro ao calcular taxa de resoluÃ§Ã£o: {}", e.getMessage());
            }
            
            return new TicketMetrics(
                totalTickets,
                openTickets,
                inProgressTickets,
                resolvedTickets,
                closedTickets,
                averageResolutionTime != null ? averageResolutionTime : 0.0,
                resolutionRate != null ? resolutionRate : 0.0
            );
        } catch (Exception e) {
            log.error("Erro ao calcular mÃ©tricas de atendimento: {}", e.getMessage(), e);
            // Retornar mÃ©tricas zeradas em caso de erro
            return new TicketMetrics(0L, 0L, 0L, 0L, 0L, 0.0, 0.0);
        }
    }
    
    /**
     * Classe interna para mÃ©tricas
     */
    public static class TicketMetrics {
        public final Long totalTickets;
        public final Long openTickets;
        public final Long inProgressTickets;
        public final Long resolvedTickets;
        public final Long closedTickets;
        public final Double averageResolutionTimeHours;
        public final Double resolutionRatePercentage;
        
        public TicketMetrics(Long totalTickets, Long openTickets, Long inProgressTickets,
                           Long resolvedTickets, Long closedTickets,
                           Double averageResolutionTimeHours, Double resolutionRatePercentage) {
            this.totalTickets = totalTickets;
            this.openTickets = openTickets;
            this.inProgressTickets = inProgressTickets;
            this.resolvedTickets = resolvedTickets;
            this.closedTickets = closedTickets;
            this.averageResolutionTimeHours = averageResolutionTimeHours;
            this.resolutionRatePercentage = resolutionRatePercentage;
        }
    }
}


