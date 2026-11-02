package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.AccountsReceivableDTO;
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.z7design.fleet_manager.dto.NfseParsedDataDTO;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccountsReceivableService {
    
    private final AccountsReceivableRepository accountsReceivableRepository;
    private final ClientRepository clientRepository;
    private final UnitRepository unitRepository;
    private final ContractRepository contractRepository;
    private final WorkPostRepository workPostRepository;
    private final NfseParserService nfseParserService;
    private final EmailService emailService;
    private final com.z7design.fleet_manager.repository.MeasurementBulletinRepository measurementBulletinRepository;
    private final com.z7design.fleet_manager.repository.CharterContractRepository charterContractRepository;
    
    /**
     * Buscar todas as contas a receber com paginaÃ§Ã£o
     */
    @Transactional(readOnly = true)
    public Page<AccountsReceivableDTO> getAllAccountsReceivable(Pageable pageable) {
        log.info("Buscando todas as contas a receber com paginação");
        Page<AccountsReceivable> accounts = accountsReceivableRepository.findAll(pageable);
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
        if (dto.getInvoiceNumber() == null || dto.getInvoiceNumber().isBlank()) {
            account.setInvoiceNumber("FAT-" + (System.currentTimeMillis() % 1000000));
        } else {
            account.setInvoiceNumber(dto.getInvoiceNumber());
        }
        // Se measurementId for enviado, preferir preencher measurementNumber com o id (ou buscar nÃºmero posteriormente)
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
        
        // Validar categoria obrigatÃ³ria
        if (dto.getCategory() == null) {
            throw new IllegalArgumentException("Categoria Ã© obrigatÃ³ria");
        }
        account.setCategory(dto.getCategory());
        
        // Validar forma de pagamento obrigatÃ³ria
        if (dto.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Forma de pagamento Ã© obrigatÃ³ria");
        }
        account.setPaymentMethod(dto.getPaymentMethod());
        
        account.setOverdueDays(dto.getOverdueDays() != null ? dto.getOverdueDays() : 0);
        account.setLateFee(dto.getLateFee() != null ? dto.getLateFee() : BigDecimal.ZERO);
        account.setLatePenalty(dto.getLatePenalty() != null ? dto.getLatePenalty() : BigDecimal.ZERO);
        account.setNotes(dto.getNotes());
        
        // Buscar e definir unidade se unitId foi fornecido
        if (dto.getUnitId() != null) {
            account.setUnit(unitRepository.findById(dto.getUnitId()).orElse(null));
        }

        // Definir contrato se fornecido
        if (dto.getContractId() != null) {
            account.setContract(contractRepository.findById(dto.getContractId()).orElse(null));
        }

        // Definir obra/posto se fornecido
        if (dto.getWorkPostId() != null) {
            account.setWorkPost(workPostRepository.findById(dto.getWorkPostId()).orElse(null));
        }
        
        // Definir centro de custo se fornecido
        account.setCentroCusto(dto.getCentroCusto());
        
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
        
        // Atualizar status se fornecido
        if (dto.getStatus() != null) {
            account.setStatus(dto.getStatus());
        }
        
        // Atualizar categoria se fornecida (obrigatória se fornecida)
        if (dto.getCategory() != null) {
            account.setCategory(dto.getCategory());
        }
        
        // Atualizar forma de pagamento se fornecida (obrigatória se fornecida)
        if (dto.getPaymentMethod() != null) {
            account.setPaymentMethod(dto.getPaymentMethod());
        }
        
        account.setOverdueDays(dto.getOverdueDays() != null ? dto.getOverdueDays() : 0);
        account.setLateFee(dto.getLateFee() != null ? dto.getLateFee() : BigDecimal.ZERO);
        account.setLatePenalty(dto.getLatePenalty() != null ? dto.getLatePenalty() : BigDecimal.ZERO);
        account.setNotes(dto.getNotes());
        
        // Atualizar unidade se unitId foi fornecido
        if (dto.getUnitId() != null) {
            account.setUnit(unitRepository.findById(dto.getUnitId()).orElse(null));
        } else {
            account.setUnit(null);
        }

        // Atualizar contrato se contractId foi fornecido
        if (dto.getContractId() != null) {
            account.setContract(contractRepository.findById(dto.getContractId()).orElse(null));
        } else {
            account.setContract(null);
        }

        // Atualizar obra/posto se workPostId foi fornecido
        if (dto.getWorkPostId() != null) {
            account.setWorkPost(workPostRepository.findById(dto.getWorkPostId()).orElse(null));
        } else {
            account.setWorkPost(null);
        }
        
        // Atualizar centro de custo se fornecido
        if (dto.getCentroCusto() != null) {
            account.setCentroCusto(dto.getCentroCusto());
        } else {
            account.setCentroCusto(null);
        }
        
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
            throw new ResourceNotFoundException("Conta a receber nÃ£o encontrada com ID: " + id);
        }
        
        accountsReceivableRepository.deleteById(id);
        log.info("Conta a receber excluÃ­da com sucesso: {}", id);
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
     * Buscar contas por perÃ­odo
     */
    @Transactional(readOnly = true)
    public List<AccountsReceivableDTO> getAccountsReceivableByPeriod(LocalDate startDate, LocalDate endDate) {
        log.info("Buscando contas a receber por perÃ­odo: {} a {}", startDate, endDate);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByIssueDateBetween(startDate, endDate);
        return accounts.stream()
                .map(AccountsReceivableDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar nÃºmeros de fatura para autocomplete
     */
    @Transactional(readOnly = true)
    public List<String> searchInvoiceNumbers(String term) {
        log.info("Buscando nÃºmeros de fatura para termo: {}", term);
        List<AccountsReceivable> accounts = accountsReceivableRepository.findByInvoiceNumberContainingIgnoreCase(term);
        return accounts.stream()
                .map(AccountsReceivable::getInvoiceNumber)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar nÃºmeros de mediÃ§Ã£o para autocomplete
     */
    @Transactional(readOnly = true)
    public List<String> searchMeasurementNumbers(String term) {
        log.info("Buscando nÃºmeros de mediÃ§Ã£o para termo: {}", term);
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
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber nÃ£o encontrada com ID: " + id));
        
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
                // Enviar notificaÃ§Ã£o
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
        // Aqui vocÃª pode implementar a lÃ³gica de envio de notificaÃ§Ã£o
        // Por exemplo, criar uma notificaÃ§Ã£o no sistema ou enviar email
        log.info("Enviando alerta para conta a receber vencendo em 3 dias: {} - Cliente: {} - Valor: {}", 
                account.getId(), account.getClient().getName(), account.getAmount());
        
        // TODO: Implementar envio de notificaÃ§Ã£o via NotificationService
        // notificationService.createNotification(...);
    }

    /**
     * Importa arquivo NFS-e (XML ou PDF) e vincula ao título do Contas a Receber.
     */
    public AccountsReceivableDTO importNfse(UUID id, MultipartFile file) {
        log.info("Importando NFS-e para conta a receber ID: {}", id);
        AccountsReceivable receivable = accountsReceivableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id));

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        NfseParsedDataDTO parsed;

        try {
            if (filename.endsWith(".xml")) {
                parsed = nfseParserService.parseXml(file.getInputStream());
            } else {
                parsed = nfseParserService.parsePdf(file.getInputStream());
            }
        } catch (Exception e) {
            log.error("Erro ao importar NFS-e: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Erro no processamento da NFS-e: " + e.getMessage(), e);
        }

        if (parsed.getNfseNumber() != null && !parsed.getNfseNumber().isBlank()) {
            receivable.setNfseNumber(parsed.getNfseNumber());
            receivable.setInvoiceNumber("NFS-e " + parsed.getNfseNumber());
        }
        if (parsed.getNfseKey() != null) {
            receivable.setNfseKey(parsed.getNfseKey());
        }
        if (parsed.getIssueDate() != null) {
            receivable.setNfseIssueDate(parsed.getIssueDate());
            receivable.setIssueDate(parsed.getIssueDate().toLocalDate());
        }

        if (parsed.getGrossAmount() != null && parsed.getGrossAmount().compareTo(BigDecimal.ZERO) > 0) {
            receivable.setGrossAmount(parsed.getGrossAmount());
        }
        if (parsed.getNetAmount() != null && parsed.getNetAmount().compareTo(BigDecimal.ZERO) > 0) {
            receivable.setNetAmount(parsed.getNetAmount());
            receivable.setAmount(parsed.getNetAmount()); // O valor a receber da empresa é o LÍQUIDO!
        }
        if (parsed.getIssqnRetido() != null) receivable.setIssqnRetido(parsed.getIssqnRetido());
        if (parsed.getInssRetido() != null) receivable.setInssRetido(parsed.getInssRetido());
        if (parsed.getIrRetido() != null) receivable.setIrRetido(parsed.getIrRetido());
        if (parsed.getPisRetido() != null) receivable.setPisRetido(parsed.getPisRetido());
        if (parsed.getCofinsRetido() != null) receivable.setCofinsRetido(parsed.getCofinsRetido());
        if (parsed.getCsllRetido() != null) receivable.setCsllRetido(parsed.getCsllRetido());
        if (parsed.getIbsCbsAmount() != null) receivable.setIbsCbsAmount(parsed.getIbsCbsAmount());

        if (parsed.getServiceDescription() != null && !parsed.getServiceDescription().isBlank()) {
            receivable.setNfseServiceDescription(parsed.getServiceDescription());
        }

        if (parsed.getFaturaLocacaoNumber() != null) receivable.setFaturaLocacaoNumber(parsed.getFaturaLocacaoNumber());
        if (parsed.getPedidoNumber() != null) receivable.setPedidoNumber(parsed.getPedidoNumber());
        if (parsed.getPeriodoLocacao() != null) receivable.setPeriodoLocacao(parsed.getPeriodoLocacao());
        if (parsed.getPlacasVeiculos() != null) receivable.setPlacasVeiculos(parsed.getPlacasVeiculos());
        if (parsed.getDadosBancarios() != null) receivable.setDadosBancarios(parsed.getDadosBancarios());

        receivable.setNfseStatus("NFSE_IMPORTADA");

        // Tentar associar cliente por CNPJ se tomadorCnpjCpf estiver preenchido
        if (parsed.getTomadorCnpjCpf() != null && !parsed.getTomadorCnpjCpf().isBlank()) {
            String tomadorDoc = parsed.getTomadorCnpjCpf().replaceAll("[^0-9]", "");
            clientRepository.findAll().stream()
                    .filter(c -> c.getCnpj() != null && c.getCnpj().replaceAll("[^0-9]", "").equals(tomadorDoc))
                    .findFirst()
                    .ifPresent(receivable::setClient);
        }

        // Atualizar boletim de medição vinculado, se houver
        if (receivable.getMeasurement() != null) {
            MeasurementBulletin mb = receivable.getMeasurement();
            mb.setNfNumber(parsed.getNfseNumber());
            mb.setNfseNumber(parsed.getNfseNumber());
            mb.setNfseKey(parsed.getNfseKey());
            if (parsed.getGrossAmount() != null) mb.setGrossAmount(parsed.getGrossAmount());
            if (parsed.getNetAmount() != null) mb.setNetAmount(parsed.getNetAmount());
            if (parsed.getFaturaLocacaoNumber() != null) mb.setFaturaLocacaoNumber(parsed.getFaturaLocacaoNumber());
            if (parsed.getPedidoNumber() != null) mb.setPedidoNumber(parsed.getPedidoNumber());
            if (parsed.getPeriodoLocacao() != null) mb.setPeriodoLocacao(parsed.getPeriodoLocacao());
            if (parsed.getPlacasVeiculos() != null) mb.setPlacasVeiculos(parsed.getPlacasVeiculos());
            if (parsed.getDadosBancarios() != null) mb.setDadosBancarios(parsed.getDadosBancarios());
        }

        AccountsReceivable saved = accountsReceivableRepository.save(receivable);
        return AccountsReceivableDTO.fromEntity(saved);
    }

    /**
     * Apenas parseia o arquivo NFS-e para pré-visualização na interface.
     */
    public NfseParsedDataDTO parseNfseFile(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        try {
            if (filename.endsWith(".xml")) {
                return nfseParserService.parseXml(file.getInputStream());
            } else {
                return nfseParserService.parsePdf(file.getInputStream());
            }
        } catch (Exception e) {
            log.error("Erro ao pré-visualizar NFS-e: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Erro ao ler o arquivo NFS-e: " + e.getMessage(), e);
        }
    }

    /**
     * Envia os arquivos/dados da Fatura de Locação e NFS-e para o cliente por e-mail.
     */
    public boolean sendClientEmail(UUID id) {
        AccountsReceivable receivable = accountsReceivableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id));

        if (receivable.getClient() == null || receivable.getClient().getEmail() == null || receivable.getClient().getEmail().isBlank()) {
            throw new IllegalArgumentException("O cliente associado não possui e-mail cadastrado.");
        }

        String toEmail = receivable.getClient().getEmail();
        String faturaNum = receivable.getFaturaLocacaoNumber() != null ? receivable.getFaturaLocacaoNumber() : receivable.getInvoiceNumber();
        String subject = "Fatura de Locação / NFS-e #" + faturaNum + " - " + (receivable.getClient().getName() != null ? receivable.getClient().getName() : "");

        StringBuilder body = new StringBuilder();
        body.append("<div style='font-family: Arial, sans-serif; color: #333;'>");
        body.append("<h2>Fatura de Locação de Veículos</h2>");
        body.append("<p>Prezado(a) <strong>").append(receivable.getClient().getName()).append("</strong>,</p>");
        body.append("<p>Disponibilizamos a Fatura de Locação / Nota Fiscal referente aos serviços prestados para pagamento:</p>");
        body.append("<table style='border-collapse: collapse; width: 100%; max-width: 600px; margin: 15px 0;'>");
        body.append("<tr style='background: #f4f4f4;'><th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>Campo</th><th style='padding: 8px; text-align: left; border: 1px solid #ddd;'>Detalhe</th></tr>");
        body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Fatura N°</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>").append(faturaNum).append("</td></tr>");
        if (receivable.getPedidoNumber() != null) body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>N° Pedido</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>").append(receivable.getPedidoNumber()).append("</td></tr>");
        if (receivable.getPeriodoLocacao() != null) body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Período</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>").append(receivable.getPeriodoLocacao()).append("</td></tr>");
        if (receivable.getPlacasVeiculos() != null) body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Veículos / Placas</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>").append(receivable.getPlacasVeiculos()).append("</td></tr>");
        body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Vencimento</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>").append(receivable.getDueDate()).append("</td></tr>");
        body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Valor a Receber</strong></td><td style='padding: 8px; border: 1px solid #ddd; color: #16a34a; font-weight: bold;'>R$ ").append(receivable.getAmount()).append("</td></tr>");
        if (receivable.getDadosBancarios() != null) body.append("<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Dados Bancários</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>").append(receivable.getDadosBancarios()).append("</td></tr>");
        body.append("</table>");
        body.append("<p>Por favor, providencie o pagamento até a data de vencimento.</p>");
        body.append("<p>Atenciosamente,<br><strong>Setor Financeiro</strong></p>");
        body.append("</div>");

        try {
            boolean sent = emailService.sendEmailWithAttachment(toEmail, subject, body.toString(), null, null);
            log.info("E-mail da fatura {} enviado para {} com status: {}", id, toEmail, sent);
            return sent;
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail da fatura para {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Erro ao enviar e-mail: " + e.getMessage(), e);
        }
    }

    /**
     * Sincroniza todas as medições de contratos, contratos de locação e turismo sem títulos no Contas a Receber.
     */
    public int syncAllReceivables() {
        log.info("Iniciando sincronização total de Medições e Contratos no Contas a Receber...");
        int count = 0;

        // 1. Sincronizar Boletins de Medição
        List<MeasurementBulletin> bulletins = measurementBulletinRepository.findAll();
        for (MeasurementBulletin mb : bulletins) {
            if (mb.getClient() != null) {
                List<AccountsReceivable> existing = accountsReceivableRepository.findByMeasurementId(mb.getId());
                AccountsReceivable ar;
                if (!existing.isEmpty()) {
                    ar = existing.get(0);
                } else {
                    ar = new AccountsReceivable();
                    ar.setMeasurement(mb);
                    count++;
                }
                ar.setClient(mb.getClient());
                ar.setMeasurementNumber(mb.getContractNumber() != null ? mb.getContractNumber() : "MED-" + mb.getId().toString().substring(0, 6));
                ar.setInvoiceNumber(mb.getNfNumber() != null && !mb.getNfNumber().isBlank() ? mb.getNfNumber() : "MED-" + (mb.getContractNumber() != null ? mb.getContractNumber() : mb.getId().toString().substring(0, 6)));
                ar.setDescription("Medição de Fretamento - Contrato " + (mb.getContractNumber() != null ? mb.getContractNumber() : "N/A"));
                BigDecimal val = mb.getNetAmount() != null && mb.getNetAmount().compareTo(BigDecimal.ZERO) > 0 ? mb.getNetAmount() : (mb.getSubtotal() != null ? mb.getSubtotal() : BigDecimal.ZERO);
                ar.setAmount(val);
                ar.setCategory(com.z7design.fleet_manager.model.enums.ReceivableCategory.MEASUREMENT);
                if (ar.getIssueDate() == null) ar.setIssueDate(LocalDate.now());
                if (ar.getDueDate() == null) ar.setDueDate(LocalDate.now().plusDays(30));
                accountsReceivableRepository.save(ar);
            }
        }

        // 2. Sincronizar Contratos de Fretamento e Turismo
        List<com.z7design.fleet_manager.model.CharterContract> charters = charterContractRepository.findAll();
        for (com.z7design.fleet_manager.model.CharterContract charter : charters) {
            if (charter.getClient() != null && charter.getValue() != null && charter.getValue().compareTo(BigDecimal.ZERO) > 0) {
                String invNum = "FRET-" + charter.getId().toString().substring(0, 6);
                List<AccountsReceivable> existing = accountsReceivableRepository.findByInvoiceNumber(invNum);
                if (existing.isEmpty()) {
                    AccountsReceivable ar = new AccountsReceivable();
                    ar.setClient(charter.getClient());
                    ar.setInvoiceNumber(invNum);
                    ar.setDescription("Fretamento e Turismo - " + charter.getName());
                    ar.setAmount(charter.getValue());
                    ar.setCategory(com.z7design.fleet_manager.model.enums.ReceivableCategory.CHARTER_TOURISM);
                    ar.setIssueDate(charter.getStartDate() != null ? charter.getStartDate() : LocalDate.now());
                    ar.setDueDate(charter.getEndDate() != null ? charter.getEndDate() : LocalDate.now().plusDays(30));
                    accountsReceivableRepository.save(ar);
                    count++;
                }
            }
        }

        log.info("Sincronização total concluída: {} novos títulos gerados no Contas a Receber.", count);
        return count;
    }
}

