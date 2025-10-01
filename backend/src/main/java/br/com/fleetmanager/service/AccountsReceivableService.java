package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.AccountsReceivableDTO;
import br.com.fleetmanager.model.AccountsReceivable;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.enums.ReceivableStatus;
import br.com.fleetmanager.repository.AccountsReceivableRepository;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccountsReceivableService {
    
    private final AccountsReceivableRepository accountsReceivableRepository;
    private final ClientRepository clientRepository;
    
    /**
     * Buscar todas as contas a receber com paginação
     */
    @Transactional(readOnly = true)
    public Page<AccountsReceivableDTO> getAllAccountsReceivable(Pageable pageable) {
        log.info("Buscando todas as contas a receber com paginação");
        Page<AccountsReceivable> accounts = accountsReceivableRepository.findAllOrderByDueDate(pageable);
        return accounts.map(AccountsReceivableDTO::fromEntity);
    }
    
    /**
     * Buscar todas as contas a receber sem paginação
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAllAccountsReceivable() {
        log.info("Buscando todas as contas a receber");
        List<AccountsReceivable> accounts = accountsReceivableRepository.findAll();
        return accounts.stream()
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar conta a receber por ID
     */
    @Transactional(readOnly = true)
    public AccountsReceivableDTO getAccountsReceivableById(UUID id) {
        log.info("Buscando conta a receber por ID: {}", id);
        AccountsReceivable account = accountsReceivableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id));
        return AccountsReceivableDTO.fromEntity(account);
    }
    
    /**
     * Criar nova conta a receber
     */
    public AccountsReceivableDTO createAccountsReceivable(AccountsReceivableDTO dto) {
        log.info("Criando nova conta a receber para cliente: {}", dto.getClientId());
        
        // Buscar cliente
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + dto.getClientId()));
        
        // Criar entidade
        AccountsReceivable account = new AccountsReceivable();
        account.setClient(client);
        account.setInvoiceNumber(dto.getInvoiceNumber());
        // Se measurementId for enviado, preferir preencher measurementNumber com o id (ou buscar número posteriormente)
        if (dto.getMeasurementId() != null && (dto.getMeasurementNumber() == null || dto.getMeasurementNumber().isBlank())) {
            account.setMeasurementNumber(dto.getMeasurementId().toString());
        } else {
            account.setMeasurementNumber(dto.getMeasurementNumber());
        }
        account.setDescription(dto.getDescription());
        account.setAmount(dto.getAmount());
        account.setAmountPaid(dto.getAmountPaid() != null ? dto.getAmountPaid() : BigDecimal.ZERO);
        account.setIssueDate(dto.getIssueDate());
        account.setDueDate(dto.getDueDate());
        account.setPaymentDate(dto.getPaymentDate());
        account.setStatus(dto.getStatus() != null ? dto.getStatus() : ReceivableStatus.PENDING);
        account.setCategory(dto.getCategory());
        account.setPaymentMethod(dto.getPaymentMethod());
        account.setOverdueDays(dto.getOverdueDays() != null ? dto.getOverdueDays() : 0);
        account.setLateFee(dto.getLateFee() != null ? dto.getLateFee() : BigDecimal.ZERO);
        account.setLatePenalty(dto.getLatePenalty() != null ? dto.getLatePenalty() : BigDecimal.ZERO);
        account.setNotes(dto.getNotes());
        
        // Calcular dias em atraso
        account.calculateOverdueDays();
        
        // Salvar
        AccountsReceivable savedAccount = accountsReceivableRepository.save(account);
        log.info("Conta a receber criada com sucesso: {}", savedAccount.getId());
        
        return AccountsReceivableDTO.fromEntity(savedAccount);
    }
    
    /**
     * Atualizar conta a receber
     */
    public AccountsReceivableDTO updateAccountsReceivable(UUID id, AccountsReceivableDTO dto) {
        log.info("Atualizando conta a receber: {}", id);
        
        // Buscar conta existente
        AccountsReceivable account = accountsReceivableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id));
        
        // Buscar cliente se foi alterado
        if (!account.getClient().getId().equals(dto.getClientId())) {
            Client client = clientRepository.findById(dto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + dto.getClientId()));
            account.setClient(client);
        }
        
        // Atualizar campos
        account.setInvoiceNumber(dto.getInvoiceNumber());
        if (dto.getMeasurementId() != null && (dto.getMeasurementNumber() == null || dto.getMeasurementNumber().isBlank())) {
            account.setMeasurementNumber(dto.getMeasurementId().toString());
        } else {
            account.setMeasurementNumber(dto.getMeasurementNumber());
        }
        account.setDescription(dto.getDescription());
        account.setAmount(dto.getAmount());
        account.setAmountPaid(dto.getAmountPaid() != null ? dto.getAmountPaid() : BigDecimal.ZERO);
        account.setIssueDate(dto.getIssueDate());
        account.setDueDate(dto.getDueDate());
        account.setPaymentDate(dto.getPaymentDate());
        account.setStatus(dto.getStatus());
        account.setCategory(dto.getCategory());
        account.setPaymentMethod(dto.getPaymentMethod());
        account.setOverdueDays(dto.getOverdueDays() != null ? dto.getOverdueDays() : 0);
        account.setLateFee(dto.getLateFee() != null ? dto.getLateFee() : BigDecimal.ZERO);
        account.setLatePenalty(dto.getLatePenalty() != null ? dto.getLatePenalty() : BigDecimal.ZERO);
        account.setNotes(dto.getNotes());
        
        // Calcular dias em atraso
        account.calculateOverdueDays();
        
        // Salvar
        AccountsReceivable savedAccount = accountsReceivableRepository.save(account);
        log.info("Conta a receber atualizada com sucesso: {}", savedAccount.getId());
        
        return AccountsReceivableDTO.fromEntity(savedAccount);
    }
    
    /**
     * Excluir conta a receber
     */
    public void deleteAccountsReceivable(UUID id) {
        log.info("Excluindo conta a receber: {}", id);
        
        if (!accountsReceivableRepository.existsById(id)) {
            throw new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id);
        }
        
        accountsReceivableRepository.deleteById(id);
        log.info("Conta a receber excluída com sucesso: {}", id);
    }
    
    /**
     * Buscar contas por cliente
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAccountsReceivableByClient(UUID clientId) {
        log.info("Buscando contas a receber por cliente: {}", clientId);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByClientId(clientId);
        return accounts.stream()
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar contas por status
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAccountsReceivableByStatus(ReceivableStatus status) {
        log.info("Buscando contas a receber por status: {}", status);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByStatus(status);
        return accounts.stream()
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar contas vencidas
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getOverdueAccounts() {
        log.info("Buscando contas a receber vencidas");
        List<AccountsReceivable> accounts = accountsReceivableRepository.findOverdueAccounts(LocalDate.now());
        return accounts.stream()
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar contas por período
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAccountsReceivableByPeriod(LocalDate startDate, LocalDate endDate) {
        log.info("Buscando contas a receber por período: {} a {}", startDate, endDate);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByIssueDateBetween(startDate, endDate);
        return accounts.stream()
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar números de fatura para autocomplete
     */
    @Transactional(readOnly = true)
    public List<String> searchInvoiceNumbers(String term) {
        log.info("Buscando números de fatura para termo: {}", term);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByInvoiceNumberContainingIgnoreCase(term);
        return accounts.stream()
                .map(AccountsReceivable::getInvoiceNumber)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar números de medição para autocomplete
     */
    @Transactional(readOnly = true)
    public List<String> searchMeasurementNumbers(String term) {
        log.info("Buscando números de medição para termo: {}", term);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByMeasurementNumberContainingIgnoreCase(term);
        return accounts.stream()
                .map(AccountsReceivable::getMeasurementNumber)
                .filter(Objects::nonNull)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar categorias para autocomplete
     */
    @Transactional(readOnly = true)
    public List<String> searchCategories(String term) {
        log.info("Buscando categorias para termo: {}", term);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findAll();
        return accounts.stream()
                .map(AccountsReceivable::getCategory)
                .filter(Objects::nonNull)
                .map(Enum::name)
                .filter(category -> category.toLowerCase().contains(term.toLowerCase()))
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar formas de pagamento para autocomplete
     */
    @Transactional(readOnly = true)
    public List<String> searchPaymentMethods(String term) {
        log.info("Buscando formas de pagamento para termo: {}", term);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findAll();
        return accounts.stream()
                .map(AccountsReceivable::getPaymentMethod)
                .filter(Objects::nonNull)
                .map(Enum::name)
                .filter(method -> method.toLowerCase().contains(term.toLowerCase()))
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }
    
    /**
     * Marcar conta como paga
     */
    public AccountsReceivableDTO markAsPaid(UUID id, LocalDate paymentDate) {
        log.info("Marcando conta a receber como paga: {}", id);
        
        AccountsReceivable account = accountsReceivableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id));
        
        account.setStatus(ReceivableStatus.PAID);
        account.setPaymentDate(paymentDate);
        account.setAmountPaid(account.getAmount());
        account.setOverdueDays(0);
        
        AccountsReceivable savedAccount = accountsReceivableRepository.save(account);
        log.info("Conta a receber marcada como paga: {}", savedAccount.getId());
        
        return AccountsReceivableDTO.fromEntity(savedAccount);
    }
    
    /**
     * Atualizar status de todas as contas vencidas
     */
    @Transactional
    public void updateOverdueStatus() {
        log.info("Atualizando status de contas vencidas");
        
        List<AccountsReceivable> overdueAccounts = accountsReceivableRepository.findOverdueAccounts(LocalDate.now());
        
        for (AccountsReceivable account : overdueAccounts) {
            if (account.getStatus() == ReceivableStatus.PENDING) {
                account.setStatus(ReceivableStatus.OVERDUE);
                account.calculateOverdueDays();
            }
        }
        
        accountsReceivableRepository.saveAll(overdueAccounts);
        log.info("Status de {} contas vencidas atualizado", overdueAccounts.size());
    }
    
    /**
     * Buscar contas a receber vencendo em 3 dias
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAccountsReceivableDueInThreeDays() {
        log.info("Buscando contas a receber vencendo em 3 dias");
        LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByDueDateBetween(
                threeDaysFromNow, threeDaysFromNow);
        return accounts.stream()
                .filter(account -> account.getStatus() == ReceivableStatus.PENDING)
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar contas a receber vencendo em X dias
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAccountsReceivableDueInDays(int days) {
        log.info("Buscando contas a receber vencendo em {} dias", days);
        LocalDate targetDate = LocalDate.now().plusDays(days);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByDueDateBetween(
                targetDate, targetDate);
        return accounts.stream()
                .filter(account -> account.getStatus() == ReceivableStatus.PENDING)
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Enviar alertas para contas a receber vencendo em 3 dias
     */
    @Transactional
    public void sendAlertsForAccountsDueInThreeDays() {
        log.info("Enviando alertas para contas a receber vencendo em 3 dias");
        
        List<AccountsReceivableDTO> accountsDueInThreeDays = getAccountsReceivableDueInThreeDays();
        
        for (AccountsReceivableDTO account : accountsDueInThreeDays) {
            try {
                // Enviar notificação
                sendAccountDueAlert(account);
                log.info("Alerta enviado para conta a receber: {} - Cliente: {} - Valor: {}", 
                        account.getId(), account.getClient().getName(), account.getAmount());
            } catch (Exception e) {
                log.error("Erro ao enviar alerta para conta a receber {}: {}", account.getId(), e.getMessage());
            }
        }
        
        log.info("Alertas enviados para {} contas a receber", accountsDueInThreeDays.size());
    }
    
    /**
     * Enviar alerta individual para conta a receber
     */
    private void sendAccountDueAlert(AccountsReceivableDTO account) {
        // Aqui você pode implementar a lógica de envio de notificação
        // Por exemplo, criar uma notificação no sistema ou enviar email
        log.info("Enviando alerta para conta a receber vencendo em 3 dias: {} - Cliente: {} - Valor: {}", 
                account.getId(), account.getClient().getName(), account.getAmount());
        
        // TODO: Implementar envio de notificação via NotificationService
        // notificationService.createNotification(...);
    }
}
