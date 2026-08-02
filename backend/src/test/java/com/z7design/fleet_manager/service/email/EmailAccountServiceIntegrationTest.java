package com.z7design.fleet_manager.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.EmailAccountDTO;
import com.z7design.fleet_manager.dto.EmailAccountRequest;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Teste de integração do EmailAccountService com repositórios mockados.
 * Cobre a criação de contas (validação, prevenção de duplicidade, defaults,
 * resolução da empresa via TenantContext/usuário e persistência da senha que
 * é criptografada pelo EmailCryptoConverter no momento da escrita), a listagem
 * de contas com contadores e a exclusão (incluindo conta inexistente).
 */
class EmailAccountServiceIntegrationTest {

    private EmailAccountRepository accountRepository;
    private EmailFolderRepository folderRepository;
    private EmailMessageRepository messageRepository;
    private EmailMessageAttachmentRepository attachmentRepository;

    private EmailAccountService emailAccountService;

    private UUID companyId;

    @BeforeEach
    void setUp() {
        accountRepository = mock(EmailAccountRepository.class);
        folderRepository = mock(EmailFolderRepository.class);
        messageRepository = mock(EmailMessageRepository.class);
        attachmentRepository = mock(EmailMessageAttachmentRepository.class);
        AuthenticationService authenticationService = mock(AuthenticationService.class);

        emailAccountService = new EmailAccountService(
                accountRepository, folderRepository, messageRepository,
                attachmentRepository, authenticationService, new ObjectMapper());

        companyId = UUID.randomUUID();
        TenantContext.clear(); // isola o ThreadLocal entre execuções
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ════════════════════════════════════════════════════════════════
    // Criação de conta (com criptografia de credenciais)
    // ════════════════════════════════════════════════════════════════

    @Test
    void create_ShouldPersistAccount_WithDefaults_AndPasswordForEncryption() {
        User user = User.builder().id(UUID.randomUUID()).companyId(companyId).build();
        EmailAccountRequest request = EmailAccountRequest.builder()
                .emailAddress("  User@Test.com  ")
                .imapHost("imap.test.com")
                .smtpHost("smtp.test.com")
                .password("senha-super-secreta")
                .build();

        when(accountRepository.findByCompanyIdAndEmailAddressIgnoreCase(
                eq(companyId), eq("user@test.com"))).thenReturn(Optional.empty());
        when(accountRepository.save(any(EmailAccount.class))).thenAnswer(inv -> {
            EmailAccount a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        EmailAccountDTO dto = emailAccountService.create(request, user);

        ArgumentCaptor<EmailAccount> captor = ArgumentCaptor.forClass(EmailAccount.class);
        verify(accountRepository).save(captor.capture());
        EmailAccount saved = captor.getValue();

        // E-mail normalizado (trim + lowercase)
        assertEquals("user@test.com", saved.getEmailAddress());
        // A senha é gravada no campo com @Convert(EmailCryptoConverter.class);
        // a criptografia em si é aplicada na persistência (ver EmailCryptoConverterTest)
        assertEquals("senha-super-secreta", saved.getPassword());
        // Defaults aplicados
        assertEquals(993, saved.getImapPort());
        assertEquals(Boolean.TRUE, saved.getImapSsl());
        assertEquals(587, saved.getSmtpPort());
        assertEquals(Boolean.FALSE, saved.getSmtpSsl());
        assertEquals("PASSWORD", saved.getAuthType());
        assertEquals("ACTIVE", saved.getStatus());
        assertEquals("NEVER", saved.getLastSyncStatus());
        // Vínculo com a empresa e usuário autenticado
        assertEquals(companyId, saved.getCompanyId());
        assertEquals(user.getId(), saved.getUserId());

        // DTO reflete os dados persistidos
        assertEquals("user@test.com", dto.getEmailAddress());
        assertEquals("imap.test.com", dto.getImapHost());
    }

    @Test
    void create_ShouldUseTenantContext_ForCompanyId() {
        TenantContext.set(companyId);
        User user = User.builder().id(UUID.randomUUID()).build(); // sem companyId
        EmailAccountRequest request = validRequest();

        when(accountRepository.findByCompanyIdAndEmailAddressIgnoreCase(
                eq(companyId), eq("user@test.com"))).thenReturn(Optional.empty());
        when(accountRepository.save(any(EmailAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        emailAccountService.create(request, user);

        ArgumentCaptor<EmailAccount> captor = ArgumentCaptor.forClass(EmailAccount.class);
        verify(accountRepository).save(captor.capture());
        assertEquals(companyId, captor.getValue().getCompanyId());
    }

    @Test
    void create_ShouldFallbackToCurrentUserCompany_WhenNoTenantContext() {
        UUID userCompanyId = UUID.randomUUID();
        User user = User.builder().id(UUID.randomUUID()).companyId(userCompanyId).build();
        EmailAccountRequest request = validRequest();

        when(accountRepository.findByCompanyIdAndEmailAddressIgnoreCase(
                eq(userCompanyId), eq("user@test.com"))).thenReturn(Optional.empty());
        when(accountRepository.save(any(EmailAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        emailAccountService.create(request, user);

        ArgumentCaptor<EmailAccount> captor = ArgumentCaptor.forClass(EmailAccount.class);
        verify(accountRepository).save(captor.capture());
        assertEquals(userCompanyId, captor.getValue().getCompanyId());
    }

    @Test
    void create_ShouldThrow_WhenCompanyNotIdentified() {
        User user = User.builder().id(UUID.randomUUID()).build(); // sem companyId e sem TenantContext

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.create(validRequest(), user));
        assertTrue(ex.getMessage().contains("Empresa"));
        verify(accountRepository, never()).save(any());
    }

    @Test
    void create_ShouldThrow_WhenRequiredFieldsMissing() {
        User user = User.builder().id(UUID.randomUUID()).companyId(companyId).build();

        assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.create(
                        EmailAccountRequest.builder().imapHost("imap.test.com").password("x").build(), user));

        assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.create(
                        EmailAccountRequest.builder().emailAddress("user@test.com").password("x").build(), user));

        assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.create(
                        EmailAccountRequest.builder().emailAddress("user@test.com").imapHost("imap.test.com").build(), user));

        verify(accountRepository, never()).save(any());
    }

    @Test
    void create_ShouldThrow_WhenDuplicateAccountExists() {
        User user = User.builder().id(UUID.randomUUID()).companyId(companyId).build();
        EmailAccount existing = EmailAccount.builder()
                .id(UUID.randomUUID())
                .emailAddress("user@test.com")
                .build();
        when(accountRepository.findByCompanyIdAndEmailAddressIgnoreCase(
                eq(companyId), eq("user@test.com"))).thenReturn(Optional.of(existing));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.create(validRequest(), user));
        assertTrue(ex.getMessage().contains("já cadastrada"));
        verify(accountRepository, never()).save(any());
    }

    // ════════════════════════════════════════════════════════════════
    // Listagem de contas
    // ════════════════════════════════════════════════════════════════

    @Test
    void findAll_ShouldReturnDtos_WithCounts() {
        UUID accountId1 = UUID.randomUUID();
        UUID accountId2 = UUID.randomUUID();
        EmailAccount a1 = EmailAccount.builder().id(accountId1).emailAddress("a@test.com").build();
        EmailAccount a2 = EmailAccount.builder().id(accountId2).emailAddress("b@test.com").build();
        when(accountRepository.findByCompanyIdOrderByCreatedAtDesc(companyId))
                .thenReturn(List.of(a1, a2));
        when(messageRepository.countByAccount_IdAndReadFalse(accountId1)).thenReturn(2L);
        when(messageRepository.countByAccount_Id(accountId1)).thenReturn(5L);
        when(folderRepository.countByAccountId(accountId1)).thenReturn(3L);
        // a2 fica com os defaults do mock (0)

        List<EmailAccountDTO> dtos = emailAccountService.findAll(companyId);

        assertEquals(2, dtos.size());
        assertEquals("a@test.com", dtos.get(0).getEmailAddress());
        assertEquals(2, dtos.get(0).getUnreadCount());
        assertEquals(5, dtos.get(0).getTotalMessages());
        assertEquals(3, dtos.get(0).getFolderCount());
        assertEquals(0, dtos.get(1).getUnreadCount());

        verify(accountRepository).findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Test
    void findAll_ShouldReturnEmptyList_WhenNoAccounts() {
        when(accountRepository.findByCompanyIdOrderByCreatedAtDesc(companyId))
                .thenReturn(List.of());

        List<EmailAccountDTO> dtos = emailAccountService.findAll(companyId);

        assertTrue(dtos.isEmpty());
    }

    // ════════════════════════════════════════════════════════════════
    // Exclusão de contas
    // ════════════════════════════════════════════════════════════════

    @Test
    void delete_ShouldDeleteExistingAccount() {
        UUID id = UUID.randomUUID();
        EmailAccount account = EmailAccount.builder()
                .id(id)
                .emailAddress("user@test.com")
                .build();
        when(accountRepository.findById(id)).thenReturn(Optional.of(account));

        emailAccountService.delete(id);

        verify(accountRepository).delete(account);
    }

    @Test
    void delete_ShouldThrow_WhenAccountNotFound() {
        UUID id = UUID.randomUUID();
        when(accountRepository.findById(id)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.delete(id));
        assertTrue(ex.getMessage().contains("não encontrada"));
        verify(accountRepository, never()).delete(any());
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    private EmailAccountRequest validRequest() {
        return EmailAccountRequest.builder()
                .emailAddress("user@test.com")
                .imapHost("imap.test.com")
                .password("senha-secreta")
                .build();
    }
}
