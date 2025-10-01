package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.ScheduledPaymentDTO;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.ScheduledPayment;
import br.com.fleetmanager.model.enums.ScheduledPaymentStatus;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.repository.ScheduledPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ScheduledPaymentService {
    
    private final ScheduledPaymentRepository scheduledPaymentRepository;
    private final ClientRepository clientRepository;
    private final NotificationService notificationService;
    
    /**
     * Buscar todos os pagamentos agendados com paginação
     */
    @Transactional(readOnly = true)
    public Page<ScheduledPaymentDTO> getAllScheduledPayments(Pageable pageable) {
        log.info("Buscando todos os pagamentos agendados com paginação");
        Page<ScheduledPayment> payments = scheduledPaymentRepository.findAllByOrderByScheduledDateAsc(pageable);
        return payments.map(ScheduledPaymentDTO::fromEntity);
    }
    
    /**
     * Buscar todos os pagamentos agendados sem paginação
     */
    @Transactional(readOnly = true)
    public List<ScheduledPaymentDTO> getAllScheduledPayments() {
        log.info("Buscando todos os pagamentos agendados");
        List<ScheduledPayment> payments = scheduledPaymentRepository.findAll();
        return payments.stream()
                .map(ScheduledPaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar pagamento agendado por ID
     */
    @Transactional(readOnly = true)
    public ScheduledPaymentDTO getScheduledPaymentById(UUID id) {
        log.info("Buscando pagamento agendado por ID: {}", id);
        ScheduledPayment payment = scheduledPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pagamento agendado não encontrado com ID: " + id));
        return ScheduledPaymentDTO.fromEntity(payment);
    }
    
    /**
     * Criar novo pagamento agendado
     */
    public ScheduledPaymentDTO createScheduledPayment(ScheduledPaymentDTO dto) {
        log.info("Criando novo pagamento agendado para cliente: {}", dto.getClientId());
        
        // Buscar cliente
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com ID: " + dto.getClientId()));
        
        // Criar entidade
        ScheduledPayment payment = dto.toEntity();
        payment.setClient(client);
        payment.setStatus(ScheduledPaymentStatus.SCHEDULED);
        payment.setAlertSent(false);
        
        // Salvar
        ScheduledPayment savedPayment = scheduledPaymentRepository.save(payment);
        log.info("Pagamento agendado criado com sucesso: {}", savedPayment.getId());
        
        return ScheduledPaymentDTO.fromEntity(savedPayment);
    }
    
    /**
     * Atualizar pagamento agendado
     */
    public ScheduledPaymentDTO updateScheduledPayment(UUID id, ScheduledPaymentDTO dto) {
        log.info("Atualizando pagamento agendado: {}", id);
        
        ScheduledPayment existingPayment = scheduledPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pagamento agendado não encontrado com ID: " + id));
        
        // Atualizar campos
        existingPayment.setDescription(dto.getDescription());
        existingPayment.setAmount(dto.getAmount());
        existingPayment.setScheduledDate(dto.getScheduledDate());
        existingPayment.setPaymentMethod(dto.getPaymentMethod());
        existingPayment.setInvoiceNumber(dto.getInvoiceNumber());
        existingPayment.setNotes(dto.getNotes());
        
        // Se mudou a data, resetar alerta
        if (!existingPayment.getScheduledDate().equals(dto.getScheduledDate())) {
            existingPayment.setAlertSent(false);
            existingPayment.setAlertSentDate(null);
        }
        
        ScheduledPayment updatedPayment = scheduledPaymentRepository.save(existingPayment);
        log.info("Pagamento agendado atualizado com sucesso: {}", updatedPayment.getId());
        
        return ScheduledPaymentDTO.fromEntity(updatedPayment);
    }
    
    /**
     * Deletar pagamento agendado
     */
    public void deleteScheduledPayment(UUID id) {
        log.info("Deletando pagamento agendado: {}", id);
        
        if (!scheduledPaymentRepository.existsById(id)) {
            throw new RuntimeException("Pagamento agendado não encontrado com ID: " + id);
        }
        
        scheduledPaymentRepository.deleteById(id);
        log.info("Pagamento agendado deletado com sucesso: {}", id);
    }
    
    /**
     * Buscar pagamentos agendados por cliente
     */
    @Transactional(readOnly = true)
    public List<ScheduledPaymentDTO> getScheduledPaymentsByClient(UUID clientId) {
        log.info("Buscando pagamentos agendados por cliente: {}", clientId);
        List<ScheduledPayment> payments = scheduledPaymentRepository.findByClientId(clientId);
        return payments.stream()
                .map(ScheduledPaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar pagamentos agendados por status
     */
    @Transactional(readOnly = true)
    public List<ScheduledPaymentDTO> getScheduledPaymentsByStatus(ScheduledPaymentStatus status) {
        log.info("Buscando pagamentos agendados por status: {}", status);
        List<ScheduledPayment> payments = scheduledPaymentRepository.findByStatus(status);
        return payments.stream()
                .map(ScheduledPaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar pagamentos vencendo em 3 dias
     */
    @Transactional(readOnly = true)
    public List<ScheduledPaymentDTO> getPaymentsDueInThreeDays() {
        log.info("Buscando pagamentos vencendo em 3 dias");
        LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
        List<ScheduledPayment> payments = scheduledPaymentRepository.findPaymentsDueInThreeDays(threeDaysFromNow);
        return payments.stream()
                .map(ScheduledPaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar pagamentos vencidos
     */
    @Transactional(readOnly = true)
    public List<ScheduledPaymentDTO> getOverduePayments() {
        log.info("Buscando pagamentos vencidos");
        List<ScheduledPayment> payments = scheduledPaymentRepository.findOverduePayments(LocalDate.now());
        return payments.stream()
                .map(ScheduledPaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Marcar pagamento como executado
     */
    public ScheduledPaymentDTO markAsExecuted(UUID id, LocalDate executionDate) {
        log.info("Marcando pagamento agendado como executado: {}", id);
        
        ScheduledPayment payment = scheduledPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pagamento agendado não encontrado com ID: " + id));
        
        payment.setStatus(ScheduledPaymentStatus.EXECUTED);
        payment.setExecutionDate(executionDate);
        
        ScheduledPayment updatedPayment = scheduledPaymentRepository.save(payment);
        log.info("Pagamento agendado marcado como executado: {}", updatedPayment.getId());
        
        return ScheduledPaymentDTO.fromEntity(updatedPayment);
    }
    
    /**
     * Cancelar pagamento agendado
     */
    public ScheduledPaymentDTO cancelScheduledPayment(UUID id) {
        log.info("Cancelando pagamento agendado: {}", id);
        
        ScheduledPayment payment = scheduledPaymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pagamento agendado não encontrado com ID: " + id));
        
        payment.setStatus(ScheduledPaymentStatus.CANCELLED);
        
        ScheduledPayment updatedPayment = scheduledPaymentRepository.save(payment);
        log.info("Pagamento agendado cancelado: {}", updatedPayment.getId());
        
        return ScheduledPaymentDTO.fromEntity(updatedPayment);
    }
    
    /**
     * Enviar alertas para pagamentos vencendo em 3 dias
     */
    @Transactional
    public void sendAlertsForPaymentsDueInThreeDays() {
        log.info("Enviando alertas para pagamentos vencendo em 3 dias");
        
        LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
        List<ScheduledPayment> payments = scheduledPaymentRepository.findPaymentsDueOnDateWithoutAlert(threeDaysFromNow);
        
        for (ScheduledPayment payment : payments) {
            try {
                // Enviar notificação
                sendPaymentDueAlert(payment);
                
                // Marcar alerta como enviado
                payment.setAlertSent(true);
                payment.setAlertSentDate(LocalDateTime.now());
                scheduledPaymentRepository.save(payment);
                
                log.info("Alerta enviado para pagamento: {}", payment.getId());
            } catch (Exception e) {
                log.error("Erro ao enviar alerta para pagamento {}: {}", payment.getId(), e.getMessage());
            }
        }
        
        log.info("Alertas enviados para {} pagamentos", payments.size());
    }
    
    /**
     * Enviar alerta individual para pagamento
     */
    private void sendPaymentDueAlert(ScheduledPayment payment) {
        // Aqui você pode implementar a lógica de envio de notificação
        // Por exemplo, criar uma notificação no sistema ou enviar email
        log.info("Enviando alerta para pagamento vencendo em 3 dias: {} - Cliente: {} - Valor: {}", 
                payment.getId(), payment.getClient().getName(), payment.getAmount());
        
        // TODO: Implementar envio de notificação via NotificationService
        // notificationService.createNotification(...);
    }
}
