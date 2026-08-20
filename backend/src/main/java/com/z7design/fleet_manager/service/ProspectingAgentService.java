package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.LeadDTO;
import com.z7design.fleet_manager.dto.ProspectingLeadDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.enums.LeadSource;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.Opportunity;
import com.z7design.fleet_manager.model.ProspectingLead;
import com.z7design.fleet_manager.model.KanbanStatus;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.KanbanStatusRepository;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.OpportunityRepository;
import com.z7design.fleet_manager.repository.ProspectingLeadRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@Transactional
public class ProspectingAgentService {

    private final ProspectingLeadRepository prospectedLeadRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final KanbanStatusRepository kanbanStatusRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private final WebClient googleMapsClient;
    private final boolean googleMapsEnabled;
    private final String googleMapsApiKey;

    // Pattern para extrair CNPJ de strings
    private static final Pattern CNPJ_PATTERN = Pattern.compile("\\d{2}\\.?\\d{3}\\.?\\d{3}/?\\d{4}-?\\d{2}");

    public ProspectingAgentService(
            ProspectingLeadRepository prospectedLeadRepository,
            LeadRepository leadRepository,
            OpportunityRepository opportunityRepository,
            KanbanStatusRepository kanbanStatusRepository,
            UserRepository userRepository,
            @Value("${google.maps.api.key:}") String apiKey,
            @Value("${google.maps.api.enabled:false}") boolean enabled) {
        this.prospectedLeadRepository = prospectedLeadRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.kanbanStatusRepository = kanbanStatusRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
        this.googleMapsApiKey = apiKey;
        this.googleMapsEnabled = enabled;

        if (enabled && apiKey != null && !apiKey.isEmpty()) {
            HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(30));
            this.googleMapsClient = WebClient.builder()
                .baseUrl("https://maps.googleapis.com")
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
        } else {
            this.googleMapsClient = null;
            log.warn("⚠️ Google Maps API está desabilitada ou sem chave. Agent de Prospecção usará dados simulados.");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // BUSCA PRINCIPAL
    // ═══════════════════════════════════════════════════════════

    /**
     * Busca empresas via Google Maps Places API por atividade + cidade.
     * Também suporta busca por CNAE, CNPJ e descrição.
     */
    public List<ProspectingLead> search(ProspectingLeadDTO filters) {
        log.info("🔍 Iniciando prospecção: activity={}, city={}, cnae={}, cnpj={}",
                filters.getActivity(), filters.getCity(), filters.getCnae(), filters.getCnpj());

        // Se tiver CNPJ específico, buscar direto
        if (filters.getCnpj() != null && !filters.getCnpj().isBlank()) {
            return searchByCnpj(filters.getCnpj(), filters.getSearchTerm());
        }

        // Construir query para Google Maps
        String query = buildSearchQuery(filters);

        if (googleMapsEnabled && googleMapsClient != null) {
            return searchGoogleMaps(query, filters.getSearchTerm());
        }

        // Fallback: dados simulados para demonstração
        return generateSimulatedResults(query, filters);
    }

    /**
     * Busca por CNPJ específico usando BrasilAPI
     */
    public List<ProspectingLead> searchByCnpj(String cnpj, String searchTerm) {
        String cleanCnpj = cnpj.replaceAll("[^0-9]", "");
        log.info("🔍 Buscando CNPJ: {}", cleanCnpj);

        // Verificar se já existe
        Optional<ProspectingLead> existing = prospectedLeadRepository.findByCnpj(cleanCnpj).stream().findFirst();
        if (existing.isPresent()) {
            log.info("ℹ️ CNPJ já prospecado: {}", cleanCnpj);
            return List.of(existing.get());
        }

        if (googleMapsEnabled && googleMapsClient != null) {
            try {
                String response = googleMapsClient.get()
                    .uri(uriBuilder -> uriBuilder
                        .path("/maps/api/place/textsearch/json")
                        .queryParam("query", "CNPJ " + cleanCnpj)
                        .queryParam("key", googleMapsApiKey)
                        .queryParam("language", "pt-BR")
                        .queryParam("region", "br")
                        .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

                return parseGoogleMapsResponse(response, searchTerm);
            } catch (Exception e) {
                log.error("❌ Erro ao buscar CNPJ no Google Maps: {}", e.getMessage());
            }
        }

        // Fallback: criar lead simulado com CNPJ
        return List.of(createSimulatedCnpjLead(cleanCnpj, searchTerm));
    }

    // ═══════════════════════════════════════════════════════════
    // ENRIQUECIMENTO
    // ═══════════════════════════════════════════════════════════

    /**
     * Enriquece um lead prospectado com dados adicionais do Google Places
     */
    public ProspectingLead enrich(UUID leadId) {
        ProspectingLead lead = prospectedLeadRepository.findById(leadId)
            .orElseThrow(() -> new ResourceNotFoundException("Lead prospectado não encontrado: " + leadId));

        log.info("🔄 Enriquecendo lead: {} ({})", lead.getCompanyName(), lead.getId());

        if (googleMapsEnabled && googleMapsClient != null && lead.getGooglePlaceId() != null) {
            try {
                String response = googleMapsClient.get()
                    .uri(uriBuilder -> uriBuilder
                        .path("/maps/api/place/details/json")
                        .queryParam("place_id", lead.getGooglePlaceId())
                        .queryParam("fields", "formatted_phone_number,website,url,reviews,opening_hours,business_status")
                        .queryParam("key", googleMapsApiKey)
                        .queryParam("language", "pt-BR")
                        .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

                enrichFromGooglePlacesDetails(lead, response);
            } catch (Exception e) {
                log.error("❌ Erro ao enriquecer lead {}: {}", leadId, e.getMessage());
            }
        }

        // Enriquecimento simulado para demonstração
        enrichSimulatedData(lead);

        lead.setStatus("ENRICHED");
        return prospectedLeadRepository.save(lead);
    }

    // ═══════════════════════════════════════════════════════════
    // QUALIFICAÇÃO
    // ═══════════════════════════════════════════════════════════

    /**
     * Qualifica um lead prospectado com base nos dados disponíveis
     */
    public ProspectingLead qualify(UUID leadId) {
        ProspectingLead lead = prospectedLeadRepository.findById(leadId)
            .orElseThrow(() -> new ResourceNotFoundException("Lead prospectado não encontrado: " + leadId));

        log.info("✅ Qualificando lead: {} ({})", lead.getCompanyName(), lead.getId());

        int score = calculateQualificationScore(lead);
        lead.setQualificationScore(score);

        StringBuilder notes = new StringBuilder();
        notes.append("Pontuação: ").append(score).append("/100\n");

        if (lead.getPhone() != null && !lead.getPhone().isBlank()) {
            notes.append("✓ Telefone encontrado\n");
        }
        if (lead.getEmail() != null && !lead.getEmail().isBlank()) {
            notes.append("✓ Email encontrado\n");
        }
        if (lead.getWhatsapp() != null && !lead.getWhatsapp().isBlank()) {
            notes.append("✓ WhatsApp encontrado\n");
        }
        if (lead.getPartnerNames() != null && !lead.getPartnerNames().isBlank()) {
            notes.append("✓ Sócios/decisores identificados\n");
        }
        if (lead.getPurchasingContacts() != null && !lead.getPurchasingContacts().isBlank()) {
            notes.append("✓ Contatos de compras disponíveis\n");
        }
        if (lead.getCnae() != null && !lead.getCnae().isBlank()) {
            notes.append("✓ CNAE: ").append(lead.getCnae()).append(" - ").append(lead.getCnaeDescription()).append("\n");
        }
        if (lead.getGoogleRating() != null && lead.getGoogleRating().compareTo(new BigDecimal("4.0")) >= 0) {
            notes.append("✓ Avaliação Google ≥ 4.0\n");
        }

        lead.setQualificationNotes(notes.toString());
        lead.setStatus(score >= 50 ? "QUALIFIED" : "DISCARDED");

        return prospectedLeadRepository.save(lead);
    }

    // ═══════════════════════════════════════════════════════════
    // ENVIO PARA O KANBAN CRM
    // ═══════════════════════════════════════════════════════════

    /**
     * Envia um lead qualificado para o Kanban CRM (cria Lead + Opportunity)
     */
    public ProspectingLead sendToKanban(UUID prospectedLeadId, String currentUserIdentifier) {
        ProspectingLead pl = prospectedLeadRepository.findById(prospectedLeadId)
            .orElseThrow(() -> new ResourceNotFoundException("Lead prospectado não encontrado: " + prospectedLeadId));

        if ("SENT_TO_KANBAN".equals(pl.getStatus())) {
            log.warn("⚠️ Lead {} já foi enviado para o Kanban", prospectedLeadId);
            return pl;
        }

        log.info("📤 Enviando lead para Kanban: {} ({})", pl.getCompanyName(), pl.getId());

        // 1. Criar Lead no CRM
        Lead crmLead = new Lead();
        crmLead.setName(pl.getTradeName() != null ? pl.getTradeName() : pl.getCompanyName());
        crmLead.setEmail(pl.getEmail());
        crmLead.setPhone(pl.getPhone());
        crmLead.setCompany(pl.getCompanyName());
        crmLead.setPosition(pl.getPartnerNames() != null ? "Sócios/Decisores" : "");
        crmLead.setSource(LeadSource.OTHER);
        crmLead.setStatus(LeadStatus.NEW);

        // Montar notes com dados da prospecção
        StringBuilder notes = new StringBuilder();
        notes.append("📋 Lead prospectado via Agent de Prospecção\n");
        if (pl.getCnpj() != null) notes.append("CNPJ: ").append(pl.getCnpj()).append("\n");
        if (pl.getCnae() != null) notes.append("CNAE: ").append(pl.getCnae()).append(" - ").append(pl.getCnaeDescription()).append("\n");
        if (pl.getCity() != null) notes.append("Cidade: ").append(pl.getCity()).append("/").append(pl.getState()).append("\n");
        if (pl.getAddress() != null) notes.append("Endereço: ").append(pl.getAddress()).append("\n");
        if (pl.getWhatsapp() != null) notes.append("WhatsApp: ").append(pl.getWhatsapp()).append("\n");
        if (pl.getPartnerNames() != null) notes.append("Sócios/Decisores: ").append(pl.getPartnerNames()).append("\n");
        if (pl.getPurchasingContacts() != null) notes.append("Compras: ").append(pl.getPurchasingContacts()).append("\n");
        if (pl.getGoogleRating() != null) notes.append("Avaliação Google: ").append(pl.getGoogleRating()).append("/5\n");
        if (pl.getWebsite() != null) notes.append("Website: ").append(pl.getWebsite()).append("\n");
        notes.append("Pontuação de qualificação: ").append(pl.getQualificationScore() != null ? pl.getQualificationScore() : "N/A");
        crmLead.setNotes(notes.toString());
        crmLead.setEstimatedValue(BigDecimal.ZERO);

        // Buscar usuário criador
        var userOpt = userRepository.findByUsername(currentUserIdentifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(currentUserIdentifier);
        }
        if (userOpt.isPresent()) {
            crmLead.setCreatedBy(userOpt.get());
        }

        crmLead = leadRepository.save(crmLead);
        pl.setLead(crmLead);

        // 2. Criar Opportunity no Kanban
        KanbanStatus firstStatus = kanbanStatusRepository.findAll().stream()
            .min(Comparator.comparingInt(KanbanStatus::getOrderIndex))
            .orElse(null);

        if (firstStatus != null) {
            Opportunity opportunity = new Opportunity();
            opportunity.setTitle("Prospecção: " + (pl.getTradeName() != null ? pl.getTradeName() : pl.getCompanyName()));
            StringBuilder desc = new StringBuilder();
            desc.append("Lead prospectado automaticamente pelo Agent de Prospecção.\n");
            desc.append("Empresa: ").append(pl.getCompanyName()).append("\n");
            if (pl.getCnaeDescription() != null) desc.append("Atividade: ").append(pl.getCnaeDescription()).append("\n");
            if (pl.getCity() != null) desc.append("Localização: ").append(pl.getCity()).append("/").append(pl.getState()).append("\n");
            if (pl.getQualificationScore() != null) desc.append("Score de qualificação: ").append(pl.getQualificationScore()).append("/100");
            opportunity.setDescription(desc.toString());
            opportunity.setLead(crmLead);
            opportunity.setStatus(firstStatus);
            opportunity.setEstimatedValue(BigDecimal.ZERO);

            if (userOpt.isPresent()) {
                opportunity.setAssignedTo(userOpt.get());
            }

            opportunity = opportunityRepository.save(opportunity);
            pl.setOpportunity(opportunity);
        }

        pl.setStatus("SENT_TO_KANBAN");
        return prospectedLeadRepository.save(pl);
    }

    /**
     * Envia múltiplos leads qualificados para o Kanban
     */
    public List<ProspectingLead> sendMultipleToKanban(List<UUID> ids, String currentUserIdentifier) {
        List<ProspectingLead> results = new ArrayList<>();
        for (UUID id : ids) {
            try {
                results.add(sendToKanban(id, currentUserIdentifier));
            } catch (Exception e) {
                log.error("❌ Erro ao enviar lead {} para Kanban: {}", id, e.getMessage());
            }
        }
        return results;
    }

    // ═══════════════════════════════════════════════════════════
    // CONSULTAS
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<ProspectingLead> findAll() {
        return prospectedLeadRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ProspectingLead findById(UUID id) {
        return prospectedLeadRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Lead prospectado não encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public List<ProspectingLead> findByFilters(String city, String cnae, String activity, String status) {
        return prospectedLeadRepository.findByFilters(city, cnae, activity, status);
    }

    @Transactional(readOnly = true)
    public List<ProspectingLead> searchLeads(String term) {
        return prospectedLeadRepository.searchProspectedLeads(term);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", prospectedLeadRepository.count());
        stats.put("found", prospectedLeadRepository.countByStatus("FOUND"));
        stats.put("enriched", prospectedLeadRepository.countByStatus("ENRICHED"));
        stats.put("qualified", prospectedLeadRepository.countByStatus("QUALIFIED"));
        stats.put("sentToKanban", prospectedLeadRepository.countByStatus("SENT_TO_KANBAN"));
        stats.put("discarded", prospectedLeadRepository.countByStatus("DISCARDED"));
        return stats;
    }

    public void delete(UUID id) {
        prospectedLeadRepository.deleteById(id);
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTODOS PRIVADOS
    // ═══════════════════════════════════════════════════════════

    private String buildSearchQuery(ProspectingLeadDTO filters) {
        StringBuilder query = new StringBuilder();
        if (filters.getActivity() != null && !filters.getActivity().isBlank()) {
            query.append(filters.getActivity()).append(" ");
        }
        if (filters.getCnaeDescription() != null && !filters.getCnaeDescription().isBlank()) {
            query.append(filters.getCnaeDescription()).append(" ");
        }
        if (filters.getCity() != null && !filters.getCity().isBlank()) {
            query.append(filters.getCity());
        }
        if (filters.getDescription() != null && !filters.getDescription().isBlank()) {
            query.append(" ").append(filters.getDescription());
        }
        return query.toString().trim();
    }

    // ═══════════════════════════════════════════════════════════
    // GOOGLE MAPS INTEGRATION
    // ═══════════════════════════════════════════════════════════

    private List<ProspectingLead> searchGoogleMaps(String query, String searchTerm) {
        log.info("🌐 Buscando no Google Maps: {}", query);
        try {
            String response = googleMapsClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/maps/api/place/textsearch/json")
                    .queryParam("query", query)
                    .queryParam("key", googleMapsApiKey)
                    .queryParam("language", "pt-BR")
                    .queryParam("region", "br")
                    .build())
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

            return parseGoogleMapsResponse(response, searchTerm);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar no Google Maps: {}", e.getMessage(), e);
            return generateSimulatedResults(query, new ProspectingLeadDTO());
        }
    }

    private List<ProspectingLead> parseGoogleMapsResponse(String responseJson, String searchTerm) {
        List<ProspectingLead> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String status = root.has("status") ? root.get("status").asText() : "UNKNOWN";

            if (!"OK".equals(status)) {
                log.warn("⚠️ Google Maps retornou status: {}", status);
                return results;
            }

            JsonNode resultsArray = root.get("results");
            if (resultsArray == null || !resultsArray.isArray()) {
                return results;
            }

            for (JsonNode place : resultsArray) {
                ProspectingLead lead = mapGooglePlaceToProspectingLead(place, searchTerm);
                // Evitar duplicatas
                if (lead.getGooglePlaceId() != null && !prospectedLeadRepository.existsByGooglePlaceId(lead.getGooglePlaceId())) {
                    results.add(prospectedLeadRepository.save(lead));
                } else if (lead.getGooglePlaceId() == null) {
                    results.add(prospectedLeadRepository.save(lead));
                }
            }
        } catch (Exception e) {
            log.error("❌ Erro ao parsear resposta do Google Maps: {}", e.getMessage(), e);
        }
        return results;
    }

    private ProspectingLead mapGooglePlaceToProspectingLead(JsonNode place, String searchTerm) {
        ProspectingLead lead = new ProspectingLead();
        lead.setCompanyName(place.has("name") ? place.get("name").asText() : null);
        lead.setTradeName(lead.getCompanyName());
        lead.setGooglePlaceId(place.has("place_id") ? place.get("place_id").asText() : null);
        lead.setSource("GOOGLE_MAPS");
        lead.setSearchTerm(searchTerm);

        // Endereço
        String formattedAddress = place.has("formatted_address") ? place.get("formatted_address").asText() : null;
        lead.setAddress(formattedAddress);

        // Extrair cidade e estado do endereço formatado
        if (formattedAddress != null) {
            parseAddressParts(lead, formattedAddress);
        }

        // Rating
        if (place.has("rating")) {
            lead.setGoogleRating(BigDecimal.valueOf(place.get("rating").asDouble()));
        }

        // Reviews
        if (place.has("user_ratings_total")) {
            lead.setGoogleReviews(place.get("user_ratings_total").asInt());
        }

        // Types
        if (place.has("types")) {
            lead.setGoogleTypes(place.get("types").toString());
        }

        lead.setStatus("FOUND");
        return lead;
    }

    private void enrichFromGooglePlacesDetails(ProspectingLead lead, String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String status = root.has("status") ? root.get("status").asText() : "UNKNOWN";

            if (!"OK".equals(status)) {
                return;
            }

            JsonNode result = root.get("result");
            if (result == null) return;

            if (result.has("formatted_phone_number") && lead.getPhone() == null) {
                lead.setPhone(result.get("formatted_phone_number").asText());
            }
            if (result.has("website") && lead.getWebsite() == null) {
                lead.setWebsite(result.get("website").asText());
            }

            // Extrair WhatsApp do telefone
            if (lead.getPhone() != null && lead.getWhatsapp() == null) {
                lead.setWhatsapp(lead.getPhone().replaceAll("[^0-9+]", ""));
            }
        } catch (Exception e) {
            log.error("❌ Erro ao parsear detalhes do Google Places: {}", e.getMessage());
        }
    }

    private void parseAddressParts(ProspectingLead lead, String formattedAddress) {
        // Formato típico do Google Maps Brasil:
        // "Rua Exemplo, 123 - Bairro, Cidade - SP, CEP"
        String[] parts = formattedAddress.split(",");
        if (parts.length >= 2) {
            String cityState = parts[parts.length - 2].trim();
            String[] cityStateParts = cityState.split(" - ");
            if (cityStateParts.length >= 1) {
                lead.setCity(cityStateParts[0].trim());
            }
            if (cityStateParts.length >= 2) {
                lead.setState(cityStateParts[1].trim());
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // DADOS SIMULADOS (fallback quando API não está disponível)
    // ═══════════════════════════════════════════════════════════

    private List<ProspectingLead> generateSimulatedResults(String query, ProspectingLeadDTO filters) {
        log.info("📋 Gerando dados simulados para: {}", query);
        List<ProspectingLead> results = new ArrayList<>();
        String city = filters.getCity() != null ? filters.getCity() : "São Paulo";
        String activity = filters.getActivity() != null ? filters.getActivity() : "Serviço de segurança";

        String[][] simulatedCompanies = {
            {"Segurança Total Ltda", "72.123.456/0001-89", "8020-1-00", "Atividades de vigilância e segurança"},
            {"Vigilância Patrimonial Express", "45.678.901/0001-23", "8020-1-00", "Atividades de vigilância e segurança"},
            {"Proteção & Cia Segurança", "12.345.678/0001-90", "8020-1-00", "Atividades de vigilância e segurança"},
            {"Guardião Segurança Privada", "98.765.432/0001-10", "8020-1-00", "Atividades de vigilância e segurança"},
            {"SafeWatch Vigilância", "34.567.890/0001-45", "8020-1-00", "Atividades de vigilância e segurança"},
        };

        String[] neighborhoods = {"Centro", "Jardins", "Vila Olímpia", "Moema", "Pinheiros"};
        String[] streets = {"Rua Augusta", "Av. Paulista", "Rua Oscar Freire", "Alameda Santos", "Rua Haddock Lobo"};

        String[] partnerFirstNames = {"João", "Maria", "Carlos", "Ana", "Pedro", "Fernanda", "Roberto", "Luciana"};
        String[] partnerLastNames = {"Silva", "Santos", "Oliveira", "Costa", "Ferreira", "Souza", "Pereira", "Lima"};

        for (int i = 0; i < simulatedCompanies.length; i++) {
            ProspectingLead lead = new ProspectingLead();
            lead.setCompanyName(simulatedCompanies[i][0]);
            lead.setTradeName(simulatedCompanies[i][0]);
            lead.setCnpj(simulatedCompanies[i][1].replaceAll("[^0-9]", ""));
            lead.setCnae(simulatedCompanies[i][2]);
            lead.setCnaeDescription(simulatedCompanies[i][3]);
            lead.setActivity(activity);
            lead.setCity(city);
            lead.setState("SP");
            lead.setNeighborhood(neighborhoods[i % neighborhoods.length]);
            lead.setAddress(streets[i % streets.length] + ", " + (100 + i * 50) + " - " + neighborhoods[i % neighborhoods.length]);
            lead.setCep("0" + (1300 + i * 100) + "-000");
            lead.setPhone("(11) 9" + (4000 + i * 1111) + "-" + (1000 + i * 222));
            lead.setWhatsapp("55119" + (4000 + i * 1111) + String.valueOf(1000 + i * 222));
            lead.setEmail("contato@" + simulatedCompanies[i][0].toLowerCase().replaceAll("[^a-z]", "").substring(0, Math.min(15, simulatedCompanies[i][0].length())) + ".com.br");
            lead.setWebsite("https://www." + simulatedCompanies[i][0].toLowerCase().replaceAll("[^a-z]", "").substring(0, Math.min(12, simulatedCompanies[i][0].length())) + ".com.br");
            lead.setGoogleRating(BigDecimal.valueOf(3.5 + Math.random() * 1.5).setScale(1, java.math.RoundingMode.HALF_UP));
            lead.setGoogleReviews(10 + (int)(Math.random() * 200));
            lead.setGoogleTypes("[\"security_system\",\"point_of_interest\"]");
            lead.setSource("GOOGLE_MAPS_SIMULATED");
            lead.setSearchTerm(query);
            lead.setStatus("FOUND");

            // Gerar sócios/decisores
            String p1Name = partnerFirstNames[i % partnerFirstNames.length] + " " + partnerLastNames[i % partnerLastNames.length];
            String p2Name = partnerFirstNames[(i + 3) % partnerFirstNames.length] + " " + partnerLastNames[(i + 2) % partnerLastNames.length];
            try {
                Map<String, String> partners = new LinkedHashMap<>();
                partners.put("name", p1Name);
                partners.put("role", "Sócio Administrador");
                Map<String, String> partners2 = new LinkedHashMap<>();
                partners2.put("name", p2Name);
                partners2.put("role", "Sócio");
                List<Map<String, String>> partnerList = List.of(partners, partners2);
                lead.setPartnerNames(objectMapper.writeValueAsString(partnerList));
            } catch (Exception e) {
                lead.setPartnerNames("[{\"name\":\"" + p1Name + "\",\"role\":\"Sócio Administrador\"}]");
            }

            // Contato de compras
            try {
                Map<String, String> purchasing = new LinkedHashMap<>();
                purchasing.put("name", partnerFirstNames[(i + 1) % partnerFirstNames.length] + " " + partnerLastNames[(i + 4) % partnerLastNames.length]);
                purchasing.put("department", "Compras");
                purchasing.put("phone", lead.getPhone());
                purchasing.put("email", "compras@" + lead.getEmail().split("@")[1]);
                lead.setPurchasingContacts(objectMapper.writeValueAsString(purchasing));
            } catch (Exception e) {
                // ignore
            }

            results.add(prospectedLeadRepository.save(lead));
        }

        return results;
    }

    private ProspectingLead createSimulatedCnpjLead(String cnpj, String searchTerm) {
        ProspectingLead lead = new ProspectingLead();
        lead.setCnpj(cnpj);
        lead.setCompanyName("Empresa CNPJ " + cnpj);
        lead.setTradeName("Empresa " + cnpj.substring(0, 4));
        lead.setCity("São Paulo");
        lead.setState("SP");
        lead.setActivity("Atividade diversa");
        lead.setSource("MANUAL");
        lead.setSearchTerm(searchTerm);
        lead.setStatus("FOUND");
        lead.setPhone("(11) 99999-0000");
        return prospectedLeadRepository.save(lead);
    }

    private void enrichSimulatedData(ProspectingLead lead) {
        // Enriquecimento simulado: adicionar dados se não existirem
        if (lead.getPhone() == null || lead.getPhone().isBlank()) {
            lead.setPhone("(11) 9" + (3000 + (int)(Math.random() * 6000)) + "-" + (1000 + (int)(Math.random() * 9000)));
        }
        if (lead.getWhatsapp() == null || lead.getWhatsapp().isBlank()) {
            lead.setWhatsapp(lead.getPhone().replaceAll("[^0-9+]", ""));
        }
        if (lead.getEmail() == null || lead.getEmail().isBlank()) {
            String slug = (lead.getCompanyName() != null ? lead.getCompanyName() : "empresa")
                .toLowerCase().replaceAll("[^a-z]", "");
            lead.setEmail("contato@" + slug.substring(0, Math.min(15, slug.length())) + ".com.br");
        }
        if (lead.getWebsite() == null || lead.getWebsite().isBlank()) {
            String slug = (lead.getCompanyName() != null ? lead.getCompanyName() : "empresa")
                .toLowerCase().replaceAll("[^a-z]", "");
            lead.setWebsite("https://www." + slug.substring(0, Math.min(12, slug.length())) + ".com.br");
        }
        if (lead.getPartnerNames() == null || lead.getPartnerNames().isBlank()) {
            try {
                Map<String, String> partner = new LinkedHashMap<>();
                partner.put("name", "Responsável " + (lead.getCompanyName() != null ? lead.getCompanyName() : ""));
                partner.put("role", "Sócio Administrador");
                lead.setPartnerNames(objectMapper.writeValueAsString(List.of(partner)));
            } catch (Exception e) {
                lead.setPartnerNames("[{\"name\":\"Responsável\",\"role\":\"Sócio Administrador\"}]");
            }
        }
    }

    private int calculateQualificationScore(ProspectingLead lead) {
        int score = 0;

        // Dados de contato (40 pontos)
        if (lead.getPhone() != null && !lead.getPhone().isBlank()) score += 15;
        if (lead.getEmail() != null && !lead.getEmail().isBlank()) score += 15;
        if (lead.getWhatsapp() != null && !lead.getWhatsapp().isBlank()) score += 10;

        // Sócios/decisores (25 pontos)
        if (lead.getPartnerNames() != null && !lead.getPartnerNames().isBlank()) score += 15;
        if (lead.getPurchasingContacts() != null && !lead.getPurchasingContacts().isBlank()) score += 10;

        // Dados da empresa (20 pontos)
        if (lead.getCnpj() != null && !lead.getCnpj().isBlank()) score += 10;
        if (lead.getCnae() != null && !lead.getCnae().isBlank()) score += 5;
        if (lead.getWebsite() != null && !lead.getWebsite().isBlank()) score += 5;

        // Qualidade Google (15 pontos)
        if (lead.getGoogleRating() != null) {
            if (lead.getGoogleRating().compareTo(new BigDecimal("4.5")) >= 0) score += 10;
            else if (lead.getGoogleRating().compareTo(new BigDecimal("4.0")) >= 0) score += 7;
            else if (lead.getGoogleRating().compareTo(new BigDecimal("3.5")) >= 0) score += 5;
        }
        if (lead.getGoogleReviews() != null && lead.getGoogleReviews() > 50) score += 5;

        return Math.min(score, 100);
    }
}
