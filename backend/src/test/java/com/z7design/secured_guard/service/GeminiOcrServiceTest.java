package com.z7design.secured_guard.service;

import com.z7design.secured_guard.dto.GeminiOcrResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class GeminiOcrServiceTest {
    
    @Mock
    private WebClient.Builder webClientBuilder;
    
    @Mock
    private WebClient webClient;
    
    private GeminiOcrService geminiOcrService;
    
    private byte[] testImageBytes;
    
    @BeforeEach
    void setUp() {
        testImageBytes = new byte[]{1, 2, 3, 4, 5};
        geminiOcrService = new GeminiOcrService(
            "https://test-api.com",
            "test-key",
            true,
            30000L
        );
        ReflectionTestUtils.setField(geminiOcrService, "webClient", webClient);
    }
    
    @Test
    void testExtractTextFromImage_Disabled() {
        // Given
        ReflectionTestUtils.setField(geminiOcrService, "enabled", false);
        
        // When
        Mono<GeminiOcrResponse> result = geminiOcrService.extractTextFromImage(testImageBytes);
        
        // Then
        StepVerifier.create(result)
            .expectNextCount(0)
            .verifyComplete();
    }
    
    @Test
    void testExtractTextFromImage_EmptyResponse() {
        // Given
        ReflectionTestUtils.setField(geminiOcrService, "enabled", true);
        ReflectionTestUtils.setField(geminiOcrService, "webClient", null);
        
        // When
        Mono<GeminiOcrResponse> result = geminiOcrService.extractTextFromImage(testImageBytes);
        
        // Then
        StepVerifier.create(result)
            .expectNextCount(0)
            .verifyComplete();
    }
}

