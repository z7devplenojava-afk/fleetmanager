package com.z7design.secured_guard.service;

import com.z7design.secured_guard.model.DocumentProcessingJob;
import com.z7design.secured_guard.repository.DocumentProcessingJobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentProcessingServiceTest {
    
    @Mock
    private DocumentProcessingJobRepository jobRepository;
    
    @Mock
    private StringRedisTemplate redisTemplate;
    
    @Mock
    @SuppressWarnings("rawtypes")
    private StreamOperations streamOperations;
    
    @Mock
    private com.z7design.secured_guard.repository.UnifiedDocumentRepository unifiedDocumentRepository;
    
    @Mock
    private com.z7design.secured_guard.worker.IndexerWorker indexerWorker;
    
    @InjectMocks
    private DocumentProcessingService processingService;
    
    private MultipartFile testFile;
    
    @BeforeEach
    void setUp() {
        testFile = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            "test content".getBytes()
        );
    }
    
    @Test
    void testCreateProcessingJob_Success() throws Exception {
        // Given
        when(redisTemplate.opsForStream()).thenReturn(streamOperations);
        when(streamOperations.add(anyString(), any())).thenReturn(null);
        when(jobRepository.save(any(DocumentProcessingJob.class))).thenAnswer(invocation -> {
            DocumentProcessingJob job = invocation.getArgument(0);
            return job;
        });
        
        // When
        UUID result = processingService.createProcessingJob(testFile, "HOLERITE");
        
        // Then
        assertNotNull(result);
        verify(jobRepository, times(1)).save(any(DocumentProcessingJob.class));
        verify(redisTemplate, times(1)).opsForStream();
        verify(streamOperations, times(1)).add(anyString(), any());
    }
    
    @Test
    void testGetJob_Exists() {
        // Given
        UUID jobId = UUID.randomUUID();
        DocumentProcessingJob job = DocumentProcessingJob.builder()
            .id(jobId)
            .fileName("test.pdf")
            .status(DocumentProcessingJob.JobStatus.QUEUED)
            .build();
        
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        
        // When
        DocumentProcessingJob result = processingService.getJob(jobId);
        
        // Then
        assertNotNull(result);
        assertEquals(jobId, result.getId());
        assertEquals("test.pdf", result.getFileName());
    }
    
    @Test
    void testGetJob_NotExists() {
        // Given
        UUID jobId = UUID.randomUUID();
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());
        
        // When
        DocumentProcessingJob result = processingService.getJob(jobId);
        
        // Then
        assertNull(result);
    }
}

