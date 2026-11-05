package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.event.WorkOrderCompletedEvent;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WhatsAppOutbox;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxKind;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.WhatsAppOutboxRepository;
import com.z7design.fleet_manager.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkOrderCompletedOutboxServiceTest {

    @Mock
    private FleetWorkOrderRepository workOrderRepository;

    @Mock
    private WhatsAppOutboxRepository outboxRepository;

    @Mock
    private DriverContactResolver contactResolver;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DriverRepository driverRepository;

    private WorkOrderCompletedOutboxService service;
    private UUID companyId;
    private UUID workOrderId;

    @BeforeEach
    void setUp() {
        WorkOrderNotificationMessageFactory messageFactory = new WorkOrderNotificationMessageFactory();
        service = new WorkOrderCompletedOutboxService(
                workOrderRepository,
                outboxRepository,
                contactResolver,
                messageFactory,
                notificationService,
                userRepository,
                employeeRepository,
                driverRepository);
        ReflectionTestUtils.setField(service, "maxAttempts", 5);
        companyId = UUID.randomUUID();
        workOrderId = UUID.randomUUID();
    }

    @Test
    @DisplayName("enfileira texto e documento para o motorista")
    void enqueuesTextAndDocument() {
        FleetWorkOrder order = completedOrder();
        when(workOrderRepository.findActiveById(workOrderId)).thenReturn(Optional.of(order));
        when(contactResolver.resolve(order)).thenReturn(Optional.of(
                new DriverContact("Carlos Pereira", "5511999999999", "vehicle.assignedDriver")));
        when(outboxRepository.existsByDedupeKey(anyString())).thenReturn(false);

        service.enqueueForCompletedWorkOrder(new WorkOrderCompletedEvent(workOrderId, companyId));

        ArgumentCaptor<WhatsAppOutbox> captor = ArgumentCaptor.forClass(WhatsAppOutbox.class);
        verify(outboxRepository, times(2)).save(captor.capture());

        List<WhatsAppOutbox> rows = captor.getAllValues();
        assertTrue(rows.stream().anyMatch(r -> r.getKind() == WhatsAppOutboxKind.TEXT));
        assertTrue(rows.stream().anyMatch(r -> r.getKind() == WhatsAppOutboxKind.DOCUMENT));
        assertTrue(rows.stream().allMatch(r -> companyId.equals(r.getCompanyId())));
        assertTrue(rows.stream().allMatch(r -> "5511999999999".equals(r.getRecipientPhone())));

        WhatsAppOutbox text = rows.stream()
                .filter(r -> r.getKind() == WhatsAppOutboxKind.TEXT)
                .findFirst().orElseThrow();
        assertTrue(text.getMessageText().contains("OS-1"));
        assertTrue(text.getMessageText().contains("ABC1D23"));

        WhatsAppOutbox document = rows.stream()
                .filter(r -> r.getKind() == WhatsAppOutboxKind.DOCUMENT)
                .findFirst().orElseThrow();
        assertEquals("OS-1-ABC1D23.pdf", document.getDocumentFilename());
    }

    @Test
    @DisplayName("nao duplica mensagens ja existentes na outbox")
    void skipsExistingMessages() {
        FleetWorkOrder order = completedOrder();
        when(workOrderRepository.findActiveById(workOrderId)).thenReturn(Optional.of(order));
        when(contactResolver.resolve(order)).thenReturn(Optional.of(
                new DriverContact("Carlos Pereira", "5511999999999", "vehicle.assignedDriver")));
        when(outboxRepository.existsByDedupeKey(anyString())).thenReturn(true);

        service.enqueueForCompletedWorkOrder(new WorkOrderCompletedEvent(workOrderId, companyId));

        verify(outboxRepository, never()).save(any());
    }

    @Test
    @DisplayName("cria notificacao interna quando nao ha contato do motorista")
    void notifiesWhenContactIsMissing() {
        FleetWorkOrder order = completedOrder();
        UUID requesterId = UUID.randomUUID();
        order.setRequesterId(requesterId);

        com.z7design.fleet_manager.model.User user = com.z7design.fleet_manager.model.User.builder()
                .id(requesterId)
                .name("Gestor")
                .username("gestor")
                .build();

        when(workOrderRepository.findActiveById(workOrderId)).thenReturn(Optional.of(order));
        when(contactResolver.resolve(order)).thenReturn(Optional.empty());
        when(userRepository.findById(requesterId)).thenReturn(Optional.of(user));

        service.enqueueForCompletedWorkOrder(new WorkOrderCompletedEvent(workOrderId, companyId));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationService).create(captor.capture());
        assertEquals(companyId, captor.getValue().getCompanyId());
        assertTrue(captor.getValue().getMessage().contains("OS-1"));
        verify(outboxRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancela o envio quando o evento vem de outra empresa")
    void blocksCrossTenantEvent() {
        FleetWorkOrder order = completedOrder();
        when(workOrderRepository.findActiveById(workOrderId)).thenReturn(Optional.of(order));

        service.enqueueForCompletedWorkOrder(new WorkOrderCompletedEvent(workOrderId, UUID.randomUUID()));

        verify(contactResolver, never()).resolve(any());
        verify(outboxRepository, never()).save(any());
        verify(notificationService, never()).create(any());
    }

    private FleetWorkOrder completedOrder() {
        Vehicle vehicle = new Vehicle();
        vehicle.setCompanyId(companyId);
        vehicle.setPlate("ABC1D23");
        vehicle.setBrand("Mercedes");
        vehicle.setModel("Sprinter");

        return FleetWorkOrder.builder()
                .id(workOrderId)
                .companyId(companyId)
                .osNumber("OS-1")
                .vehicle(vehicle)
                .maintenancePerformed("Troca de óleo e filtros")
                .build();
    }
}
