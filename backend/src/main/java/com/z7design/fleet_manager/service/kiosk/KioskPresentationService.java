package com.z7design.fleet_manager.service.kiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.kiosk.*;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.kiosk.*;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.kiosk.*;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class KioskPresentationService {

    private final KioskPresentationRepository presentationRepository;
    private final KioskSlideRepository slideRepository;
    private final KioskSlideElementRepository slideElementRepository;
    private final KioskPresentationVersionRepository versionRepository;
    private final KioskPublicationRepository publicationRepository;
    private final KioskDeviceRepository deviceRepository;
    private final KioskMediaAssetRepository mediaAssetRepository;
    private final CompanyRepository companyRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final ObjectMapper mapper = new ObjectMapper();

    private UUID getResolvedCompanyId() {
        UUID companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            List<Company> companies = companyRepository.findAll();
            if (!companies.isEmpty()) {
                companyId = companies.get(0).getId();
            } else {
                throw new IllegalStateException("Nenhuma empresa configurada no sistema.");
            }
        }
        return companyId;
    }

    @Transactional(readOnly = true)
    public List<KioskPresentationDTO> findAll() {
        UUID companyId = getResolvedCompanyId();
        return presentationRepository.findByCompanyId(companyId).stream()
                .map(p -> KioskPresentationDTO.fromEntity(p, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<KioskPresentationDTO> findAllPaged(Pageable pageable) {
        UUID companyId = getResolvedCompanyId();
        return presentationRepository.findByCompanyId(companyId, pageable)
                .map(p -> KioskPresentationDTO.fromEntity(p, false));
    }

    @Transactional(readOnly = true)
    public KioskPresentationDTO findById(UUID id) {
        KioskPresentation pres = getPresentationEntity(id);
        return KioskPresentationDTO.fromEntity(pres, true);
    }

    public KioskPresentation getPresentationEntity(UUID id) {
        return presentationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apresentação não encontrada: " + id));
    }

    @Transactional
    public KioskPresentationDTO create(CreateKioskPresentationRequest request) {
        UUID companyId = getResolvedCompanyId();

        KioskPresentation pres = KioskPresentation.builder()
                .companyId(companyId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .idleTimeoutSeconds(request.getIdleTimeoutSeconds() != null ? request.getIdleTimeoutSeconds() : 60)
                .status("DRAFT")
                .build();

        KioskPresentation saved = presentationRepository.save(pres);

        // Cria slide inicial padrão
        KioskSlide initialSlide = KioskSlide.builder()
                .presentationId(saved.getId())
                .name("Slide Inicial")
                .position(0)
                .durationMs(10000L)
                .transitionType("FADE")
                .interactionMode("AUTOMATIC")
                .backgroundType("COLOR")
                .build();

        KioskSlide savedSlide = slideRepository.save(initialSlide);
        saved.setHomeSlideId(savedSlide.getId());
        saved.getSlides().add(savedSlide);
        saved = presentationRepository.save(saved);

        log.info("Apresentação criada: {} (ID: {}) com slide padrão {}", saved.getName(), saved.getId(), savedSlide.getId());
        return KioskPresentationDTO.fromEntity(saved, true);
    }

    @Transactional
    public KioskPresentationDTO update(UUID id, CreateKioskPresentationRequest request) {
        KioskPresentation pres = getPresentationEntity(id);
        pres.setName(request.getName().trim());
        pres.setDescription(request.getDescription());
        if (request.getIdleTimeoutSeconds() != null) {
            pres.setIdleTimeoutSeconds(request.getIdleTimeoutSeconds());
        }

        KioskPresentation saved = presentationRepository.save(pres);
        return KioskPresentationDTO.fromEntity(saved, true);
    }

    @Transactional
    public KioskSlideDTO saveSlide(UUID presentationId, SaveSlideRequest request) {
        KioskPresentation pres = getPresentationEntity(presentationId);

        KioskSlide slide;
        if (request.getId() != null) {
            slide = slideRepository.findById(request.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Slide não encontrado: " + request.getId()));
        } else {
            int nextPos = pres.getSlides() != null ? pres.getSlides().size() : 0;
            slide = KioskSlide.builder()
                    .presentationId(presentationId)
                    .position(request.getPosition() != null ? request.getPosition() : nextPos)
                    .build();
        }

        slide.setName(request.getName() != null ? request.getName().trim() : "Novo Slide");
        if (request.getPosition() != null) slide.setPosition(request.getPosition());
        slide.setDurationMs(request.getDurationMs());
        slide.setTransitionType(request.getTransitionType() != null ? request.getTransitionType() : "FADE");
        slide.setInteractionMode(request.getInteractionMode() != null ? request.getInteractionMode() : "AUTOMATIC");
        slide.setBackgroundType(request.getBackgroundType() != null ? request.getBackgroundType() : "COLOR");
        slide.setBackgroundMediaId(request.getBackgroundMediaId());

        KioskSlide savedSlide = slideRepository.save(slide);

        // Se a apresentação não tinha homeSlideId, define este
        if (pres.getHomeSlideId() == null) {
            pres.setHomeSlideId(savedSlide.getId());
            presentationRepository.save(pres);
        }

        // Salvar Elementos do Slide
        if (request.getElements() != null) {
            // Remove elementos antigos e recria os novos
            slideElementRepository.deleteBySlideId(savedSlide.getId());

            List<KioskSlideElement> newElements = new ArrayList<>();
            for (SaveSlideRequest.SlideElementInput elInput : request.getElements()) {
                String contentJson = toJsonString(elInput.getContent());
                String styleJson = toJsonString(elInput.getStyle());
                String actionJson = toJsonString(elInput.getAction());

                KioskSlideElement el = KioskSlideElement.builder()
                        .slideId(savedSlide.getId())
                        .elementType(elInput.getElementType() != null ? elInput.getElementType() : "TEXT")
                        .contentJson(contentJson)
                        .x(elInput.getX() != null ? elInput.getX() : 0.0)
                        .y(elInput.getY() != null ? elInput.getY() : 0.0)
                        .width(elInput.getWidth() != null ? elInput.getWidth() : 100.0)
                        .height(elInput.getHeight() != null ? elInput.getHeight() : 100.0)
                        .zIndex(elInput.getZIndex() != null ? elInput.getZIndex() : 1)
                        .styleJson(styleJson)
                        .actionJson(actionJson)
                        .build();

                newElements.add(el);
            }
            List<KioskSlideElement> savedElements = slideElementRepository.saveAll(newElements);
            savedSlide.setElements(savedElements);
        }

        return KioskSlideDTO.fromEntity(savedSlide);
    }

    @Transactional
    public void deleteSlide(UUID presentationId, UUID slideId) {
        KioskPresentation pres = getPresentationEntity(presentationId);
        KioskSlide slide = slideRepository.findById(slideId)
                .orElseThrow(() -> new IllegalArgumentException("Slide não encontrado: " + slideId));

        if (!slide.getPresentationId().equals(presentationId)) {
            throw new IllegalArgumentException("Slide não pertence à apresentação informada.");
        }

        slideElementRepository.deleteBySlideId(slideId);
        slideRepository.delete(slide);

        if (pres.getHomeSlideId() != null && pres.getHomeSlideId().equals(slideId)) {
            List<KioskSlide> remaining = slideRepository.findByPresentationIdOrderByPositionAsc(presentationId);
            pres.setHomeSlideId(remaining.isEmpty() ? null : remaining.get(0).getId());
            presentationRepository.save(pres);
        }
    }

    @Transactional
    public void delete(UUID id) {
        KioskPresentation pres = getPresentationEntity(id);
        presentationRepository.delete(pres);
        log.info("Apresentação excluída: {}", id);
    }

    @Transactional
    public List<KioskPublicationDTO> publish(UUID presentationId, PublishPresentationRequest request) {
        KioskPresentation pres = getPresentationEntity(presentationId);
        UUID companyId = pres.getCompanyId();

        // 1. Determina próximo número de versão
        int nextVersion = versionRepository.findMaxVersionNumber(presentationId).orElse(0) + 1;

        // 2. Compila manifesto completo
        Map<String, Object> manifest = compileManifest(pres, nextVersion);
        String manifestJson = toJsonString(manifest);
        String sha256 = calculateSha256(manifestJson.getBytes(StandardCharsets.UTF_8));

        // 3. Salva versão imutável
        KioskPresentationVersion version = KioskPresentationVersion.builder()
                .presentationId(presentationId)
                .versionNumber(nextVersion)
                .manifestJson(manifestJson)
                .checksumSha256(sha256)
                .status("ACTIVE")
                .build();

        KioskPresentationVersion savedVersion = versionRepository.save(version);

        // 4. Atualiza apresentação para PUBLISHED
        pres.setStatus("PUBLISHED");
        presentationRepository.save(pres);

        // 5. Gera publicações para os totens selecionados
        List<KioskPublicationDTO> publications = new ArrayList<>();
        if (request.getDeviceIds() != null && !request.getDeviceIds().isEmpty()) {
            for (UUID deviceId : request.getDeviceIds()) {
                Optional<KioskDevice> optDevice = deviceRepository.findById(deviceId);
                if (optDevice.isEmpty()) continue;

                KioskDevice device = optDevice.get();
                if (!device.getCompanyId().equals(companyId)) continue;

                // Define desired presentation version no totem
                device.setDesiredPresentationVersionId(savedVersion.getId());
                deviceRepository.save(device);

                // Cria publicação
                KioskPublication publication = KioskPublication.builder()
                        .deviceId(deviceId)
                        .presentationVersionId(savedVersion.getId())
                        .status("QUEUED")
                        .progressPercent(0)
                        .scheduledAt(request.getScheduledAt())
                        .build();

                KioskPublication savedPub = publicationRepository.save(publication);
                savedPub.setDevice(device);
                savedPub.setPresentationVersion(savedVersion);
                publications.add(KioskPublicationDTO.fromEntity(savedPub));

                // 6. Broadcast via WebSocket STOMP
                try {
                    Map<String, Object> payload = Map.of(
                            "event", "NEW_VERSION",
                            "presentationId", presentationId.toString(),
                            "versionNumber", nextVersion,
                            "presentationVersionId", savedVersion.getId().toString(),
                            "checksumSha256", sha256,
                            "timestamp", LocalDateTime.now().toString()
                    );
                    messagingTemplate.convertAndSend("/topic/kiosk/" + deviceId, payload);
                    log.info("📡 Notificação de nova versão enviada via STOMP para totem {}", deviceId);
                } catch (Exception wsEx) {
                    log.warn("Erro ao enviar WebSocket para totem {}: {}", deviceId, wsEx.getMessage());
                }
            }
        }

        log.info("Apresentação {} publicada com versão v{} para {} totens", pres.getName(), nextVersion, publications.size());
        return publications;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getManifestForDevice(KioskDevice device) {
        UUID versionId = device.getDesiredPresentationVersionId() != null 
                ? device.getDesiredPresentationVersionId() 
                : device.getActivePresentationVersionId();

        if (versionId == null) {
            return Map.of("message", "Nenhuma apresentação vinculada a este totem ainda.");
        }

        KioskPresentationVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Versão de apresentação não encontrada: " + versionId));

        try {
            return mapper.readValue(version.getManifestJson(), Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao desserializar manifesto da apresentação", e);
        }
    }

    private Map<String, Object> compileManifest(KioskPresentation pres, int versionNumber) {
        List<KioskSlide> slides = slideRepository.findByPresentationIdOrderByPositionAsc(pres.getId());
        List<Map<String, Object>> compiledSlides = new ArrayList<>();
        Set<UUID> referencedMediaIds = new HashSet<>();

        for (KioskSlide slide : slides) {
            List<KioskSlideElement> elements = slideElementRepository.findBySlideIdOrderByZIndexAsc(slide.getId());
            List<Map<String, Object>> compiledElements = new ArrayList<>();

            for (KioskSlideElement el : elements) {
                Map<String, Object> contentMap = fromJson(el.getContentJson());
                Map<String, Object> styleMap = fromJson(el.getStyleJson());
                Map<String, Object> actionMap = fromJson(el.getActionJson());

                if (contentMap.containsKey("mediaId")) {
                    try {
                        referencedMediaIds.add(UUID.fromString(contentMap.get("mediaId").toString()));
                    } catch (Exception ignored) {}
                }

                Map<String, Object> elMap = new LinkedHashMap<>();
                elMap.put("id", el.getId().toString());
                elMap.put("elementType", el.getElementType());
                elMap.put("x", el.getX());
                elMap.put("y", el.getY());
                elMap.put("width", el.getWidth());
                elMap.put("height", el.getHeight());
                elMap.put("zIndex", el.getZIndex());
                elMap.put("content", contentMap);
                elMap.put("style", styleMap);
                elMap.put("action", actionMap);
                compiledElements.add(elMap);
            }

            if (slide.getBackgroundMediaId() != null) {
                referencedMediaIds.add(slide.getBackgroundMediaId());
            }

            Map<String, Object> slideMap = new LinkedHashMap<>();
            slideMap.put("id", slide.getId().toString());
            slideMap.put("name", slide.getName());
            slideMap.put("position", slide.getPosition());
            slideMap.put("durationMs", slide.getDurationMs());
            slideMap.put("transitionType", slide.getTransitionType());
            slideMap.put("interactionMode", slide.getInteractionMode());
            slideMap.put("backgroundType", slide.getBackgroundType());
            slideMap.put("backgroundMediaId", slide.getBackgroundMediaId() != null ? slide.getBackgroundMediaId().toString() : null);
            slideMap.put("elements", compiledElements);
            compiledSlides.add(slideMap);
        }

        // Compilar lista de assets para pré-carregamento offline no player
        List<Map<String, Object>> compiledAssets = new ArrayList<>();
        if (!referencedMediaIds.isEmpty()) {
            List<KioskMediaAsset> assets = mediaAssetRepository.findAllById(referencedMediaIds);
            for (KioskMediaAsset asset : assets) {
                Map<String, Object> assetMap = new LinkedHashMap<>();
                assetMap.put("id", asset.getId().toString());
                assetMap.put("name", asset.getName());
                assetMap.put("mediaType", asset.getMediaType());
                assetMap.put("mimeType", asset.getMimeType());
                assetMap.put("fileSizeBytes", asset.getFileSizeBytes());
                assetMap.put("checksumSha256", asset.getChecksumSha256());
                assetMap.put("url", "/api/player/media/" + asset.getId() + "/content");
                compiledAssets.add(assetMap);
            }
        }

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("presentationId", pres.getId().toString());
        manifest.put("versionNumber", versionNumber);
        manifest.put("name", pres.getName());
        manifest.put("idleTimeoutSeconds", pres.getIdleTimeoutSeconds());
        manifest.put("homeSlideId", pres.getHomeSlideId() != null ? pres.getHomeSlideId().toString() : null);
        manifest.put("slides", compiledSlides);
        manifest.put("assets", compiledAssets);
        manifest.put("publishedAt", LocalDateTime.now().toString());

        return manifest;
    }

    private String toJsonString(Object obj) {
        if (obj == null) return "{}";
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> fromJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return mapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao calcular hash SHA-256", e);
        }
    }
}
