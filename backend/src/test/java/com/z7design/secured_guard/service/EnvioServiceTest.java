package com.z7design.secured_guard.service;

import com.z7design.secured_guard.dto.EnvioRequest;
import com.z7design.secured_guard.dto.EnvioResponse;
import com.z7design.secured_guard.model.*;
import com.z7design.secured_guard.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Testes unitários para EnvioService
 * 
 * Nota: Estes testes focam em validações e fluxos lógicos.
 * Testes de integração devem validar operações de arquivo real.
 */
class EnvioServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private WhatsAppService whatsAppService;

    @Mock
    private PayslipRepository payslipRepository;

    @Mock
    private PayslipDeliveryLogRepository deliveryLogRepository;

    @Mock
    private PayslipService payslipService;

    private EnvioService envioService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        envioService = new EnvioService(
            employeeRepository,
            userRepository,
            emailService,
            whatsAppService,
            payslipRepository,
            deliveryLogRepository,
            payslipService
        );
    }

    @Test
    void testEnviarIndividual_UserNaoEncontrado() {
        // Arrange
        String cpf = "12345678900";
        
        EnvioRequest request = new EnvioRequest();
        request.setCpf(cpf);
        request.setTipo("whatsapp");
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.empty());
        
        // Act
        EnvioResponse response = envioService.enviarIndividual(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(0, response.getTotalFalhas());
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("não encontrado"));
    }

    @Test
    void testEnviarIndividual_WhatsAppNaoCadastrado() {
        // Arrange
        String cpf = "00824310608";
        
        EnvioRequest request = new EnvioRequest();
        request.setCpf(cpf);
        request.setTipo("whatsapp");
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setName("JOSE MARIO RAMOS");
        mockUser.setWhatsapp(null); // WhatsApp não cadastrado
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        when(employeeRepository.findByDocument(cpf)).thenReturn(Optional.empty());
        
        // Act
        EnvioResponse response = envioService.enviarIndividual(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("WhatsApp"));
    }

    @Test
    void testEnviarIndividual_HoleriteNaoEncontrado() {
        // Arrange
        String cpf = "00824310608";
        
        EnvioRequest request = new EnvioRequest();
        request.setCpf(cpf);
        request.setTipo("whatsapp");
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setName("JOSE MARIO RAMOS");
        mockUser.setWhatsapp("31971731747");
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        when(employeeRepository.findByDocument(cpf)).thenReturn(Optional.empty());
        when(payslipRepository.findAllByCpf(cpf)).thenReturn(Collections.emptyList());
        
        // Act
        EnvioResponse response = envioService.enviarIndividual(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(1, response.getTotalFalhas());
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("Falha no envio"));
        verify(deliveryLogRepository, times(1)).save(any(PayslipDeliveryLog.class));
    }

    @Test
    void testEnviarIndividual_ArquivoNaoEncontrado() {
        // Arrange
        String cpf = "00824310608";
        
        EnvioRequest request = new EnvioRequest();
        request.setCpf(cpf);
        request.setTipo("whatsapp");
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setName("JOSE MARIO RAMOS");
        mockUser.setWhatsapp("31971731747");
        
        Payslip mockPayslip = new Payslip();
        mockPayslip.setCpf(cpf);
        mockPayslip.setMonth(9);
        mockPayslip.setYear(2025);
        mockPayslip.setFileName("test.pdf");
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        when(employeeRepository.findByDocument(cpf)).thenReturn(Optional.empty());
        when(payslipRepository.findAllByCpf(cpf)).thenReturn(List.of(mockPayslip));
        // Arquivo não encontrado
        when(payslipService.resolvePayslipPathByCpfMonthYear(cpf, 9, 2025))
            .thenReturn(Optional.empty());
        
        // Act
        EnvioResponse response = envioService.enviarIndividual(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(1, response.getTotalFalhas());
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("Falha no envio"));
        verify(deliveryLogRepository, times(1)).save(any(PayslipDeliveryLog.class));
    }

    @Test
    void testEnviarEmMassa() {
        // Arrange
        String employeeId = UUID.randomUUID().toString();
        
        EnvioRequest request = new EnvioRequest();
        request.setFuncionarioIds(List.of(employeeId));
        request.setTipo("email");
        
        Employee mockEmployee = new Employee();
        mockEmployee.setId(UUID.fromString(employeeId));
        mockEmployee.setName("Test Employee");
        mockEmployee.setDocument("12345678900");
        mockEmployee.setEmail("test@example.com");
        
        when(employeeRepository.findAllById(anyList())).thenReturn(List.of(mockEmployee));
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        when(payslipRepository.findAllByCpf(anyString())).thenReturn(Collections.emptyList());
        
        // Act
        EnvioResponse response = envioService.enviarEmMassa(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(1, response.getTotalFalhas());
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("Envio em massa concluído"));
    }

    @Test
    void testEnviarTodosPorTipo_WhatsApp_SemUsuarios() {
        // Arrange
        EnvioRequest request = new EnvioRequest();
        request.setTipo("whatsapp");
        
        when(userRepository.findAll()).thenReturn(Collections.emptyList());
        
        // Act
        EnvioResponse response = envioService.enviarTodosPorTipo(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(0, response.getTotalFalhas());
        // Sucesso é false quando não há envios realizados
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("Nenhum destinatário encontrado"));
    }

    @Test
    void testEnviarTodosPorTipo_Email_SemUsuarios() {
        // Arrange
        EnvioRequest request = new EnvioRequest();
        request.setTipo("email");
        
        when(userRepository.findAll()).thenReturn(Collections.emptyList());
        
        // Act
        EnvioResponse response = envioService.enviarTodosPorTipo(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(0, response.getTotalFalhas());
        // Sucesso é false quando não há envios realizados
        assertFalse(response.isSucesso());
        assertTrue(response.getMensagem().contains("Nenhum destinatário encontrado"));
    }

    @Test
    void testProcessarEnvio_WhatsAppNumeroInvalido() {
        // Arrange
        String cpf = "00824310608";
        
        EnvioRequest request = new EnvioRequest();
        request.setCpf(cpf);
        request.setTipo("whatsapp");
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setName("JOSE MARIO RAMOS");
        mockUser.setWhatsapp("123"); // Número inválido (muito curto)
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        when(employeeRepository.findByDocument(cpf)).thenReturn(Optional.empty());
        when(payslipRepository.findAllByCpf(cpf)).thenReturn(Collections.emptyList());
        
        // Act
        EnvioResponse response = envioService.enviarIndividual(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalEnviados());
        assertEquals(1, response.getTotalFalhas());
        assertFalse(response.isSucesso());
    }

    // Nota: obterUltimoPayslip é um método privado, testado indiretamente pelos testes de envio

    @Test
    void testFuncionarioTemWhatsApp_True() {
        // Arrange
        String cpf = "00824310608";
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setWhatsapp("31971731747");
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        
        // Act
        boolean resultado = envioService.funcionarioTemWhatsApp(cpf);
        
        // Assert
        assertTrue(resultado);
    }

    @Test
    void testFuncionarioTemWhatsApp_False() {
        // Arrange
        String cpf = "00824310608";
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setWhatsapp(null);
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        
        // Act
        boolean resultado = envioService.funcionarioTemWhatsApp(cpf);
        
        // Assert
        assertFalse(resultado);
    }

    @Test
    void testObterWhatsAppFuncionario() {
        // Arrange
        String cpf = "00824310608";
        String whatsapp = "31971731747";
        
        User mockUser = new User();
        mockUser.setUsername(cpf);
        mockUser.setWhatsapp(whatsapp);
        
        when(userRepository.findByUsername(cpf)).thenReturn(Optional.of(mockUser));
        
        // Act
        String resultado = envioService.obterWhatsAppFuncionario(cpf);
        
        // Assert
        assertNotNull(resultado);
        assertEquals(whatsapp, resultado);
    }
}
