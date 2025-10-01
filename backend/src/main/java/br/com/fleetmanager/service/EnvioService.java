package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.EnvioRequest;
import br.com.fleetmanager.dto.EnvioResponse;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnvioService {
    
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    
    public EnvioResponse enviarIndividual(EnvioRequest request) {
        log.info("🚀 Iniciando envio individual para funcionário ID: {}", request.getFuncionarioId());
        
        EnvioResponse response = EnvioResponse.builder()
                .sucesso(false)
                .dataEnvio(LocalDateTime.now())
                .tipoEnvio(request.getTipo())
                .totalEnviados(0)
                .totalFalhas(0)
                .detalhes(new ArrayList<>())
                .build();
        
        try {
            Optional<Employee> employeeOpt = employeeRepository.findById(UUID.fromString(request.getFuncionarioId()));
            
            if (employeeOpt.isEmpty()) {
                response.setMensagem("Funcionário não encontrado");
                return response;
            }
            
            Employee employee = employeeOpt.get();
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
        log.info("🚀 Iniciando envio em massa para {} funcionários", request.getFuncionarioIds().size());
        
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
            
            for (Employee employee : employees) {
                EnvioResponse.DetalheEnvio detalhe = processarEnvio(employee, request);
                response.getDetalhes().add(detalhe);
                
                if (detalhe.isEnviado()) {
                    response.setTotalEnviados(response.getTotalEnviados() + 1);
                } else {
                    response.setTotalFalhas(response.getTotalFalhas() + 1);
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
        log.info("🚀 Iniciando envio para todos os funcionários com {}", request.getTipo());
        
        EnvioResponse response = EnvioResponse.builder()
                .sucesso(false)
                .dataEnvio(LocalDateTime.now())
                .tipoEnvio(request.getTipo())
                .totalEnviados(0)
                .totalFalhas(0)
                .detalhes(new ArrayList<>())
                .build();
        
        try {
            List<Employee> employees;
            
            if ("email".equals(request.getTipo())) {
                employees = employeeRepository.findByEmailIsNotNullAndEmailNot("");
            } else if ("whatsapp".equals(request.getTipo())) {
                // 🔍 Para WhatsApp, buscar funcionários que têm User correspondente com WhatsApp cadastrado
                employees = employeeRepository.findAll().stream()
                    .filter(employee -> {
                        String cpf = employee.getDocument();
                        Optional<User> userOpt = userRepository.findByUsername(cpf);
                        return userOpt.isPresent() && 
                               userOpt.get().getWhatsapp() != null && 
                               !userOpt.get().getWhatsapp().trim().isEmpty();
                    })
                    .toList();
            } else {
                response.setMensagem("Tipo de envio inválido");
                return response;
            }
            
            log.info("📋 Encontrados {} funcionários para envio via {}", employees.size(), request.getTipo());
            
            for (Employee employee : employees) {
                EnvioResponse.DetalheEnvio detalhe = processarEnvio(employee, request);
                response.getDetalhes().add(detalhe);
                
                if (detalhe.isEnviado()) {
                    response.setTotalEnviados(response.getTotalEnviados() + 1);
                } else {
                    response.setTotalFalhas(response.getTotalFalhas() + 1);
                }
            }
            
            response.setSucesso(response.getTotalFalhas() == 0);
            response.setMensagem(String.format("Envio para todos concluído. Enviados: %d, Falhas: %d", 
                    response.getTotalEnviados(), response.getTotalFalhas()));
            
        } catch (Exception e) {
            log.error("❌ Erro no envio para todos: {}", e.getMessage());
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
                if (employee.getEmail() == null || employee.getEmail().trim().isEmpty()) {
                    detalhe.setErro("Email não cadastrado");
                    return detalhe;
                }
                
                // TODO: Implementar envio de email para holerite
                // Por enquanto, apenas log
                log.info("📧 Email solicitado para {} ({}): {} - Implementação pendente", 
                    employee.getName(), employee.getEmail(), request.getAssunto());
                
                detalhe.setEnviado(true);
                
            } else if ("whatsapp".equals(request.getTipo())) {
                // 🔍 VALIDAÇÃO: Verificar se existe User com CPF correspondente e WhatsApp cadastrado
                String cpf = employee.getDocument();
                Optional<User> userOpt = userRepository.findByUsername(cpf);
                
                if (userOpt.isEmpty()) {
                    detalhe.setErro("Usuário não encontrado na tabela users para CPF: " + cpf);
                    return detalhe;
                }
                
                User user = userOpt.get();
                String whatsappNumber = user.getWhatsapp();
                
                if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
                    detalhe.setErro("WhatsApp não cadastrado na tabela users para CPF: " + cpf);
                    return detalhe;
                }
                
                log.info("✅ WhatsApp encontrado para {} (CPF: {}): {}", 
                        employee.getName(), cpf, whatsappNumber);
                
                // Atualizar o telefone no detalhe para mostrar o número do WhatsApp
                detalhe.setTelefone(whatsappNumber);
                
                // TODO: Implementar envio de WhatsApp para holerite
                // Por enquanto, apenas log
                log.info("📱 WhatsApp solicitado para {} ({}): {} - Implementação pendente", 
                    employee.getName(), whatsappNumber, request.getMensagem());
                
                detalhe.setEnviado(true);
                
            } else {
                detalhe.setErro("Tipo de envio inválido");
            }
            
        } catch (Exception e) {
            log.error("❌ Erro ao enviar para {} ({}): {}", 
                    employee.getName(), employee.getDocument(), e.getMessage());
            detalhe.setErro("Erro interno: " + e.getMessage());
        }
        
        return detalhe;
    }
    
    /**
     * 🔍 Verifica se um funcionário tem WhatsApp disponível na tabela users
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
     * 📱 Obtém o número de WhatsApp de um funcionário
     */
    public String obterWhatsAppFuncionario(String cpf) {
        Optional<User> userOpt = userRepository.findByUsername(cpf);
        if (userOpt.isEmpty()) {
            return null;
        }
        
        return userOpt.get().getWhatsapp();
    }
} 