package com.z7design.secured_guard.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MinIOServiceTest {
    
    private MinIOService minIOService;
    
    private byte[] testImageBytes;
    
    @BeforeEach
    void setUp() {
        testImageBytes = new byte[]{1, 2, 3, 4, 5};
        minIOService = new MinIOService(
            "http://localhost:9000",
            "minioadmin",
            "minioadmin",
            "pages-bucket",
            "unified-bucket",
            false // MinIO desabilitado para os testes
        );
    }
    
    @Test
    void testUploadPage_Disabled() {
        // Given - MinIO já está desabilitado no setUp
        
        // When
        String result = minIOService.uploadPage(testImageBytes, "job123", 0);
        
        // Then
        assertNotNull(result);
        assertTrue(result.startsWith("local://"));
    }
    
    @Test
    void testDownloadBytes_Disabled() {
        // Given - MinIO já está desabilitado no setUp
        
        // When
        byte[] result = minIOService.downloadBytes("local://test.png");
        
        // Then
        assertNotNull(result);
        assertEquals(0, result.length);
    }
    
    @Test
    void testUploadUnifiedPdf_Disabled() {
        // Given - MinIO já está desabilitado no setUp
        byte[] pdfBytes = new byte[]{1, 2, 3};
        
        // When
        String result = minIOService.uploadUnifiedPdf(pdfBytes, "test.pdf");
        
        // Then
        assertNotNull(result);
        assertTrue(result.startsWith("local://"));
    }
}

