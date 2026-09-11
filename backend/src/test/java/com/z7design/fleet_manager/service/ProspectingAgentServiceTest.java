package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.ProspectingLead;
import com.z7design.fleet_manager.repository.KanbanStatusRepository;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.OpportunityRepository;
import com.z7design.fleet_manager.repository.ProspectingLeadRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProspectingAgentServiceTest {

    @Mock
    private ProspectingLeadRepository prospectedLeadRepository;
    @Mock
    private LeadRepository leadRepository;
    @Mock
    private OpportunityRepository opportunityRepository;
    @Mock
    private KanbanStatusRepository kanbanStatusRepository;
    @Mock
    private UserRepository userRepository;

    private ProspectingAgentService service;
    private UUID leadId;

    @BeforeEach
    void setUp() {
        service = new ProspectingAgentService(
            prospectedLeadRepository,
            leadRepository,
            opportunityRepository,
            kanbanStatusRepository,
            userRepository,
            "",    // googleMapsApiKey (empty → disabled)
            false  // googleMapsEnabled
        );
        leadId = UUID.randomUUID();
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — FULL DATA (maximum)
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_allFieldsPresent_scoreIs100() {
        ProspectingLead lead = buildFullLead();
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(100, result.getQualificationScore());
        assertEquals("QUALIFIED", result.getStatus());
        assertNotNull(result.getQualificationNotes());
        assertTrue(result.getQualificationNotes().contains("Pontuação: 100/100"));
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — NO DATA (minimum)
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_noFieldsPresent_scoreIs0() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(0, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — CONTACT ONLY (40 pts)
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_onlyContactFields_scoreIs40() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");
        lead.setEmail("contato@empresa.com.br");
        lead.setWhatsapp("5511999990000");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(40, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus()); // < 50
        assertTrue(result.getQualificationNotes().contains("✓ Telefone encontrado"));
        assertTrue(result.getQualificationNotes().contains("✓ Email encontrado"));
        assertTrue(result.getQualificationNotes().contains("✓ WhatsApp encontrado"));
    }

    @Test
    void qualify_phoneOnly_scoreIs15() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(15, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    @Test
    void qualify_emailOnly_scoreIs15() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setEmail("contato@empresa.com.br");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(15, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    @Test
    void qualify_whatsappOnly_scoreIs10() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setWhatsapp("5511999990000");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(10, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — PARTNERS/PURCHASING (25 pts)
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_partnersOnly_scoreIs15() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPartnerNames("[{\"name\":\"João Silva\",\"role\":\"Sócio Administrador\"}]");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(15, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
        assertTrue(result.getQualificationNotes().contains("✓ Sócios/decisores identificados"));
    }

    @Test
    void qualify_purchasingContactsOnly_scoreIs10() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPurchasingContacts("{\"name\":\"Maria\",\"department\":\"Compras\"}");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(10, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
        assertTrue(result.getQualificationNotes().contains("✓ Contatos de compras disponíveis"));
    }

    @Test
    void qualify_contactPlusPartners_scoreIs65() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");
        lead.setEmail("contato@empresa.com.br");
        lead.setWhatsapp("5511999990000");
        lead.setPartnerNames("[{\"name\":\"João Silva\",\"role\":\"Sócio Administrador\"}]");
        lead.setPurchasingContacts("{\"name\":\"Maria\",\"department\":\"Compras\"}");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(65, result.getQualificationScore());
        assertEquals("QUALIFIED", result.getStatus()); // >= 50
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — COMPANY DATA (20 pts)
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_companyDataOnly_scoreIs20() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setCnpj("12345678000190");
        lead.setCnae("8020-1-00");
        lead.setWebsite("https://www.empresa.com.br");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(20, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
        assertTrue(result.getQualificationNotes().contains("✓ CNAE: 8020-1-00"));
    }

    @Test
    void qualify_cnpjOnly_scoreIs10() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setCnpj("12345678000190");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(10, result.getQualificationScore());
    }

    @Test
    void qualify_cnaeOnly_scoreIs5() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setCnae("8020-1-00");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(5, result.getQualificationScore());
    }

    @Test
    void qualify_websiteOnly_scoreIs5() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setWebsite("https://www.empresa.com.br");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(5, result.getQualificationScore());
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — GOOGLE QUALITY (15 pts)
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_googleRating45PlusMoreThan50Reviews_scoreIs15() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("4.8"));
        lead.setGoogleReviews(150);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(15, result.getQualificationScore());
    }

    @Test
    void qualify_googleRating40_scoreIs7() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("4.2"));
        lead.setGoogleReviews(10);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(7, result.getQualificationScore());
        assertTrue(result.getQualificationNotes().contains("✓ Avaliação Google ≥ 4.0"));
    }

    @Test
    void qualify_googleRating35_scoreIs5() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("3.7"));
        lead.setGoogleReviews(5);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(5, result.getQualificationScore());
    }

    @Test
    void qualify_googleRatingBelow35_scoreIs0() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("2.5"));
        lead.setGoogleReviews(10);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(0, result.getQualificationScore());
        assertFalse(result.getQualificationNotes().contains("✓ Avaliação Google"));
    }

    @Test
    void qualify_googleRating45WithNoReviews_scoreIs10() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("4.6"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(10, result.getQualificationScore());
    }

    @Test
    void qualify_reviewsOver50ButLowRating_scoreIs5() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("3.0"));
        lead.setGoogleReviews(100);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(5, result.getQualificationScore());
    }

    @Test
    void qualify_reviewsExactly50_scoreIs0ForReviews() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleReviews(50);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        // reviews must be > 50, exactly 50 → 0 pts
        assertEquals(0, result.getQualificationScore());
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION SCORE — EDGE CASES
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_emptyStrings_scoreIs0() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("");
        lead.setEmail("   ");
        lead.setWhatsapp("");
        lead.setPartnerNames("");
        lead.setPurchasingContacts("  ");
        lead.setCnpj("");
        lead.setCnae("");
        lead.setWebsite("");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(0, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    @Test
    void qualify_withoutGoogleDataButAllOtherFields_scoreIs85() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");
        lead.setEmail("contato@empresa.com.br");
        lead.setWhatsapp("5511999990000");
        lead.setPartnerNames("[{\"name\":\"João\"}]");
        lead.setPurchasingContacts("{\"name\":\"Maria\"}");
        lead.setCnpj("12345678000190");
        lead.setCnae("8020-1-00");
        lead.setWebsite("https://www.empresa.com.br");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(85, result.getQualificationScore());
        assertEquals("QUALIFIED", result.getStatus());
    }

    @Test
    void qualify_atQualificationBoundary_scoreIsExactly50() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");   // 15
        lead.setEmail("a@b.com");            // 15
        lead.setPartnerNames("[{\"name\":\"X\"}]"); // 15
        lead.setCnae("8020-1-00");           // 5
        // Total: 15 + 15 + 15 + 5 = 50
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(50, result.getQualificationScore());
        assertEquals("QUALIFIED", result.getStatus()); // score >= 50
    }

    @Test
    void qualify_justBelowBoundary_scoreIs45AndDiscarded() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");     // 15
        lead.setWhatsapp("5511999990000");    // 10
        lead.setCnae("8020-1-00");            // 5
        lead.setCnpj("12345678000190");       // 10
        lead.setWebsite("https://a.com");     // 5
        // Total: 15 + 10 + 5 + 10 + 5 = 45
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(45, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION NOTES VERIFICATION
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_notesIncludeAllPresentFields() {
        ProspectingLead lead = buildFullLead();
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        String notes = result.getQualificationNotes();
        assertTrue(notes.contains("✓ Telefone encontrado"));
        assertTrue(notes.contains("✓ Email encontrado"));
        assertTrue(notes.contains("✓ WhatsApp encontrado"));
        assertTrue(notes.contains("✓ Sócios/decisores identificados"));
        assertTrue(notes.contains("✓ Contatos de compras disponíveis"));
        assertTrue(notes.contains("✓ CNAE: 8020-1-00 - Atividades de vigilância"));
        assertTrue(notes.contains("✓ Avaliação Google ≥ 4.0"));
    }

    @Test
    void qualify_notesExcludeAbsentFields() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        String notes = result.getQualificationNotes();
        assertTrue(notes.contains("✓ Telefone encontrado"));
        assertFalse(notes.contains("✓ Email encontrado"));
        assertFalse(notes.contains("✓ WhatsApp encontrado"));
        assertFalse(notes.contains("✓ Sócios/decisores identificados"));
        assertFalse(notes.contains("✓ Contatos de compras disponíveis"));
        assertFalse(notes.contains("✓ CNAE"));
        assertFalse(notes.contains("✓ Avaliação Google"));
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICATION — STATUS TRANSITIONS
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_leadNotFound_throwsException() {
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> service.qualify(leadId));
    }

    @Test
    void qualify_setsStatusQualifiedWhenScoreAtLeast50() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");   // 15
        lead.setEmail("a@b.com");            // 15
        lead.setPartnerNames("[{\"x\":1}]"); // 15
        lead.setCnae("8020-1-00");           // 5
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals("QUALIFIED", result.getStatus());
        verify(prospectedLeadRepository).save(lead);
    }

    @Test
    void qualify_discardedStatusForLowScore() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setWebsite("https://a.com"); // 5 pts only
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals("DISCARDED", result.getStatus());
    }

    @Test
    void qualify_scoreCappedAt100() {
        ProspectingLead lead = buildFullLead();
        lead.setGoogleRating(new BigDecimal("5.0"));
        lead.setGoogleReviews(500);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertTrue(result.getQualificationScore() <= 100);
        assertEquals(100, result.getQualificationScore());
    }

    // ═══════════════════════════════════════════════════════════
    // SCORE ACCUMULATION — COMBINATIONS
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_contactPlusCompany_scoreIs60() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPhone("(11) 99999-0000");
        lead.setEmail("a@b.com");
        lead.setWhatsapp("5511999990000");
        lead.setCnpj("12345678000190");
        lead.setCnae("8020-1-00");
        lead.setWebsite("https://a.com");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(60, result.getQualificationScore());
        assertEquals("QUALIFIED", result.getStatus());
    }

    @Test
    void qualify_partnersPlusGoogle_scoreIs40() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setPartnerNames("[{\"name\":\"X\"}]");
        lead.setPurchasingContacts("{\"name\":\"Y\"}");
        lead.setGoogleRating(new BigDecimal("4.6"));
        lead.setGoogleReviews(100);
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(40, result.getQualificationScore());
        assertEquals("DISCARDED", result.getStatus());
    }

    // ═══════════════════════════════════════════════════════════
    // GOOGLE RATING BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════

    @Test
    void qualify_ratingExactly45_scores10() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("4.50"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(10, result.getQualificationScore());
    }

    @Test
    void qualify_rating449_scores7() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("4.49"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(7, result.getQualificationScore());
    }

    @Test
    void qualify_ratingExactly40_scores7() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("4.0"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(7, result.getQualificationScore());
    }

    @Test
    void qualify_rating399_scores5() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("3.99"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(5, result.getQualificationScore());
    }

    @Test
    void qualify_ratingExactly35_scores5() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("3.50"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(5, result.getQualificationScore());
    }

    @Test
    void qualify_rating349_scores0() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setGoogleRating(new BigDecimal("3.49"));
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.qualify(leadId);

        assertEquals(0, result.getQualificationScore());
    }

    // ═══════════════════════════════════════════════════════════
    // SEARCH — FALLBACK (simulated data)
    // ═══════════════════════════════════════════════════════════

    @Test
    void search_withFilters_returnsSimulatedResults() {
        var filters = new com.z7design.fleet_manager.dto.ProspectingLeadDTO();
        filters.setActivity("Segurança");
        filters.setCity("São Paulo");
        filters.setCnae("8020-1-00");
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        var results = service.search(filters);

        assertNotNull(results);
        assertFalse(results.isEmpty());
        verify(prospectedLeadRepository, atLeastOnce()).save(any(ProspectingLead.class));
    }

    @Test
    void search_withCnpj_searchesByCnpj() {
        var filters = new com.z7design.fleet_manager.dto.ProspectingLeadDTO();
        filters.setCnpj("12.345.678/0001-90");
        when(prospectedLeadRepository.findByCnpj("12345678000190")).thenReturn(java.util.List.of());
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        var results = service.search(filters);

        assertNotNull(results);
        assertFalse(results.isEmpty());
    }

    // ═══════════════════════════════════════════════════════════
    // ENRICH — FALLBACK (simulated data)
    // ═══════════════════════════════════════════════════════════

    @Test
    void enrich_setsStatusToEnriched() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        lead.setCompanyName("Empresa Teste");
        lead.setStatus("FOUND");
        when(prospectedLeadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(prospectedLeadRepository.save(any(ProspectingLead.class))).thenAnswer(i -> i.getArguments()[0]);

        ProspectingLead result = service.enrich(leadId);

        assertEquals("ENRICHED", result.getStatus());
        assertNotNull(result.getPhone());
        assertNotNull(result.getWhatsapp());
        assertNotNull(result.getEmail());
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER
    // ═══════════════════════════════════════════════════════════

    private ProspectingLead buildFullLead() {
        ProspectingLead lead = new ProspectingLead();
        lead.setId(leadId);
        // Contact (40 pts)
        lead.setPhone("(11) 99999-0000");
        lead.setEmail("contato@empresatotal.com.br");
        lead.setWhatsapp("5511999990000");
        // Partners (25 pts)
        lead.setPartnerNames("[{\"name\":\"João Silva\",\"role\":\"Sócio Administrador\"},{\"name\":\"Maria Santos\",\"role\":\"Sócia\"}]");
        lead.setPurchasingContacts("{\"name\":\"Carlos Oliveira\",\"department\":\"Compras\",\"phone\":\"(11) 98888-7777\",\"email\":\"compras@empresatotal.com.br\"}");
        // Company data (20 pts)
        lead.setCnpj("12345678000190");
        lead.setCnae("8020-1-00");
        lead.setCnaeDescription("Atividades de vigilância e segurança");
        lead.setWebsite("https://www.empresatotal.com.br");
        // Google quality (15 pts)
        lead.setGoogleRating(new BigDecimal("4.7"));
        lead.setGoogleReviews(200);
        return lead;
    }
}
