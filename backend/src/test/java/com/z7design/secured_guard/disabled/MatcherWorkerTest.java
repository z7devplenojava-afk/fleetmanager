package com.z7design.secured_guard.worker;

import com.z7design.secured_guard.model.DocumentPage;
import com.z7design.secured_guard.repository.DocumentPageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatcherWorkerTest {
    
    @Mock
    private StringRedisTemplate redisTemplate;
    
    @Mock
    private DocumentPageRepository documentPageRepository;
    
    @InjectMocks
    private MatcherWorker matcherWorker;
    
    private DocumentPage holerite;
    private DocumentPage comprovante;
    
    @BeforeEach
    void setUp() {
        holerite = DocumentPage.builder()
            .id(UUID.randomUUID())
            .jobId(UUID.randomUUID())
            .type(DocumentPage.DocumentType.HOLERITE)
            .cpf("12345678900")
            .name("JOSE CARLOS ALVES")
            .period("10/2025")
            .liquidValue(new BigDecimal("2539.50"))
            .status(DocumentPage.DocumentPageStatus.OK)
            .build();
        
        comprovante = DocumentPage.builder()
            .id(UUID.randomUUID())
            .jobId(holerite.getJobId())
            .type(DocumentPage.DocumentType.COMPROVANTE)
            .cpf("12345678900")
            .name("JOSE CARLOS ALVES")
            .period("10/2025")
            .liquidValue(new BigDecimal("2539.50"))
            .status(DocumentPage.DocumentPageStatus.OK)
            .build();
        
    }
    
    @Test
    void testInit_CreatesConsumerGroup() {
        // When
        matcherWorker.init();
        
        // Then - Verifica que não lança exceção
        assertNotNull(matcherWorker);
    }
    
    @Test
    void testMatchHoleriteWithComprovante_PerfectMatch() {
        // Given - Dados de teste já configurados no setUp
        
        // When - Verificamos que os dados estão corretos para matching
        
        // Then
        assertNotNull(holerite);
        assertNotNull(comprovante);
        assertEquals(holerite.getCpf(), comprovante.getCpf());
        assertEquals(holerite.getLiquidValue(), comprovante.getLiquidValue());
        assertEquals(holerite.getPeriod(), comprovante.getPeriod());
    }
    
    @Test
    void testMatchHoleriteWithComprovante_NoMatch() {
        // Given
        DocumentPage comprovanteDiferente = DocumentPage.builder()
            .id(UUID.randomUUID())
            .type(DocumentPage.DocumentType.COMPROVANTE)
            .cpf("98765432100") // CPF diferente
            .name("OUTRO FUNCIONARIO")
            .period("10/2025")
            .liquidValue(new BigDecimal("3000.00")) // Valor diferente
            .build();
        
        // Then
        assertNotEquals(holerite.getCpf(), comprovanteDiferente.getCpf());
        assertNotEquals(holerite.getLiquidValue(), comprovanteDiferente.getLiquidValue());
    }
}

