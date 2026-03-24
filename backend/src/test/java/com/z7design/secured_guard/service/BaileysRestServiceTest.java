package com.z7design.secured_guard.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import com.z7design.secured_guard.config.WhatsAppTestConfig;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Testes unitários para BaileysRestService
 */
class BaileysRestServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    private BaileysRestService baileysRestService;
    private WhatsAppTestConfig whatsAppTestConfig;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        whatsAppTestConfig = new WhatsAppTestConfig();
        ReflectionTestUtils.setField(whatsAppTestConfig, "testMode", false);
        ReflectionTestUtils.setField(whatsAppTestConfig, "baileysEnabled", false);
        ReflectionTestUtils.setField(whatsAppTestConfig, "testNumbersConfig", "");

        baileysRestService = new BaileysRestService(restTemplate, objectMapper, whatsAppTestConfig);
        
        // Configurar valores das propriedades
        ReflectionTestUtils.setField(baileysRestService, "baileysRestUrl", "http://localhost:3333");
        ReflectionTestUtils.setField(baileysRestService, "baileysToken", "test-token");
        ReflectionTestUtils.setField(baileysRestService, "instanceKey", "test-instance");
    }

    @Test
    void testSendTextMessage_Success() {
        // Arrange
        String phoneNumber = "5531999999999";
        String message = "Test message";
        ResponseEntity<String> mockResponse = new ResponseEntity<>("{\"success\":true}", HttpStatus.OK);
        
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.sendTextMessage(phoneNumber, message);
        
        // Assert
        assertTrue(result);
        verify(restTemplate, times(1)).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendTextMessage_Failure() {
        // Arrange
        String phoneNumber = "5531999999999";
        String message = "Test message";
        
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RuntimeException("Connection error"));
        
        // Act
        boolean result = baileysRestService.sendTextMessage(phoneNumber, message);
        
        // Assert
        assertFalse(result);
    }

    @Test
    void testSendFileMessage_Success() throws Exception {
        // Arrange
        String phoneNumber = "5531999999999";
        String message = "Segue seu holerite";
        
        // Criar arquivo temporário
        Path testFile = tempDir.resolve("test.pdf");
        Files.write(testFile, "Test content".getBytes());
        
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"success\":true,\"message\":\"File sent\"}", 
            HttpStatus.OK
        );
        
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.sendFileMessage(phoneNumber, message, testFile.toString());
        
        // Assert
        assertTrue(result);
        
        // Verificar que foi chamado com multipart
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<?>> entityCaptor = ArgumentCaptor.forClass((Class<HttpEntity<?>>) (Class<?>) HttpEntity.class);
        verify(restTemplate).postForEntity(anyString(), entityCaptor.capture(), eq(String.class));
        
        HttpEntity<?> capturedEntity = entityCaptor.getValue();
        assertEquals(MediaType.MULTIPART_FORM_DATA, capturedEntity.getHeaders().getContentType());
        assertTrue(capturedEntity.getBody() instanceof MultiValueMap);
    }

    @Test
    void testSendFileMessage_FileNotFound() {
        // Arrange
        String phoneNumber = "5531999999999";
        String message = "Segue seu holerite";
        String nonExistentFile = "C:\\path\\that\\does\\not\\exist\\file.pdf";
        
        // Act
        boolean result = baileysRestService.sendFileMessage(phoneNumber, message, nonExistentFile);
        
        // Assert
        assertFalse(result);
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    void testSendFileMessage_BaileysReturns404() throws Exception {
        // Arrange
        String phoneNumber = "5531999999999";
        String message = "Segue seu holerite";
        
        // Criar arquivo temporário
        Path testFile = tempDir.resolve("test.pdf");
        Files.write(testFile, "Test content".getBytes());
        
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(HttpClientErrorException.NotFound.create(
                HttpStatus.NOT_FOUND,
                "Not Found",
                HttpHeaders.EMPTY,
                "{\"success\":false,\"error\":\"file not found\"}".getBytes(),
                null
            ));
        
        // Act
        boolean result = baileysRestService.sendFileMessage(phoneNumber, message, testFile.toString());
        
        // Assert
        assertFalse(result);
    }

    @Test
    void testSendFileMessage_BaileysReturnsError() throws Exception {
        // Arrange
        String phoneNumber = "5531999999999";
        String message = "Segue seu holerite";
        
        // Criar arquivo temporário
        Path testFile = tempDir.resolve("test.pdf");
        Files.write(testFile, "Test content".getBytes());
        
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"success\":false,\"error\":\"Invalid phone number\"}", 
            HttpStatus.BAD_REQUEST
        );
        
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.sendFileMessage(phoneNumber, message, testFile.toString());
        
        // Assert
        assertFalse(result);
    }

    @Test
    void testInitializeInstance_Success() {
        // Arrange
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"instance\":\"test-instance\",\"status\":\"initialized\"}", 
            HttpStatus.OK
        );
        
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.initializeInstance();
        
        // Assert
        assertTrue(result);
    }

    @Test
    void testCheckConnection_Connected() {
        // Arrange
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"state\":\"open\"}", 
            HttpStatus.OK
        );
        
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.checkConnection();
        
        // Assert
        assertTrue(result);
    }

    @Test
    void testCheckConnection_Disconnected() {
        // Arrange
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"state\":\"close\"}", 
            HttpStatus.OK
        );
        
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.checkConnection();
        
        // Assert
        assertFalse(result);
    }

    @Test
    void testCheckConnection_Error() {
        // Arrange
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("Connection timeout"));
        
        // Act
        boolean result = baileysRestService.checkConnection();
        
        // Assert
        assertFalse(result);
    }

    @Test
    void testDisconnectInstance_Success() {
        // Arrange
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"message\":\"Instance disconnected\"}", 
            HttpStatus.OK
        );
        
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        boolean result = baileysRestService.disconnectInstance();
        
        // Assert
        assertTrue(result);
    }

    @Test
    void testGetQRCode_Success() {
        // Arrange
        String expectedQR = "data:image/png;base64,iVBORw0KGg...";
        ResponseEntity<String> mockResponse = new ResponseEntity<>(
            "{\"qr\":\"" + expectedQR + "\"}", 
            HttpStatus.OK
        );
        
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
            .thenReturn(mockResponse);
        
        // Act
        String result = baileysRestService.getQRCode();
        
        // Assert
        assertNotNull(result);
        assertTrue(result.contains("qr"));
    }
}

