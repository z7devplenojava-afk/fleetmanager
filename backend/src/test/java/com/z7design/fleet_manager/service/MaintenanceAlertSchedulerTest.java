package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.OverdueMaintenanceAlertDTO;
import com.z7design.fleet_manager.model.Message;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.MessageRepository;
import com.z7design.fleet_manager.repository.NotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Testes do MaintenanceAlertScheduler: dedupe diário, seleção de
 * destinatários por empresa, agregação, e-mail e alertas UPCOMING.
 */
@ExtendWith(MockitoExtension.class)
class MaintenanceAlertSchedulerTest {

    @Mock
    private MaintenancePlanService maintenancePlanService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private JavaMailSender mailSender;

    private MaintenanceAlertScheduler scheduler;

    private UUID companyId;
    private User supervisor;
    private OverdueMaintenanceAlertDTO overdueAlert;
    private OverdueMaintenanceAlertDTO upcomingAlert;

    @BeforeEach
    void setUp() throws Exception {
        scheduler = new MaintenanceAlertScheduler(
                maintenancePlanService, userRepository, notificationRepository, messageRepository, mailSender);

        var field = MaintenanceAlertScheduler.class.getDeclaredField("emailEnabled");
        field.setAccessible(true);
        field.set(scheduler, false);

        var fromField = MaintenanceAlertScheduler.class.getDeclaredField("fromEmail");
        fromField.setAccessible(true);
        fromField.set(scheduler, "test@noreply.com");

        companyId = UUID.randomUUID();

        supervisor = new User();
        supervisor.setId(UUID.randomUUID());
        supervisor.setName("Supervisor Teste");
        supervisor.setCompanyId(companyId);

        overdueAlert = OverdueMaintenanceAlertDTO.builder()
                .companyId(companyId)
                .vehicleId(UUID.randomUUID())
                .plate("TST1A23")
                .vehicleModel("Modelo")
                .vehicleBrand("Marca")
                .planId(UUID.randomUUID())
                .taskName("Troca de óleo")
                .message("Vencida há 200 km")
                .build();

        upcomingAlert = OverdueMaintenanceAlertDTO.builder()
                .companyId(companyId)
                .vehicleId(UUID.randomUUID())
                .plate("UPC4B77")
                .vehicleModel("Modelo")
                .vehicleBrand("Marca")
                .planId(UUID.randomUUID())
                .taskName("Revisão de freios")
                .message("Faltam 300 km")
                .build();
    }

    // ── OVERDUE (comportamento original) ──────────────────────────────────────

    @Test
    @DisplayName("Deve criar notificação e mensagem do sino para supervisor (OVERDUE)")
    void shouldCreateNotificationForCompanySupervisor() {
        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(overdueAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(userRepository.findSystemMessageSenderCandidates()).thenReturn(List.of(supervisor));
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);
        when(messageRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);

        int created = scheduler.notifyOverdueMaintenance();

        assertEquals(1, created);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertEquals(supervisor.getId(), saved.getUser().getId());
        assertEquals(companyId, saved.getCompanyId());
        assertTrue(saved.getTitle().startsWith("🔧 Manutenção Preventiva Vencida"));
        assertTrue(saved.getMessage().contains("TST1A23"));

        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        Message bellMessage = msgCaptor.getValue();
        assertEquals(supervisor.getId(), bellMessage.getSender().getId());
        assertTrue(bellMessage.getTitle().startsWith("🔧 Manutenção Preventiva Vencida"));
        assertEquals(com.z7design.fleet_manager.model.enums.MessagePriority.HIGH,
                bellMessage.getPriority());

        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("Não deve duplicar notificação no mesmo dia (dedupe)")
    void shouldNotDuplicateNotificationSameDay() {
        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(overdueAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(true);

        int created = scheduler.notifyOverdueMaintenance();

        assertEquals(0, created);
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("Supervisor de outra empresa não deve ser notificado")
    void shouldNotNotifySupervisorFromOtherCompany() {
        User foreignSupervisor = new User();
        foreignSupervisor.setId(UUID.randomUUID());
        foreignSupervisor.setName("Supervisor Alheio");
        foreignSupervisor.setCompanyId(UUID.randomUUID());

        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(overdueAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(foreignSupervisor));

        int created = scheduler.notifyOverdueMaintenance();

        assertEquals(0, created);
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("Nenhum plano vencido: nenhuma notificação")
    void shouldNotNotifyWhenNoOverduePlans() {
        when(maintenancePlanService.findOverduePlansGroupedByCompany()).thenReturn(Map.of());

        int created = scheduler.notifyOverdueMaintenance();

        assertEquals(0, created);
        verifyNoInteractions(userRepository);
        verifyNoInteractions(notificationRepository);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("Empresa sem supervisores ativos: apenas log, sem erro")
    void shouldSkipCompanyWithoutSupervisors() {
        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(overdueAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of());

        int created = scheduler.notifyOverdueMaintenance();

        assertEquals(0, created);
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    @DisplayName("Deve enviar e-mail apenas para VENCIDOS quando habilitado")
    void shouldSendEmailOnlyForOverdue() throws Exception {
        var field = MaintenanceAlertScheduler.class.getDeclaredField("emailEnabled");
        field.setAccessible(true);
        field.set(scheduler, true);

        supervisor.setEmail("supervisor@empresa.com");

        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(overdueAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(userRepository.findSystemMessageSenderCandidates()).thenReturn(List.of(supervisor));
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);
        when(messageRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);

        int created = scheduler.notifyOverdueMaintenance();

        assertEquals(1, created);
        verify(mailSender, times(1)).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Deve agrupar múltiplos planos vencidos e limitar a 10 no corpo")
    void shouldAggregateMultipleOverduePlans() throws Exception {
        var field = MaintenanceAlertScheduler.class.getDeclaredField("emailEnabled");
        field.setAccessible(true);
        field.set(scheduler, false);

        java.util.List<OverdueMaintenanceAlertDTO> alerts = new java.util.ArrayList<>();
        for (int i = 0; i < 12; i++) {
            alerts.add(OverdueMaintenanceAlertDTO.builder()
                    .companyId(companyId)
                    .vehicleId(UUID.randomUUID())
                    .plate("PLA" + i)
                    .taskName("Tarefa " + i)
                    .message("Vencida há " + (i * 10) + " km")
                    .build());
        }

        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, alerts));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(userRepository.findSystemMessageSenderCandidates()).thenReturn(List.of(supervisor));
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);
        when(messageRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);

        scheduler.notifyOverdueMaintenance();

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        String message = captor.getValue().getMessage();
        assertTrue(message.contains("12 planos"));
        assertTrue(message.contains("… e mais 2 plano(s)."));
        assertTrue(message.contains("PLA9"));
        assertFalse(message.contains("PLA10"));

        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        String bellContent = msgCaptor.getValue().getContent();
        assertTrue(bellContent.contains("PLA9"));
        assertFalse(bellContent.contains("PLA10"));
        assertTrue(bellContent.contains("… e mais 2 plano(s)."));
    }

    // ── UPCOMING (novo) ───────────────────────────────────────────────────────

    @Test
    @DisplayName("UPCOMING: notifica com título 'Próxima', prioridade NORMAL e sem e-mail")
    void shouldNotifyUpcomingWithNormalPriorityAndNoEmail() throws Exception {
        var field = MaintenanceAlertScheduler.class.getDeclaredField("emailEnabled");
        field.setAccessible(true);
        field.set(scheduler, true); // e-mail global ligado, mas UPCOMING não envia

        supervisor.setEmail("supervisor@empresa.com");

        when(maintenancePlanService.findUpcomingPlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(upcomingAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(userRepository.findSystemMessageSenderCandidates()).thenReturn(List.of(supervisor));
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);
        when(messageRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);

        int created = scheduler.notifyUpcomingMaintenance();

        assertEquals(1, created);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());
        Notification notification = notifCaptor.getValue();
        assertTrue(notification.getTitle().startsWith("🔧 Manutenção Preventiva Próxima"));
        assertTrue(notification.getMessage().contains("UPC4B77"));
        assertTrue(notification.getMessage().contains("Faltam 300 km"));

        ArgumentCaptor<Message> msgCaptor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(msgCaptor.capture());
        Message bellMessage = msgCaptor.getValue();
        assertTrue(bellMessage.getTitle().startsWith("🔧 Manutenção Preventiva Próxima"));
        assertEquals(com.z7design.fleet_manager.model.enums.MessagePriority.NORMAL,
                bellMessage.getPriority());

        verify(mailSender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    @DisplayName("UPCOMING: dedupe independente do OVERDUE (mesmo usuário, mesmo dia)")
    void upcomingDedupeIsIndependentFromOverdue() {
        // OVERDUE já notificado hoje; UPCOMING deve passar
        when(maintenancePlanService.findUpcomingPlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(upcomingAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(userRepository.findSystemMessageSenderCandidates()).thenReturn(List.of(supervisor));
        // dedupe por título: exists() recebe o título do kind — simular OVERDUE existente
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any()))
                .thenAnswer(inv -> ((String) inv.getArgument(1)).startsWith("🔧 Manutenção Preventiva Vencida"));
        when(messageRepository.existsMaintenanceAlertToday(any(), anyString(), any()))
                .thenAnswer(inv -> ((String) inv.getArgument(1)).startsWith("🔧 Manutenção Preventiva Vencida"));

        int created = scheduler.notifyUpcomingMaintenance();

        assertEquals(1, created);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertTrue(captor.getValue().getTitle().startsWith("🔧 Manutenção Preventiva Próxima"));
    }

    @Test
    @DisplayName("UPCOMING: nenhum plano próximo — nenhuma notificação")
    void shouldNotNotifyWhenNoUpcomingPlans() {
        when(maintenancePlanService.findUpcomingPlansGroupedByCompany()).thenReturn(Map.of());

        int created = scheduler.notifyUpcomingMaintenance();

        assertEquals(0, created);
        verifyNoInteractions(userRepository);
        verifyNoInteractions(notificationRepository);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("Job diário deve processar ambos os kinds")
    void dailyJobShouldProcessBothKinds() {
        when(maintenancePlanService.findOverduePlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(overdueAlert)));
        when(maintenancePlanService.findUpcomingPlansGroupedByCompany())
                .thenReturn(Map.of(companyId, List.of(upcomingAlert)));
        when(userRepository.findSupervisors()).thenReturn(List.of(supervisor));
        when(userRepository.findSystemMessageSenderCandidates()).thenReturn(List.of(supervisor));
        when(notificationRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);
        when(messageRepository.existsMaintenanceAlertToday(any(), anyString(), any())).thenReturn(false);

        scheduler.checkOverdueMaintenancePlans();

        // 2 notificações: uma OVERDUE + uma UPCOMING
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        List<String> titles = captor.getAllValues().stream()
                .map(Notification::getTitle).collect(java.util.stream.Collectors.toList());
        assertTrue(titles.stream().anyMatch(t -> t.startsWith("🔧 Manutenção Preventiva Vencida")));
        assertTrue(titles.stream().anyMatch(t -> t.startsWith("🔧 Manutenção Preventiva Próxima")));
    }
}
