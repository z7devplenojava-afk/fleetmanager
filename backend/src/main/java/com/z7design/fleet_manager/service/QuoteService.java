package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.QuoteDTO;
import com.z7design.fleet_manager.dto.QuoteItemDTO;
import com.z7design.fleet_manager.model.Quote;
import com.z7design.fleet_manager.model.QuoteItem;
import com.z7design.fleet_manager.model.enums.QuoteStatus;
import com.z7design.fleet_manager.repository.QuoteRepository;
import com.z7design.fleet_manager.repository.QuoteItemRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class QuoteService {

    @Autowired
    private QuoteRepository quoteRepository;

    @Autowired
    private QuoteItemRepository quoteItemRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Quote> findAll() {
        List<Quote> quotes = quoteRepository.findAll();
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public Page<Quote> findAll(Pageable pageable) {
        Page<Quote> quotes = quoteRepository.findAll(pageable);
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Quote quote : quotes.getContent()) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }
    
    /**
     * Inicializa relacionamentos lazy de um Quote, tratando casos onde entidades foram deletadas
     */
    private void initializeQuoteRelationships(Quote quote) {
        // Inicializar Client
        if (quote.getClient() != null) {
            try {
                // Usar Hibernate.initialize() para forÃ§ar inicializaÃ§Ã£o dentro da transaÃ§Ã£o
                Hibernate.initialize(quote.getClient());
                // Acessar um campo para garantir que foi carregado
                quote.getClient().getName();
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                // Client foi deletado ou nÃ£o pode ser inicializado, definir como null
                quote.setClient(null);
            } catch (Exception e) {
                // Outros erros tambÃ©m resultam em null para evitar problemas
                quote.setClient(null);
            }
        }
        
        // Inicializar Lead
        if (quote.getLead() != null) {
            try {
                Hibernate.initialize(quote.getLead());
                quote.getLead().getName();
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                quote.setLead(null);
            } catch (Exception e) {
                quote.setLead(null);
            }
        }
        
        // Inicializar CreatedBy
        if (quote.getCreatedBy() != null) {
            try {
                Hibernate.initialize(quote.getCreatedBy());
                quote.getCreatedBy().getUsername();
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                quote.setCreatedBy(null);
            } catch (Exception e) {
                quote.setCreatedBy(null);
            }
        }
        
        // Inicializar AssignedTo
        if (quote.getAssignedTo() != null) {
            try {
                Hibernate.initialize(quote.getAssignedTo());
                quote.getAssignedTo().getUsername();
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                quote.setAssignedTo(null);
            } catch (Exception e) {
                quote.setAssignedTo(null);
            }
        }
    }

    @Transactional(readOnly = true)
    public Quote findById(UUID id) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OrÃ§amento nÃ£o encontrado com ID: " + id));
        initializeQuoteRelationships(quote);
        return quote;
    }

    public Quote create(QuoteDTO quoteDTO, UUID createdById) {
        Quote quote = new Quote();
        quote.setTitle(quoteDTO.getTitle());
        quote.setQuoteNumber(generateQuoteNumber());
        quote.setStatus(QuoteStatus.DRAFT);
        quote.setTotalValue(quoteDTO.getTotalValue());
        quote.setValidUntil(quoteDTO.getValidUntil());
        quote.setDescription(quoteDTO.getDescription());
        quote.setCreatedBy(userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado")));
        
        if (quoteDTO.getClientId() != null) {
            quote.setClient(clientRepository.findById(quoteDTO.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado")));
        }
        
        if (quoteDTO.getLeadId() != null) {
            quote.setLead(leadRepository.findById(quoteDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado")));
        }
        
        if (quoteDTO.getAssignedToId() != null) {
            quote.setAssignedTo(userRepository.findById(UUID.fromString(quoteDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado")));
        }

        quote = quoteRepository.save(quote);

        // Salvar itens do orÃ§amento
        if (quoteDTO.getItems() != null) {
            for (QuoteItemDTO itemDTO : quoteDTO.getItems()) {
                QuoteItem item = new QuoteItem();
                item.setQuote(quote);
                item.setDescription(itemDTO.getDescription());
                item.setQuantity(itemDTO.getQuantity());
                item.setUnitPrice(itemDTO.getUnitPrice());
                item.setTotalPrice(BigDecimal.valueOf(itemDTO.getQuantity()).multiply(itemDTO.getUnitPrice()));
                quoteItemRepository.save(item);
            }
        }

        return quote;
    }

    public Quote update(UUID id, QuoteDTO quoteDTO) {
        Quote quote = findById(id);
        quote.setTitle(quoteDTO.getTitle());
        quote.setTotalValue(quoteDTO.getTotalValue());
        quote.setValidUntil(quoteDTO.getValidUntil());
        quote.setDescription(quoteDTO.getDescription());
        
        if (quoteDTO.getClientId() != null) {
            quote.setClient(clientRepository.findById(quoteDTO.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado")));
        } else {
            quote.setClient(null);
        }
        
        if (quoteDTO.getLeadId() != null) {
            quote.setLead(leadRepository.findById(quoteDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado")));
        } else {
            quote.setLead(null);
        }
        
        if (quoteDTO.getAssignedToId() != null) {
            quote.setAssignedTo(userRepository.findById(UUID.fromString(quoteDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado")));
        } else {
            quote.setAssignedTo(null);
        }

        return quoteRepository.save(quote);
    }

    public Quote updateStatus(UUID id, String status) {
        Quote quote = findById(id);
        quote.setStatus(QuoteStatus.valueOf(status));
        return quoteRepository.save(quote);
    }

    public void delete(UUID id) {
        Quote quote = findById(id);
        quoteRepository.delete(quote);
    }

    @Transactional(readOnly = true)
    public List<Quote> findByStatus(QuoteStatus status) {
        List<Quote> quotes = quoteRepository.findByStatus(status);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public List<Quote> findByClient(UUID clientId) {
        List<Quote> quotes = quoteRepository.findByClientId(clientId);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public List<Quote> findByLead(UUID leadId) {
        List<Quote> quotes = quoteRepository.findByLeadId(leadId);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public List<Quote> findByAssignedTo(UUID userId) {
        List<Quote> quotes = quoteRepository.findByAssignedToId(userId);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public List<Quote> findByCreatedBy(UUID userId) {
        List<Quote> quotes = quoteRepository.findByCreatedById(userId);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public List<Quote> findExpiredQuotes() {
        List<Quote> quotes = quoteRepository.findByValidUntilBefore(LocalDate.now());
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    @Transactional(readOnly = true)
    public List<Quote> findQuotesExpiringSoon(int days) {
        LocalDate expiryDate = LocalDate.now().plusDays(days);
        List<Quote> quotes = quoteRepository.findByValidUntilBefore(expiryDate);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    public long countByStatus(QuoteStatus status) {
        return quoteRepository.countByStatus(status);
    }

    public BigDecimal getTotalValueByStatus(QuoteStatus status) {
        BigDecimal value = quoteRepository.getTotalValueByStatus(status);
        return value != null ? value : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<Quote> searchQuotes(String searchTerm) {
        List<Quote> quotes = quoteRepository.searchQuotes(searchTerm);
        for (Quote quote : quotes) {
            initializeQuoteRelationships(quote);
        }
        return quotes;
    }

    /**
     * Converte uma entidade Quote para DTO, inicializando relacionamentos lazy dentro da transaÃ§Ã£o
     */
    @Transactional(readOnly = true)
    public QuoteDTO convertToDTO(Quote quote) {
        if (quote == null) {
            return null;
        }
        
        // Garantir que relacionamentos lazy sejam inicializados
        initializeQuoteRelationships(quote);
        
        QuoteDTO dto = new QuoteDTO();
        dto.setId(quote.getId());
        dto.setTitle(quote.getTitle());
        dto.setQuoteNumber(quote.getQuoteNumber());
        dto.setStatus(quote.getStatus());
        dto.setTotalValue(quote.getTotalValue());
        dto.setValidUntil(quote.getValidUntil());
        dto.setDescription(quote.getDescription());
        dto.setNotes(quote.getNotes());
        dto.setCreatedAt(quote.getCreatedAt());
        dto.setUpdatedAt(quote.getUpdatedAt());
        
        // Preencher informaÃ§Ãµes do Client
        if (quote.getClient() != null) {
            dto.setClientId(quote.getClient().getId());
            dto.setClientName(quote.getClient().getName());
        }
        
        // Preencher informaÃ§Ãµes do Lead
        if (quote.getLead() != null) {
            dto.setLeadId(quote.getLead().getId());
            dto.setLeadName(quote.getLead().getName());
        }
        
        // Preencher informaÃ§Ãµes do CreatedBy
        if (quote.getCreatedBy() != null) {
            dto.setCreatedById(quote.getCreatedBy().getId());
            dto.setCreatedByName(quote.getCreatedBy().getName());
        }
        
        // Preencher informaÃ§Ãµes do AssignedTo
        if (quote.getAssignedTo() != null) {
            dto.setAssignedToId(quote.getAssignedTo().getId());
            dto.setAssignedToName(quote.getAssignedTo().getName());
        }
        
        // Converter itens - inicializar lazy collection dentro da transaÃ§Ã£o
        if (quote.getItems() != null) {
            try {
                Hibernate.initialize(quote.getItems());
                if (!quote.getItems().isEmpty()) {
                    List<QuoteItemDTO> itemDTOs = quote.getItems().stream()
                        .map(item -> {
                            QuoteItemDTO itemDTO = new QuoteItemDTO();
                            itemDTO.setId(item.getId());
                            itemDTO.setQuoteId(quote.getId());
                            itemDTO.setDescription(item.getDescription());
                            itemDTO.setQuantity(item.getQuantity());
                            itemDTO.setUnitPrice(item.getUnitPrice());
                            itemDTO.setTotalPrice(item.getTotalPrice());
                            itemDTO.setNotes(item.getNotes());
                            itemDTO.setCreatedAt(item.getCreatedAt());
                            itemDTO.setUpdatedAt(item.getUpdatedAt());
                            return itemDTO;
                        })
                        .toList();
                    dto.setItems(itemDTOs);
                }
            } catch (Exception e) {
                // Se houver erro ao inicializar itens, definir como lista vazia
                dto.setItems(new java.util.ArrayList<>());
            }
        }
        
        return dto;
    }
    
    /**
     * Converte uma lista de Quotes para DTOs
     */
    @Transactional(readOnly = true)
    public List<QuoteDTO> convertToDTOList(List<Quote> quotes) {
        return quotes.stream()
            .map(this::convertToDTO)
            .toList();
    }
    
    /**
     * Converte uma Page de Quotes para Page de DTOs
     */
    @Transactional(readOnly = true)
    public Page<QuoteDTO> convertToDTOPage(Page<Quote> quotes) {
        return quotes.map(this::convertToDTO);
    }

    private String generateQuoteNumber() {
        String prefix = "ORC-" + LocalDateTime.now().getYear() + "-";
        long count = quoteRepository.countByYear(LocalDateTime.now().getYear());
        return prefix + String.format("%03d", count + 1);
    }
} 
