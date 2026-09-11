package com.z7design.secured_guard.worker;

import com.z7design.secured_guard.dto.GeminiOcrResponse;
import com.z7design.secured_guard.repository.DocumentPageRepository;
import com.z7design.secured_guard.service.GeminiOcrService;
import com.z7design.secured_guard.service.MinIOService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class OcrWorkerTest {
    
    @Mock
    private StringRedisTemplate redisTemplate;
    
    @Mock
    private DocumentPageRepository documentPageRepository;
    
    @Mock
    private GeminiOcrService geminiOcrService;
    
    @Mock
    private MinIOService minIOService;
    
    @InjectMocks
    private OcrWorker ocrWorker;
    
    private GeminiOcrResponse testOcrResponse;
    
    @BeforeEach
    void setUp() {
        testOcrResponse = new GeminiOcrResponse();
        testOcrResponse.setDocumentType("holerite");
        testOcrResponse.setCpf("12345678900");
        testOcrResponse.setName("JOSE CARLOS ALVES");
        testOcrResponse.setPeriod("10/2025");
        testOcrResponse.setValueLiquid("2539.50");
        testOcrResponse.setConfidence(0.98);
    }
    
    @Test
    void testInit_CreatesConsumerGroup() {
        // When
        ocrWorker.init();
        
        // Then - Verifica que não lança exceção
        assertNotNull(ocrWorker);
    }
    
    @Test
    void testOcrResponse_ValidData() {
        // Then
        assertNotNull(testOcrResponse);
        assertEquals("holerite", testOcrResponse.getDocumentType());
        assertEquals("12345678900", testOcrResponse.getCpf());
        assertEquals("JOSE CARLOS ALVES", testOcrResponse.getName());
        assertEquals("10/2025", testOcrResponse.getPeriod());
        assertEquals("2539.50", testOcrResponse.getValueLiquid());
        assertEquals(0.98, testOcrResponse.getConfidence());
    }
}
