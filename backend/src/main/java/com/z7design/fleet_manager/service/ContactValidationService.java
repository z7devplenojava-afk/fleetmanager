package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.UserStatus;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactValidationService {
    
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    /**
     * Valida contatos de funcionÃ¡rios para envio
     */
    @Transactional(readOnly = true)
    public ContactValidationResponse validateContacts(ContactValidationRequest request) {
        log.info("ðŸ” Validando contatos para {} funcionÃ¡rios - Tipo: {}", 
                request.getEmployeeIds().size(), request.getType());
        
        List<ContactValidationDetail> details = new ArrayList<>();
        
        for (UUID empId : request.getEmployeeIds()) {
            Optional<Employee> empOpt = employeeRepository.findById(empId);
            
            if (empOpt.isEmpty()) {
                log.warn("âš ï¸ FuncionÃ¡rio nÃ£o encontrado: {}", empId);
                ContactValidationDetail detail = ContactValidationDetail.builder()
                        .employeeId(empId)
                        .status("error")
                        .generalError("FuncionÃ¡rio nÃ£o encontrado")
                        .build();
                details.add(detail);
                continue;
            }
            
            Employee emp = empOpt.get();
            ContactValidationDetail detail = validateEmployee(emp, request.getType());
            details.add(detail);
        }
        
        // Calcular estatÃ­sticas
        long readyToSend = details.stream()
                .filter(d -> "ready".equals(d.getStatus()))
                .count();
        
        long needingAction = details.stream()
                .filter(d -> "needs_action".equals(d.getStatus()))
                .count();
        
        long withErrors = details.stream()
                .filter(d -> "error".equals(d.getStatus()))
                .count();
        
        boolean allReady = readyToSend == details.size();
        
        String message;
        if (allReady) {
            message = String.format("Todos os %d funcionÃ¡rios estÃ£o prontos para envio!", details.size());
        } else if (needingAction > 0) {
            message = String.format("%d funcionÃ¡rio(s) precisam de aÃ§Ã£o antes do envio", needingAction);
        } else {
            message = String.format("%d funcionÃ¡rio(s) com erros", withErrors);
        }
        
        return ContactValidationResponse.builder()
                .details(details)
                .totalEmployees(details.size())
                .readyToSend(readyToSend)
                .needingAction(needingAction)
                .withErrors(withErrors)
                .allReady(allReady)
                .message(message)
                .build();
    }
    
    /**
     * Valida um funcionÃ¡rio especÃ­fico
     */
    private ContactValidationDetail validateEmployee(Employee emp, String type) {
        ContactValidationDetail detail = ContactValidationDetail.builder()
                .employeeId(emp.getId())
                .employeeName(emp.getName())
                .employeeCpf(emp.getDocument())
                .employeeEmail(emp.getEmail())
                .employeePhone(emp.getPhone())
                .build();
        
        // Buscar User correspondente pelo CPF
        Optional<User> userOpt = userRepository.findByUsername(emp.getDocument());
        
        if (userOpt.isEmpty()) {
            detail.setHasUser(false);
            detail.setNeedsUserCreation(true);
            detail.setStatus("needs_action");
            detail.setStatusMessage("UsuÃ¡rio nÃ£o cadastrado no sistema");
            
            if ("email".equals(type)) {
                detail.setCanSendEmail(emp.getEmail() != null && !emp.getEmail().trim().isEmpty());
                if (!detail.isCanSendEmail()) {
                    detail.setEmailError("Email nÃ£o cadastrado no funcionÃ¡rio");
                }
            } else if ("whatsapp".equals(type) || "both".equals(type)) {
                detail.setCanSendWhatsApp(false);
                detail.setWhatsappError("NecessÃ¡rio criar usuÃ¡rio primeiro");
            }
            
            return detail;
        }
        
        // User existe - validar campos
        User user = userOpt.get();
        detail.setHasUser(true);
        detail.setUserId(user.getId());
        detail.setUserEmail(user.getEmail());
        detail.setUserWhatsapp(user.getWhatsapp());
        boolean hasWhatsAppConsent = Boolean.TRUE.equals(user.getWhatsappConsent());
        detail.setHasWhatsAppConsent(hasWhatsAppConsent);
        detail.setWhatsappConsentDate(user.getWhatsappConsentDate());
        
        // Validar Email
        if ("email".equals(type) || "both".equals(type)) {
            String emailToUse = user.getEmail() != null ? user.getEmail() : emp.getEmail();
            detail.setCanSendEmail(emailToUse != null && !emailToUse.trim().isEmpty());
            
            if (!detail.isCanSendEmail()) {
                detail.setEmailError("Email nÃ£o cadastrado");
                detail.setNeedsEmailUpdate(true);
            }
        }
        
        // Validar WhatsApp: primeiro em users, depois em employees
        if ("whatsapp".equals(type) || "both".equals(type)) {
            String whatsapp = user.getWhatsapp();
            
            // Se nÃ£o encontrou em users, verificar em employees
            if (whatsapp == null || whatsapp.trim().isEmpty()) {
                String employeeWhatsapp = emp.getPhone();
                if (employeeWhatsapp != null && !employeeWhatsapp.trim().isEmpty()) {
                    whatsapp = employeeWhatsapp;
                    log.info("âœ… WhatsApp encontrado em employees para CPF {}: {}", emp.getDocument(), whatsapp);
                    // Atualizar o user com o WhatsApp do employee
                    user.setWhatsapp(whatsapp);
                    userRepository.save(user);
                    log.info("âœ… WhatsApp atualizado na tabela users");
                    // Atualizar o detail tambÃ©m
                    detail.setUserWhatsapp(whatsapp);
                }
            }
            
            if (whatsapp == null || whatsapp.trim().isEmpty()) {
                detail.setCanSendWhatsApp(false);
                detail.setWhatsappError("WhatsApp nÃ£o cadastrado em users nem em employees");
                detail.setNeedsWhatsAppUpdate(true);
            } else {
                // Validar formato
                String normalized = whatsapp.replaceAll("[^0-9]", "");
                if (normalized.length() >= 10 && normalized.length() <= 13) {
                    if (hasWhatsAppConsent) {
                        detail.setCanSendWhatsApp(true);
                        detail.setNeedsWhatsAppConsent(false);
                    } else {
                        detail.setCanSendWhatsApp(false);
                        detail.setNeedsWhatsAppConsent(true);
                        detail.setWhatsappError("Consentimento WhatsApp nÃ£o registrado");
                    }
                } else {
                    detail.setCanSendWhatsApp(false);
                    detail.setWhatsappError("NÃºmero de WhatsApp em formato invÃ¡lido");
                    detail.setNeedsWhatsAppUpdate(true);
                }
            }
        }
        
        // Determinar status final
        boolean isReady = false;
        
        if ("email".equals(type)) {
            isReady = detail.isCanSendEmail();
        } else if ("whatsapp".equals(type)) {
            isReady = detail.isCanSendWhatsApp();
        } else if ("both".equals(type)) {
            isReady = detail.isCanSendEmail() && detail.isCanSendWhatsApp();
        }
        
        if (isReady) {
            detail.setStatus("ready");
            detail.setStatusMessage("Pronto para envio");
        } else if (detail.isNeedsUserCreation() || detail.isNeedsWhatsAppUpdate() || detail.isNeedsWhatsAppConsent() || detail.isNeedsEmailUpdate()) {
            detail.setStatus("needs_action");
            
            List<String> actions = new ArrayList<>();
            if (detail.isNeedsUserCreation()) actions.add("criar usuÃ¡rio");
            if (detail.isNeedsWhatsAppUpdate()) actions.add("adicionar WhatsApp");
            if (detail.isNeedsWhatsAppConsent()) actions.add("confirmar consentimento WhatsApp");
            if (detail.isNeedsEmailUpdate()) actions.add("adicionar email");
            
            detail.setStatusMessage("AÃ§Ã£o necessÃ¡ria: " + String.join(", ", actions));
        } else {
            detail.setStatus("error");
            detail.setStatusMessage("Erro na validaÃ§Ã£o");
        }
        
        return detail;
    }
    
    /**
     * Cria usuÃ¡rio rapidamente para um funcionÃ¡rio
     */
    @Transactional
    public User quickCreateUser(QuickUserCreateRequest request) {
        log.info("ðŸ‘¤ Criando usuÃ¡rio rÃ¡pido para funcionÃ¡rio: {}", request.getEmployeeId());
        
        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Verificar se jÃ¡ existe usuÃ¡rio com este CPF
        Optional<User> existingUser = userRepository.findByUsername(emp.getDocument());
        if (existingUser.isPresent()) {
            throw new IllegalStateException("JÃ¡ existe usuÃ¡rio cadastrado para este CPF");
        }
        
        // Determinar email
        String email = request.getEmail() != null ? request.getEmail() : emp.getEmail();
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email Ã© obrigatÃ³rio");
        }
        
        // Senha padrÃ£o: CPF@2025
        String defaultPassword = emp.getDocument().replaceAll("[^0-9]", "") + "@2025";
        
        // Criar usuÃ¡rio
        User user = User.builder()
                .username(emp.getDocument()) // CPF
                .password(passwordEncoder.encode(defaultPassword))
                .email(email)
                .name(emp.getName())
                .whatsapp(request.getWhatsapp())
                .status(UserStatus.ACTIVE)
                .active(true)
                .roles(new HashSet<>(Collections.singletonList(
                        roleRepository.findByName("ROLE_COLABORADOR")
                                .orElseThrow(() -> new IllegalStateException("Role COLABORADOR nÃ£o encontrada"))
                )))
                .build();
        
        User savedUser = userRepository.save(user);
        log.info("âœ… UsuÃ¡rio criado: {} - ID: {}", savedUser.getUsername(), savedUser.getId());
        
        // Vincular ao Employee
        emp.setUser(savedUser);
        employeeRepository.save(emp);
        log.info("âœ… UsuÃ¡rio vinculado ao funcionÃ¡rio");
        
        // Enviar email de boas-vindas (se solicitado)
        if (request.isSendWelcomeEmail()) {
            try {
                sendWelcomeEmail(savedUser, defaultPassword);
            } catch (Exception e) {
                log.error("âŒ Erro ao enviar email de boas-vindas: {}", e.getMessage());
                // NÃ£o falhar a criaÃ§Ã£o por causa do email
            }
        }
        
        return savedUser;
    }
    
    /**
     * Atualiza WhatsApp de um usuÃ¡rio
     */
    @Transactional
    public User updateUserWhatsApp(UUID userId, UpdateWhatsAppRequest request) {
        log.info("ðŸ“± Atualizando WhatsApp do usuÃ¡rio: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio nÃ£o encontrado"));
        
        // Validar formato (apenas nÃºmeros)
        String normalized = request.getWhatsapp().replaceAll("[^0-9]", "");
        if (normalized.length() < 10 || normalized.length() > 13) {
            throw new IllegalArgumentException("NÃºmero de WhatsApp invÃ¡lido (deve ter 10-13 dÃ­gitos)");
        }
        
        user.setWhatsapp(normalized);
        User updated = userRepository.save(user);
        
        log.info("âœ… WhatsApp atualizado: {} -> {}", user.getUsername(), normalized);
        
        return updated;
    }

    /**
     * Atualiza email de um usuÃ¡rio
     */
    @Transactional
    public User updateUserEmail(UUID userId, UpdateEmailRequest request) {
        log.info("ðŸ“§ Atualizando email do usuÃ¡rio: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio nÃ£o encontrado"));

        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        if (email.isEmpty() || !email.contains("@")) {
            throw new IllegalArgumentException("Email invÃ¡lido");
        }

        user.setEmail(email);
        User updated = userRepository.save(user);

        log.info("âœ… Email atualizado: {} -> {}", user.getUsername(), email);

        return updated;
    }
    
    /**
     * Envia email de boas-vindas com credenciais
     */
    private void sendWelcomeEmail(User user, String password) {
        String subject = "Bem-vindo ao Secured Guard - Suas Credenciais de Acesso";
        
        String htmlBody = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #333;">OlÃ¡, %s!</h2>
                    <p>Seu usuÃ¡rio foi criado no sistema <strong>Secured Guard</strong>.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Suas credenciais de acesso:</h3>
                        <p><strong>UsuÃ¡rio:</strong> %s</p>
                        <p><strong>Senha:</strong> %s</p>
                    </div>
                    
                    <p style="color: #e53935;"><strong>âš ï¸ Por favor, altere sua senha no primeiro acesso.</strong></p>
                    
                    <p>
                        <a href="https://ci.z7botsolutions.com.br/login" 
                           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Acessar Sistema
                        </a>
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="color: #777; font-size: 12px;">
                        Atenciosamente,<br>
                        <strong>Equipe Secured Guard</strong>
                    </p>
                </body>
                </html>
                """, user.getName(), user.getUsername(), password);
        
        // Usa o mÃ©todo existente sendEmailWithAttachment sem anexo
        emailService.sendEmailWithAttachment(user.getEmail(), subject, htmlBody, null, null);
        log.info("ðŸ“§ Email de boas-vindas enviado para: {}", user.getEmail());
    }
}


