package com.z7design.fleet_manager.service.email;

import com.z7design.fleet_manager.dto.CreateCompanyMailboxRequest;
import com.z7design.fleet_manager.dto.EmailAccountDTO;
import com.z7design.fleet_manager.dto.EmailAccountRequest;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.UserConsentRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Cria uma caixa corporativa no Mailcow, garante o DNS no Cloudflare e
 * registra a conta no módulo de e-mail do FleetManager.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailProvisioningService {

    private final MailcowProvisioningService mailcow;
    private final CloudflareDnsService cloudflare;
    private final EmailAccountService emailAccountService;
    private final CompanyRepository companyRepository;
    private final UserConsentRepository userConsentRepository;

    @Transactional
    public EmailAccountDTO createMailbox(CreateCompanyMailboxRequest request, User currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("Usuário não autenticado");
        }
        if (!StringUtils.hasText(request.getEmailAddress())
                || !request.getEmailAddress().contains("@")) {
            throw new IllegalArgumentException("Informe o e-mail completo do novo usuário");
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Informe a senha da nova caixa");
        }

        UUID companyId = TenantContext.get() != null ? TenantContext.get() : currentUser.getCompanyId();
        Company company = companyId != null ? companyRepository.findById(companyId).orElse(null) : null;
        if (company == null || !StringUtils.hasText(company.getEmailDomain())) {
            throw new IllegalArgumentException("A empresa não possui domínio de e-mail cadastrado");
        }
        if (!userConsentRepository.hasAcceptedProfessionalEmail(currentUser.getId())) {
            throw new IllegalStateException(
                    "Aceite o termo de uso profissional de e-mail (LGPD) antes de criar a caixa.");
        }

        String email = request.getEmailAddress().trim().toLowerCase(Locale.ROOT);
        String domain = email.substring(email.lastIndexOf('@') + 1);
        String allowed = company.getEmailDomain().trim().toLowerCase(Locale.ROOT).replaceFirst("^@", "");
        if (!allowed.equals(domain)) {
            throw new IllegalArgumentException("O e-mail deve usar o domínio da empresa: @" + allowed);
        }
        String localPart = email.substring(0, email.lastIndexOf('@'));

        // 1) Mailcow: domínio + caixa + chave DKIM
        mailcow.ensureDomain(domain);
        mailcow.createMailbox(domain, localPart, request.getDisplayName(), request.getPassword(), request.getQuotaMb());
        Map<String, String> dkim = mailcow.getDkimRecord(domain);

        // 2) Cloudflare: registros DNS (falha aqui não desfaz a caixa, mas é sinalizada)
        cloudflare.ensureMailRecords(domain, dkim);

        // 3) Registra/conecta a conta no módulo de e-mail
        EmailAccountRequest accountRequest = EmailAccountRequest.builder()
                .emailAddress(email)
                .displayName(request.getDisplayName())
                .username(email)
                .password(request.getPassword())
                .imapHost("imap." + domain)
                .imapPort(993)
                .imapSsl(true)
                .smtpHost("smtp." + domain)
                .smtpPort(587)
                .smtpSsl(false)
                .build();
        return emailAccountService.create(accountRequest, currentUser);
    }
}
