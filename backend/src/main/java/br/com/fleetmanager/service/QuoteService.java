package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.QuoteDTO;
import br.com.fleetmanager.dto.QuoteItemDTO;
import br.com.fleetmanager.model.Quote;
import br.com.fleetmanager.model.QuoteItem;
import br.com.fleetmanager.model.enums.QuoteStatus;
import br.com.fleetmanager.repository.QuoteRepository;
import br.com.fleetmanager.repository.QuoteItemRepository;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.repository.LeadRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
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

    public List<Quote> findAll() {
        return quoteRepository.findAll();
    }

    public Page<Quote> findAll(Pageable pageable) {
        return quoteRepository.findAll(pageable);
    }

    public Quote findById(UUID id) {
        return quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orçamento não encontrado com ID: " + id));
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
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado")));
        
        if (quoteDTO.getClientId() != null) {
            quote.setClient(clientRepository.findById(quoteDTO.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado")));
        }
        
        if (quoteDTO.getLeadId() != null) {
            quote.setLead(leadRepository.findById(quoteDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead não encontrado")));
        }
        
        if (quoteDTO.getAssignedToId() != null) {
            quote.setAssignedTo(userRepository.findById(UUID.fromString(quoteDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado")));
        }

        quote = quoteRepository.save(quote);

        // Salvar itens do orçamento
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
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado")));
        } else {
            quote.setClient(null);
        }
        
        if (quoteDTO.getLeadId() != null) {
            quote.setLead(leadRepository.findById(quoteDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead não encontrado")));
        } else {
            quote.setLead(null);
        }
        
        if (quoteDTO.getAssignedToId() != null) {
            quote.setAssignedTo(userRepository.findById(UUID.fromString(quoteDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado")));
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

    public List<Quote> findByStatus(QuoteStatus status) {
        return quoteRepository.findByStatus(status);
    }

    public List<Quote> findByClient(UUID clientId) {
        return quoteRepository.findByClientId(clientId);
    }

    public List<Quote> findByLead(UUID leadId) {
        return quoteRepository.findByLeadId(leadId);
    }

    public List<Quote> findByAssignedTo(UUID userId) {
        return quoteRepository.findByAssignedToId(userId);
    }

    public List<Quote> findByCreatedBy(UUID userId) {
        return quoteRepository.findByCreatedById(userId);
    }

    public List<Quote> findExpiredQuotes() {
        return quoteRepository.findByValidUntilBefore(LocalDate.now());
    }

    public List<Quote> findQuotesExpiringSoon(int days) {
        LocalDate expiryDate = LocalDate.now().plusDays(days);
        return quoteRepository.findByValidUntilBefore(expiryDate);
    }

    public long countByStatus(QuoteStatus status) {
        return quoteRepository.countByStatus(status);
    }

    public BigDecimal getTotalValueByStatus(QuoteStatus status) {
        return quoteRepository.getTotalValueByStatus(status);
    }

    public List<Quote> searchQuotes(String searchTerm) {
        return quoteRepository.searchQuotes(searchTerm);
    }

    private String generateQuoteNumber() {
        String prefix = "ORC-" + LocalDateTime.now().getYear() + "-";
        long count = quoteRepository.countByYear(LocalDateTime.now().getYear());
        return prefix + String.format("%03d", count + 1);
    }
} 