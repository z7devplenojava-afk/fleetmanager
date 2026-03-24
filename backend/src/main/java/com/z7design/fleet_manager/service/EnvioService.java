package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EnvioRequest;
import com.z7design.fleet_manager.dto.EnvioResponse;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.DeliveryChannel;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.PayslipDeliveryLog;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.DocumentType;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PayslipDeliveryLogRepository;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class EnvioService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final PayslipRepository payslipRepository;
    private final PayslipDeliveryLogRepository deliveryLogRepository;
    private final PayslipService payslipService;

    @Autowired
    private com.z7design.fleet_manager.service.email.EmailConfigService emailConfigService;

    @Autowired
    private com.z7design.fleet_manager.service.email.EmailQueueService emailQueueService;

    // WhatsApp provider: Baileys REST API
    @Autowired(required = false)
    private BaileysRestService baileysRestService;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    // Construtor
    public EnvioService(
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            EmailService emailService,
            WhatsAppService whatsAppService,
            PayslipRepository payslipRepository,
            PayslipDeliveryLogRepository deliveryLogRepository,
            PayslipService payslipService) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.whatsAppService = whatsAppService;
        this.payslipRepository = payslipRepository;
        this.deliveryLogRepository = deliveryLogRepository;
        this.payslipService = payslipService;
    }

    public EnvioResponse enviarIndividual(EnvioRequest request) {
        log.info("🚀 Iniciando envio individual - Tipo: {}, FuncionarioId: {}, CPF: {}",
                request.getTipo(), request.getFuncionarioId(), request.getCpf());

        EnvioResponse response = EnvioResponse.builder()
                .sucesso(false)
                .dataEnvio(LocalDateTime.now())
                .tipoEnvio(request.getTipo())
                .totalEnviados(0)
                .totalFalhas(0)
                .detalhes(new ArrayList<>())
                .build();

        try {
            Employee employee = null;
            User user = null;

            // NOVA LÓGICA: Buscar primeiro na tabela USERS por CPF
            if (request.getCpf() != null && !request.getCpf().trim().isEmpty()) {
                String cpfBusca = request.getCpf();
                String cpfNormalizado = cpfBusca.replaceAll("[^0-9]", "");

                log.info("🔍 PASSO 1: Buscando USER por CPF: {}", cpfBusca);

                // Buscar user por username (que é o CPF)
                Optional<User> userOpt = userRepository.findByUsername(cpfNormalizado);

                if (userOpt.isEmpty()) {
                    // Tentar com CPF formatado
                    userOpt = userRepository.findByUsername(cpfBusca);
                }

                if (userOpt.isPresent()) {
                    user = userOpt.get();
                    log.info("✅ USER encontrado: {} (username: {})", user.getName(), user.getUsername());
                    log.info("📋 Dados do USER: ID={}, Email={}, WhatsApp='{}'",
                            user.getId(), user.getEmail(), user.getWhatsapp());

                    // Verificar WhatsApp: primeiro em users, depois em employees
                    String whatsappNumber = user.getWhatsapp();

                    // Agora buscar Employee correspondente (para verificar WhatsApp como fallback)
                    log.info("🔍 PASSO 2: Buscando EMPLOYEE correspondente...");
                    Optional<Employee> employeeOpt = employeeRepository.findByDocument(cpfNormalizado);

                    if (employeeOpt.isEmpty()) {
                        // Tentar buscar todos e normalizar
                        List<Employee> allEmployees = employeeRepository.findAll();
                        employeeOpt = allEmployees.stream()
                                .filter(e -> e.getDocument() != null)
                                .filter(e -> e.getDocument().replaceAll("[^0-9]", "").equals(cpfNormalizado))
                                .findFirst();
                    }

                    if (employeeOpt.isPresent()) {
                        employee = employeeOpt.get();
                        log.info("✅ EMPLOYEE encontrado: {}", employee.getName());

                        // Se não tem WhatsApp em users, verificar em employees
                        if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
                            String employeeWhatsapp = employee.getPhone();
                            if (employeeWhatsapp != null && !employeeWhatsapp.trim().isEmpty()) {
                                whatsappNumber = employeeWhatsapp;
                                log.info("✅ WhatsApp encontrado em employees: '{}' (tamanho: {} caracteres)",
                                        whatsappNumber, whatsappNumber.length());
                                // Atualizar o user com o WhatsApp do employee
                                user.setWhatsapp(whatsappNumber);
                                userRepository.save(user);
                                log.info("✅ WhatsApp atualizado na tabela users");
                            }
                        }
                    } else {
                        log.warn("⚠️ EMPLOYEE não encontrado, usando dados do USER");
                        // Criar Employee temporário com dados do User
                        employee = new Employee();
                        employee.setId(UUID.randomUUID());
                        employee.setName(user.getName());
                        employee.setDocument(cpfNormalizado);
                        employee.setEmail(user.getEmail());
                    }

                    // Validação final do WhatsApp
                    if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
                        log.warn("⚠️ WhatsApp não encontrado nem em users nem em employees!");
                        response.setMensagem(
                                "WhatsApp não cadastrado na tabela users nem na tabela employees para CPF: "
                                        + cpfBusca);
                        return response;
                    }

                    log.info("✅ WhatsApp encontrado: '{}' (tamanho: {} caracteres)",
                            whatsappNumber, whatsappNumber.length());

                } else {
                    log.error("❌ USER não encontrado com CPF: {}", cpfBusca);
                    response.setMensagem("Usuário não encontrado na tabela users para CPF: " + cpfBusca);
                    return response;
                }

            } else if (request.getFuncionarioId() != null && !request.getFuncionarioId().trim().isEmpty()) {
                // Busca por ID (mantém lógica antiga)
                log.info("🔍 Buscando funcionário por ID: {}", request.getFuncionarioId());
                Optional<Employee> employeeOpt = employeeRepository
                        .findById(UUID.fromString(request.getFuncionarioId()));

                if (employeeOpt.isEmpty()) {
                    log.error("❌ Funcionário não encontrado por ID");
                    response.setMensagem("Funcionário não encontrado");
                    return response;
                }

                employee = employeeOpt.get();
                log.info("✅ EMPLOYEE encontrado: {}", employee.getName());

                // Buscar User correspondente
                Optional<User> userOpt = userRepository.findByUsername(employee.getDocument());
                if (userOpt.isEmpty()) {
                    log.error("❌ USER não encontrado para o funcionário");
                    response.setMensagem("Usuário não encontrado na tabela users para CPF: " + employee.getDocument());
                    return response;
                }

                user = userOpt.get();

                // Verificar WhatsApp: primeiro em users, depois em employees
                String whatsappNumber = user.getWhatsapp();
                if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
                    log.warn("⚠️ USER não tem WhatsApp cadastrado, verificando em employees...");
                    String employeeWhatsapp = employee.getPhone();
                    if (employeeWhatsapp != null && !employeeWhatsapp.trim().isEmpty()) {
                        whatsappNumber = employeeWhatsapp;
                        log.info("✅ WhatsApp encontrado em employees: {}", whatsappNumber);
                        // Atualizar o user com o WhatsApp do employee
                        user.setWhatsapp(whatsappNumber);
                        userRepository.save(user);
                        log.info("✅ WhatsApp atualizado na tabela users");
                    } else {
                        log.warn("⚠️ WhatsApp não encontrado nem em users nem em employees!");
                        response.setMensagem(
                                "WhatsApp não cadastrado na tabela users nem na tabela employees para CPF: "
                                        + employee.getDocument());
                        return response;
                    }
                }

            } else {
                log.error("❌ Nenhum ID ou CPF fornecido!");
                response.setMensagem("ID do funcionário ou CPF é obrigatório");
                return response;
            }

            // Processar envio com Employee e User
            EnvioResponse.DetalheEnvio detalhe = processarEnvio(employee, request);

            response.getDetalhes().add(detalhe);

            if (detalhe.isEnviado()) {
                response.setTotalEnviados(1);
                response.setSucesso(true);
                response.setMensagem("Envio realizado com sucesso");
            } else {
                response.setTotalFalhas(1);
                response.setMensagem("Falha no envio: " + detalhe.getErro());
            }

        } catch (Exception e) {
            log.error("❌ Erro no envio individual: {}", e.getMessage());
            response.setMensagem("Erro interno: " + e.getMessage());
        }

        return response;
    }

    public EnvioResponse enviarEmMassa(EnvioRequest request) {
        final int BATCH_SIZE = 20;
        final long DELAY_BETWEEN_ITEMS_MS = 250; // pequena pausa entre envios
        final long DELAY_BETWEEN_BATCHES_MS = 2000; // pausa entre lotes
        log.info("🚀 Iniciando envio em massa para {} funcionários (batch size={})",
                request.getFuncionarioIds().size(), BATCH_SIZE);

        EnvioResponse response = EnvioResponse.builder()
                .sucesso(false)
                .dataEnvio(LocalDateTime.now())
                .tipoEnvio(request.getTipo())
                .totalEnviados(0)
                .totalFalhas(0)
                .detalhes(new ArrayList<>())
                .build();

        try {
            List<UUID> employeeIds = request.getFuncionarioIds().stream()
                    .map(UUID::fromString)
                    .toList();
            List<Employee> employees = employeeRepository.findAllById(employeeIds);
            int index = 0;
            for (Employee employee : employees) {
                EnvioResponse.DetalheEnvio detalhe = processarEnvio(employee, request);
                response.getDetalhes().add(detalhe);

                if (detalhe.isEnviado()) {
                    response.setTotalEnviados(response.getTotalEnviados() + 1);
                } else {
                    response.setTotalFalhas(response.getTotalFalhas() + 1);
                }
                index++;
                // pacing entre itens
                try {
                    Thread.sleep(DELAY_BETWEEN_ITEMS_MS);
                } catch (InterruptedException ignored) {
                }
                // pausa a cada BATCH_SIZE itens
                if (index % BATCH_SIZE == 0) {
                    log.info("⏳ Pausa entre lotes... ({} itens processados)", index);
                    try {
                        Thread.sleep(DELAY_BETWEEN_BATCHES_MS);
                    } catch (InterruptedException ignored) {
                    }
                }
            }

            response.setSucesso(response.getTotalFalhas() == 0);
            response.setMensagem(String.format("Envio em massa concluído. Enviados: %d, Falhas: %d",
                    response.getTotalEnviados(), response.getTotalFalhas()));

        } catch (Exception e) {
            log.error("❌ Erro no envio em massa: {}", e.getMessage());
            response.setMensagem("Erro interno: " + e.getMessage());
        }

        return response;
    }

    public EnvioResponse enviarTodosPorTipo(EnvioRequest request) {
        final int BATCH_SIZE = 20;
        final long DELAY_BETWEEN_ITEMS_MS = 250;
        final long DELAY_BETWEEN_BATCHES_MS = 2000;
        log.info("🚀 Iniciando envio em lote via {}", request.getTipo());

        EnvioResponse response = EnvioResponse.builder()
                .sucesso(false)
                .dataEnvio(LocalDateTime.now())
                .tipoEnvio(request.getTipo())
                .totalEnviados(0)
                .totalFalhas(0)
                .detalhes(new ArrayList<>())
                .build();

        try {
            List<String> cpfsParaEnvio = new ArrayList<>();

            if ("email".equals(request.getTipo())) {
                // Para email, buscar users com email cadastrado
                log.info("📧 Buscando users com EMAIL cadastrado...");
                List<User> usersComEmail = userRepository.findAll().stream()
                        .filter(user -> user.getEmail() != null && !user.getEmail().trim().isEmpty())
                        .toList();
                cpfsParaEnvio = usersComEmail.stream()
                        .map(User::getUsername) // username = CPF
                        .toList();
                log.info("✅ Encontrados {} users com email", cpfsParaEnvio.size());

            } else if ("whatsapp".equals(request.getTipo())) {
                // Para WhatsApp, buscar APENAS na tabela USERS com CONSENTIMENTO
                log.info("📱 Buscando users com WHATSAPP cadastrado E CONSENTIMENTO ativo...");
                List<User> usersComWhatsApp = userRepository.findAll().stream()
                        .filter(user -> user.getWhatsapp() != null && !user.getWhatsapp().trim().isEmpty())
                        .filter(user -> user.getWhatsappConsent() != null && user.getWhatsappConsent())
                        .toList();
                cpfsParaEnvio = usersComWhatsApp.stream()
                        .map(User::getUsername) // username = CPF
                        .toList();
                log.info("✅ Encontrados {} users com WhatsApp E consentimento ativo", cpfsParaEnvio.size());

                // Contar usuários sem consentimento para relatório
                long semConsentimento = userRepository.findAll().stream()
                        .filter(user -> user.getWhatsapp() != null && !user.getWhatsapp().trim().isEmpty())
                        .filter(user -> user.getWhatsappConsent() == null || !user.getWhatsappConsent())
                        .count();
                if (semConsentimento > 0) {
                    log.warn(
                            "⚠️ {} funcionários com WhatsApp cadastrado NÃO autorizaram receber mensagens (sem consentimento)",
                            semConsentimento);
                }

            } else {
                response.setMensagem("Tipo de envio inválido");
                return response;
            }

            if (cpfsParaEnvio.isEmpty()) {
                response.setMensagem("Nenhum destinatário encontrado para envio via " + request.getTipo());
                return response;
            }

            if (request.getMonth() != null && request.getYear() != null) {
                int beforeFilter = cpfsParaEnvio.size();
                Integer reqMonth = request.getMonth();
                Integer reqYear = request.getYear();
                cpfsParaEnvio = cpfsParaEnvio.stream()
                        .filter(cpf -> resolvePayslipForRequest(cpf, reqMonth, reqYear).isPresent())
                        .toList();
                log.info("📅 Filtro por período aplicado ({}/{}): {} -> {}", reqMonth, reqYear, beforeFilter,
                        cpfsParaEnvio.size());
                if (cpfsParaEnvio.isEmpty()) {
                    response.setMensagem("Nenhum holerite processado para o período selecionado.");
                    return response;
                }
            }

            log.info("📋 Processando {} envios...", cpfsParaEnvio.size());

            // Processar cada CPF em lotes
            int index = 0;
            for (String cpf : cpfsParaEnvio) {
                log.info("📤 Processando envio para CPF: {}", cpf);

                // Criar request individual por CPF
                EnvioRequest individualRequest = new EnvioRequest();
                individualRequest.setTipo(request.getTipo());
                individualRequest.setCpf(cpf);
                individualRequest.setMensagem(request.getMensagem());
                individualRequest.setAssunto(request.getAssunto());
                individualRequest.setMonth(request.getMonth());
                individualRequest.setYear(request.getYear());

                // Processar envio individual (já vai buscar na tabela users)
                EnvioResponse individualResponse = enviarIndividual(individualRequest);

                // Adicionar detalhes à resposta
                if (individualResponse.getDetalhes() != null && !individualResponse.getDetalhes().isEmpty()) {
                    EnvioResponse.DetalheEnvio detalhe = individualResponse.getDetalhes().get(0);
                    response.getDetalhes().add(detalhe);

                    if (detalhe.isEnviado()) {
                        response.setTotalEnviados(response.getTotalEnviados() + 1);
                    } else {
                        response.setTotalFalhas(response.getTotalFalhas() + 1);
                    }
                }
                index++;
                try {
                    Thread.sleep(DELAY_BETWEEN_ITEMS_MS);
                } catch (InterruptedException ignored) {
                }
                if (index % BATCH_SIZE == 0) {
                    log.info("⏳ Pausa entre lotes... ({} itens processados)", index);
                    try {
                        Thread.sleep(DELAY_BETWEEN_BATCHES_MS);
                    } catch (InterruptedException ignored) {
                    }
                }
            }

            response.setSucesso(response.getTotalEnviados() > 0);
            response.setMensagem(String.format("✅ Envio em lote concluído. Enviados: %d, Falhas: %d",
                    response.getTotalEnviados(), response.getTotalFalhas()));

        } catch (Exception e) {
            log.error("❌ Erro no envio em lote: {}", e.getMessage(), e);
            response.setMensagem("Erro interno: " + e.getMessage());
        }

        return response;
    }

    private EnvioResponse.DetalheEnvio processarEnvio(Employee employee, EnvioRequest request) {
        EnvioResponse.DetalheEnvio detalhe = EnvioResponse.DetalheEnvio.builder()
                .funcionarioId(employee.getId().toString())
                .nome(employee.getName())
                .cpf(employee.getDocument())
                .email(employee.getEmail())
                .telefone(employee.getPhone())
                .enviado(false)
                .build();

        try {
            if ("email".equals(request.getTipo())) {
                String cpf = employee.getDocument();
                Optional<User> userOpt = findUserByCpf(cpf);
                if (userOpt.isEmpty()) {
                    detalhe.setErro("Usuário não encontrado na tabela users para CPF: " + cpf);
                    registrarLog(cpf, null, null, DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                User user = userOpt.get();
                String destinationEmail = user.getEmail() != null ? user.getEmail().trim() : "";
                if (destinationEmail.isEmpty()) {
                    detalhe.setErro("Email não cadastrado na tabela users para CPF: " + cpf);
                    registrarLog(cpf, null, null, DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                Optional<User> ownerByEmail = userRepository.findByEmail(destinationEmail);
                if (ownerByEmail.isPresent() && !ownerByEmail.get().getId().equals(user.getId())) {
                    detalhe.setErro("Email informado pertence a outro usuário. Verifique cadastro na tabela users.");
                    registrarLog(cpf, null, null, DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                String userCpf = normalizeCpf(user.getUsername());
                if (!userCpf.isEmpty() && !userCpf.equals(normalizeCpf(cpf))) {
                    detalhe.setErro("CPF do usuário não coincide com o CPF do funcionário.");
                    registrarLog(cpf, null, null, DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                if (employee.getName() != null && !employee.getName().isBlank() &&
                        user.getName() != null && !namesMatch(employee.getName(), user.getName())) {
                    detalhe.setErro("Nome do usuário na tabela users não coincide com o funcionário do holerite.");
                    registrarLog(cpf, null, null, DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                detalhe.setEmail(destinationEmail);
                if (employee.getEmail() == null || employee.getEmail().trim().isEmpty()) {
                    employee.setEmail(destinationEmail);
                }
                Integer reqMonth = request.getMonth();
                Integer reqYear = request.getYear();
                var registroSelecionado = resolvePayslipForRequest(employee.getDocument(), reqMonth, reqYear);
                if (registroSelecionado.isEmpty()) {
                    detalhe.setErro(
                            buildPeriodoError(reqMonth, reqYear, "Nenhum holerite encontrado para o funcionário"));
                    registrarLog(employee.getDocument(), reqMonth, reqYear, DeliveryChannel.EMAIL, false, 1,
                            detalhe.getErro());
                    return detalhe;
                }
                var payslipSelecionado = registroSelecionado.get();
                Optional<String> resolvedPathOpt = payslipService
                        .resolvePayslipPathByCpfMonthYear(payslipSelecionado.getCpf(), payslipSelecionado.getMonth(),
                                payslipSelecionado.getYear());
                String filePath = resolvedPathOpt.orElse(null);
                if (filePath == null || !Files.exists(Path.of(filePath))) {
                    detalhe.setErro("Arquivo de holerite não encontrado para envio por email");
                    registrarLog(employee.getDocument(), payslipSelecionado.getMonth(), payslipSelecionado.getYear(),
                            DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                // --- NOVA LÓGICA DE ENVIO VIA QUEUE ---
                // 1. Resolver Configuração (Contexto: Departamento -> Empresa -> Global)
                UUID deptId = employee.getDepartment() != null ? employee.getDepartment().getId() : null;
                UUID compId = employee.getCompany() != null ? employee.getCompany().getId() : null;

                Optional<com.z7design.fleet_manager.model.email.EmailConfig> configOpt = emailConfigService
                        .resolveConfig(deptId, compId);

                if (configOpt.isEmpty()) {
                    detalhe.setErro(
                            "Nenhuma configuração de e-mail ativa encontrada para o contexto (Dep/Emp). Configure o SMTP.");
                    registrarLog(employee.getDocument(), payslipSelecionado.getMonth(), payslipSelecionado.getYear(),
                            DeliveryChannel.EMAIL, false, 1, detalhe.getErro());
                    return detalhe;
                }

                // 2. Preparar Anexo
                Path path = Path.of(filePath);
                List<com.z7design.fleet_manager.service.email.EmailQueueService.AttachmentDto> attachments = new ArrayList<>();
                attachments.add(new com.z7design.fleet_manager.service.email.EmailQueueService.AttachmentDto(
                        path.getFileName().toString(),
                        "application/pdf",
                        path.toAbsolutePath().toString(),
                        Files.size(path)));

                // 3. Enfileirar
                String assunto = request.getAssunto() != null ? request.getAssunto()
                        : "Holerite - "
                                + String.format("%02d/%d", payslipSelecionado.getMonth(), payslipSelecionado.getYear());
                String corpo = request.getMensagem() != null ? request.getMensagem() : "Segue em anexo o seu holerite.";
                // Envolver corpo em HTML básico se não for
                if (!corpo.trim().startsWith("<html>") && !corpo.trim().startsWith("<div")) {
                    corpo = "<html><body><p>" + corpo.replace("\n", "<br>") + "</p></body></html>";
                }

                emailQueueService.enqueueWithAttachments(
                        destinationEmail,
                        assunto,
                        corpo,
                        configOpt.get(),
                        attachments);

                // 4. Sucesso (Assíncrono)
                detalhe.setEnviado(true); // Marcamos como enviado pois foi aceito na fila
                registrarLog(employee.getDocument(), payslipSelecionado.getMonth(), payslipSelecionado.getYear(),
                        DeliveryChannel.EMAIL, true, 1, null);

            } else if ("whatsapp".equals(request.getTipo())) {
                // ðŸ” VALIDAÃ‡ÃƒO: Verificar WhatsApp primeiro em users, depois em employees
                String cpf = employee.getDocument();
                String whatsappNumber = null;
                User user = null;

                // PASSO 1: Buscar User e verificar WhatsApp
                Optional<User> userOpt = userRepository.findByUsername(cpf);
                if (userOpt.isPresent()) {
                    user = userOpt.get();
                    whatsappNumber = user.getWhatsapp();
                    log.info("ðŸ” WhatsApp encontrado em users: {} (CPF: {})",
                            whatsappNumber != null && !whatsappNumber.trim().isEmpty() ? whatsappNumber
                                    : "nÃ£o cadastrado",
                            cpf);
                } else {
                    log.warn("âš ï¸ User nÃ£o encontrado para CPF: {}", cpf);
                }

                // PASSO 2: Se nÃ£o encontrou em users, verificar em employees
                if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
                    String employeeWhatsapp = employee.getPhone();
                    if (employeeWhatsapp != null && !employeeWhatsapp.trim().isEmpty()) {
                        whatsappNumber = employeeWhatsapp;
                        log.info("âœ… WhatsApp encontrado em employees: {} (CPF: {})", whatsappNumber, cpf);

                        // Se user existe mas nÃ£o tem WhatsApp, atualizar o user com o WhatsApp do
                        // employee
                        if (user != null) {
                            log.info("ðŸ”„ Atualizando WhatsApp do user com o nÃºmero do employee");
                            user.setWhatsapp(whatsappNumber);
                            userRepository.save(user);
                            log.info("âœ… WhatsApp atualizado na tabela users");
                        }
                    } else {
                        log.warn("âš ï¸ WhatsApp nÃ£o encontrado nem em users nem em employees para CPF: {}", cpf);
                    }
                }

                // ValidaÃ§Ã£o final
                if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
                    detalhe.setErro(
                            "WhatsApp nÃ£o cadastrado na tabela users nem na tabela employees para CPF: " + cpf);
                    registrarLog(cpf, null, null, DeliveryChannel.WHATSAPP, false, 1, detalhe.getErro());
                    return detalhe;
                }

                // Se user nÃ£o foi encontrado, ainda precisamos dele para verificar
                // consentimento
                if (user == null) {
                    detalhe.setErro("UsuÃ¡rio nÃ£o encontrado na tabela users para CPF: " + cpf
                            + ". Ã‰ necessÃ¡rio criar o usuÃ¡rio primeiro.");
                    registrarLog(cpf, null, null, DeliveryChannel.WHATSAPP, false, 1, detalhe.getErro());
                    return detalhe;
                }

                // ðŸ”’ VALIDAÃ‡ÃƒO DE CONSENTIMENTO (Meta/WhatsApp Policy + LGPD)
                if (user.getWhatsappConsent() == null || !user.getWhatsappConsent()) {
                    String erroConsent = "FuncionÃ¡rio nÃ£o autorizou recebimento de mensagens via WhatsApp. " +
                            "Ã‰ necessÃ¡rio obter consentimento explÃ­cito antes do envio (Meta Policy + LGPD).";
                    detalhe.setErro(erroConsent);
                    registrarLog(cpf, null, null, DeliveryChannel.WHATSAPP, false, 1, erroConsent);
                    log.warn("âš ï¸ CONSENTIMENTO WHATSAPP AUSENTE para {} (CPF: {}). Envio bloqueado.",
                            employee.getName(), cpf);
                    return detalhe;
                }

                log.info("âœ… WhatsApp encontrado para {} (CPF: {}): {}",
                        employee.getName(), cpf, whatsappNumber);
                log.info("âœ… Consentimento WhatsApp confirmado em: {}", user.getWhatsappConsentDate());

                // Atualizar o telefone no detalhe para mostrar o nÃºmero do WhatsApp
                detalhe.setTelefone(whatsappNumber);

                // Limpar nÃºmero (remover caracteres nÃ£o numÃ©ricos)
                String normalized = whatsappNumber.replaceAll("[^0-9]", "");
                // Regra BR opcional: se vier 55 + DDD + 9 + 8 dÃ­gitos, remover o 9 extra
                if (normalized.startsWith("55") && normalized.length() == 13) {
                    // 55 (0-1), DDD (2-3), possivel 9 em (4)
                    if (normalized.charAt(4) == '9') {
                        normalized = normalized.substring(0, 4) + normalized.substring(5);
                    }
                }
                detalhe.setDestinoNormalizado(normalized);
                log.info("ðŸŽ¯ Destino final normalizado: {}", normalized);

                // Validar tamanho (aceitar 10/11/12/13 para compatibilidade)
                int len = normalized.length();
                if (len != 10 && len != 11 && len != 12 && len != 13) {
                    detalhe.setErro("NÃºmero de WhatsApp em formato invÃ¡lido (tamanhos aceitos: 10, 11, 12, 13)");
                    registrarLog(cpf, null, null, DeliveryChannel.WHATSAPP, false, 1, detalhe.getErro());
                    return detalhe;
                }

                Integer reqMonth = request.getMonth();
                Integer reqYear = request.getYear();
                var registroSelecionado = resolvePayslipForRequest(cpf, reqMonth, reqYear);
                if (registroSelecionado.isEmpty()) {
                    log.warn("âš ï¸ Nenhum holerite encontrado para CPF: {}", cpf);
                    detalhe.setErro(
                            buildPeriodoError(reqMonth, reqYear, "Nenhum holerite encontrado para este funcionÃ¡rio"));
                    registrarLog(cpf, reqMonth, reqYear, DeliveryChannel.WHATSAPP, false, 1, detalhe.getErro());
                    return detalhe;
                }

                Payslip payslip = registroSelecionado.get();
                log.info("ðŸ“‹ Holerite encontrado: CPF={}, MÃªs={}, Ano={}, Arquivo={}",
                        payslip.getCpf(), payslip.getMonth(), payslip.getYear(), payslip.getFileName());

                Optional<String> resolvedPathOpt = payslipService.resolvePayslipPathByCpfMonthYear(
                        payslip.getCpf(), payslip.getMonth(), payslip.getYear());

                String filePath = resolvedPathOpt.orElse(null);

                if (filePath == null) {
                    log.error("âŒ Caminho do arquivo nÃ£o pÃ´de ser resolvido para: {}", payslip.getFileName());
                    detalhe.setErro("Caminho do arquivo nÃ£o pÃ´de ser determinado");
                    registrarLog(cpf, payslip.getMonth(), payslip.getYear(), DeliveryChannel.WHATSAPP, false, 1,
                            detalhe.getErro());
                    return detalhe;
                }

                log.info("ðŸ” Verificando arquivo em: {}", filePath);
                Path arquivoPath = Path.of(filePath);

                if (!Files.exists(arquivoPath)) {
                    log.error("âŒ Arquivo nÃ£o existe: {}", filePath);
                    log.info("ðŸ“‚ DiretÃ³rio pai existe? {}", Files.exists(arquivoPath.getParent()));
                    detalhe.setErro("Arquivo de holerite nÃ£o encontrado: " + arquivoPath.getFileName());
                    registrarLog(cpf, payslip.getMonth(), payslip.getYear(), DeliveryChannel.WHATSAPP, false, 1,
                            detalhe.getErro());
                    return detalhe;
                }

                // Obter caminho absoluto para enviar ao Baileys
                String absolutePath = arquivoPath.toAbsolutePath().toString();
                log.info("âœ… Arquivo existe! Caminho absoluto: {}", absolutePath);
                log.info("ðŸ“Š Tamanho do arquivo: {} bytes", Files.size(arquivoPath));

                String message = request.getMensagem() != null ? request.getMensagem()
                        : "OlÃ¡, segue seu holerite do mÃªs. Em caso de dÃºvidas, contate o RH.";

                final String normalizedFinal = normalized;
                log.info("ðŸ“¤ Enviando via Baileys: phone={}, path={}", normalizedFinal, absolutePath);
                String[] sendResult = sendWhatsAppMessageWithError(normalizedFinal, message, absolutePath);
                boolean sent = Boolean.parseBoolean(sendResult[0]);
                String errorMessage = sendResult.length > 1 ? sendResult[1] : null;
                detalhe.setEnviado(sent);
                if (!sent) {
                    String erroDetalhado = errorMessage != null && !errorMessage.isEmpty()
                            ? "Falha no envio via WhatsApp: " + errorMessage
                            : "Falha no envio via WhatsApp. Verifique se o serviÃ§o Baileys estÃ¡ ativo e conectado.";
                    detalhe.setErro(erroDetalhado);
                    registrarLog(cpf, payslip.getMonth(), payslip.getYear(), DeliveryChannel.WHATSAPP, false, 1,
                            erroDetalhado);
                    // Retry em 5 minutos, apenas 1 vez
                    scheduler.schedule(() -> retryWhatsApp(normalizedFinal, message, absolutePath, cpf,
                            payslip.getMonth(), payslip.getYear()), 5, TimeUnit.MINUTES);
                } else {
                    log.info("âœ… Holerite enviado com sucesso via WhatsApp para {}", normalizedFinal);
                    registrarLog(cpf, payslip.getMonth(), payslip.getYear(), DeliveryChannel.WHATSAPP, true, 1, null);
                }

            } else {
                detalhe.setErro("Tipo de envio invÃ¡lido");
            }

        } catch (Exception e) {
            String empName = (employee != null ? employee.getName() : "desconhecido");
            String empDoc = (employee != null ? employee.getDocument()
                    : (request.getCpf() != null ? request.getCpf() : "-"));
            log.error("âŒ Erro ao enviar para {} ({}): {}", empName, empDoc, e.getMessage());
            detalhe.setErro("Erro interno: " + e.getMessage());
        }

        return detalhe;
    }

    private void registrarLog(String cpf, Integer month, Integer year, DeliveryChannel channel, boolean success,
            int attempts, String error) {
        PayslipDeliveryLog log = PayslipDeliveryLog.builder()
                .cpf(cpf)
                .month(month != null ? month : 0)
                .year(year != null ? year : 0)
                .channel(channel)
                .documentType(DocumentType.HOLERITE)
                .success(success)
                .attempts(attempts)
                .errorMessage(error)
                .build();
        deliveryLogRepository.save(log);
    }

    private Optional<Payslip> obterUltimoPayslip(String cpf) {
        List<Payslip> lista = payslipRepository.findAllByCpf(cpf);
        return lista == null || lista.isEmpty() ? Optional.empty()
                : Optional.of(lista.stream()
                        .filter(p -> p.getMonth() != null && p.getYear() != null)
                        .max(Comparator.comparing(Payslip::getYear).thenComparing(Payslip::getMonth))
                        .orElse(lista.get(0)));
    }

    private Optional<Payslip> resolvePayslipForRequest(String cpf, Integer month, Integer year) {
        if (month != null && year != null) {
            return Optional.ofNullable(payslipRepository.findFirstByCpfAndMonthAndYear(cpf, month, year));
        }
        return obterUltimoPayslip(cpf);
    }

    private String buildPeriodoError(Integer month, Integer year, String fallbackMessage) {
        if (month != null && year != null) {
            return fallbackMessage + " para o perÃ­odo " + month + "/" + year;
        }
        return fallbackMessage;
    }

    /**
     * Envia mensagem via WhatsApp usando Baileys REST API (com correÃ§Ã£o DDI 55)
     */
    private boolean sendWhatsAppMessage(String phoneNumber, String message, String filePath) {
        log.info("ðŸ“¤ Enviando via Baileys REST API (porta 3333)");

        if (baileysRestService == null) {
            log.error("âŒ BaileysRestService nÃ£o disponÃ­vel!");
            return false;
        }

        return baileysRestService.sendFileMessage(phoneNumber, message, filePath);
    }

    /**
     * Envia mensagem via WhatsApp e retorna resultado com mensagem de erro (se
     * houver)
     * 
     * @return Array com [sucesso (boolean como string), mensagemErro]
     */
    private String[] sendWhatsAppMessageWithError(String phoneNumber, String message, String filePath) {
        log.info("ðŸ“¤ Enviando via Baileys REST API (porta 3333)");

        if (baileysRestService == null) {
            log.error("âŒ BaileysRestService nÃ£o disponÃ­vel!");
            return new String[] { "false", "ServiÃ§o Baileys nÃ£o disponÃ­vel" };
        }

        try {
            boolean sent = baileysRestService.sendFileMessage(phoneNumber, message, filePath);
            if (sent) {
                return new String[] { "true", null };
            } else {
                // Tentar obter detalhes do erro do Baileys
                String errorDetail = baileysRestService.getLastErrorMessage();
                if (errorDetail != null && !errorDetail.isEmpty()) {
                    return new String[] { "false", errorDetail };
                }
                return new String[] { "false", "ServiÃ§o Baileys retornou erro sem detalhes" };
            }
        } catch (Exception e) {
            log.error("âŒ ExceÃ§Ã£o ao enviar via Baileys: {}", e.getMessage(), e);
            return new String[] { "false", "Erro ao comunicar com serviÃ§o Baileys: " + e.getMessage() };
        }
    }

    private void retryWhatsApp(String phone, String message, String filePath, String cpf, Integer month, Integer year) {
        try {
            boolean sent = sendWhatsAppMessage(phone, message, filePath);
            registrarLog(cpf, month, year, DeliveryChannel.WHATSAPP, sent, 2, sent ? null : "Retry falhou");
        } catch (Exception e) {
            registrarLog(cpf, month, year, DeliveryChannel.WHATSAPP, false, 2, e.getMessage());
        }
    }

    public EnvioResponse reenviarPorLogId(String logId) {
        EnvioResponse response = EnvioResponse.builder()
                .sucesso(false)
                .dataEnvio(LocalDateTime.now())
                .tipoEnvio("whatsapp")
                .totalEnviados(0)
                .totalFalhas(0)
                .detalhes(new ArrayList<>())
                .build();
        try {
            var log = deliveryLogRepository.findById(java.util.UUID.fromString(logId)).orElse(null);
            if (log == null) {
                response.setMensagem("Log nÃ£o encontrado");
                return response;
            }
            var employeeOpt = employeeRepository.findByDocument(log.getCpf());
            if (employeeOpt.isEmpty()) {
                response.setMensagem("FuncionÃ¡rio nÃ£o encontrado para o CPF do log");
                return response;
            }
            EnvioRequest req = new EnvioRequest();
            req.setTipo(log.getChannel() == DeliveryChannel.EMAIL ? "email" : "whatsapp");
            req.setFuncionarioId(employeeOpt.get().getId().toString());
            req.setMonth(log.getMonth());
            req.setYear(log.getYear());
            var det = processarEnvio(employeeOpt.get(), req);
            response.getDetalhes().add(det);
            if (det.isEnviado()) {
                response.setSucesso(true);
                response.setTotalEnviados(1);
                response.setMensagem("Reenvio realizado com sucesso");
            } else {
                response.setTotalFalhas(1);
                response.setMensagem(det.getErro());
            }
        } catch (Exception e) {
            response.setMensagem("Erro interno: " + e.getMessage());
        }
        return response;
    }

    public java.util.List<PayslipDeliveryLog> listarLogs(String cpf, Integer month, Integer year) {
        // Se nÃ£o houver filtros, retornar todos os logs (limitado aos Ãºltimos 100)
        if (cpf == null || cpf.isEmpty()) {
            if (month != null && year != null) {
                return deliveryLogRepository.findAll().stream()
                        .filter(log -> log.getMonth() != null && log.getMonth().equals(month))
                        .filter(log -> log.getYear() != null && log.getYear().equals(year))
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .limit(100)
                        .collect(java.util.stream.Collectors.toList());
            }
            // Sem filtros: retornar todos os logs mais recentes (limitado a 100)
            return deliveryLogRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(100)
                    .collect(java.util.stream.Collectors.toList());
        }

        // Com CPF: usar os mÃ©todos existentes
        if (month != null && year != null) {
            return deliveryLogRepository.findByCpfAndMonthAndYear(cpf, month, year);
        }
        // Com CPF mas sem month/year: retornar todos os logs daquele CPF, ordenados
        return deliveryLogRepository.findByCpf(cpf).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(100)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * ðŸ” Verifica se um funcionÃ¡rio tem WhatsApp disponÃ­vel na tabela users
     */
    public boolean funcionarioTemWhatsApp(String cpf) {
        Optional<User> userOpt = userRepository.findByUsername(cpf);
        if (userOpt.isEmpty()) {
            return false;
        }

        String whatsapp = userOpt.get().getWhatsapp();
        return whatsapp != null && !whatsapp.trim().isEmpty();
    }

    /**
     * ðŸ“± ObtÃ©m o nÃºmero de WhatsApp de um funcionÃ¡rio
     */
    public String obterWhatsAppFuncionario(String cpf) {
        Optional<User> userOpt = userRepository.findByUsername(cpf);
        if (userOpt.isEmpty()) {
            return null;
        }

        return userOpt.get().getWhatsapp();
    }

    private Optional<User> findUserByCpf(String cpf) {
        if (cpf == null || cpf.trim().isEmpty()) {
            return Optional.empty();
        }
        String normalized = normalizeCpf(cpf);

        Optional<User> userOpt = userRepository.findByUsername(normalized);
        if (userOpt.isPresent()) {
            return userOpt;
        }

        userOpt = userRepository.findByEmployeeCpf(cpf);
        if (userOpt.isPresent()) {
            return userOpt;
        }

        if (!normalized.equals(cpf)) {
            userOpt = userRepository.findByEmployeeCpf(normalized);
            if (userOpt.isPresent()) {
                return userOpt;
            }
        }

        return Optional.empty();
    }

    private String normalizeCpf(String cpf) {
        if (cpf == null) {
            return "";
        }
        return cpf.replaceAll("[^0-9]", "");
    }

    private boolean namesMatch(String nameA, String nameB) {
        if (nameA == null || nameB == null) {
            return false;
        }
        return normalizeName(nameA).equals(normalizeName(nameB));
    }

    private String normalizeName(String name) {
        return Normalizer.normalize(name.toUpperCase(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[^A-Z0-9]", "")
                .trim();
    }
}
