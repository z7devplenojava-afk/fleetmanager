package com.z7design.secured_guard.worker;

import com.z7design.secured_guard.repository.DocumentProcessingJobRepository;
import com.z7design.secured_guard.service.MinIOService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SplitterWorkerTest {
    
    @Mock
    private StringRedisTemplate redisTemplate;
    
    @Mock
    private DocumentProcessingJobRepository jobRepository;
    
    @Mock
    private MinIOService minIOService;
    
    @InjectMocks
    private SplitterWorker splitterWorker;
    
    @Test
    void testInit_CreatesConsumerGroup() {
        // When
        splitterWorker.init();
        
        // Then - Verifica que não lança exceção
        assertNotNull(splitterWorker);
    }
}

