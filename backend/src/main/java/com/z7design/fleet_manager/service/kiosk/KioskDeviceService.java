package com.z7design.fleet_manager.service.kiosk;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.z7design.fleet_manager.dto.kiosk.CreateKioskDeviceRequest;
import com.z7design.fleet_manager.dto.kiosk.KioskDeviceDTO;
import com.z7design.fleet_manager.dto.kiosk.KioskDeviceEventDTO;
import com.z7design.fleet_manager.dto.kiosk.PairingCodeResponse;
import com.z7design.fleet_manager.dto.kiosk.UpdateKioskDeviceRequest;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.model.kiosk.KioskPairingCode;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceEventRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskPairingCodeRepository;
import com.z7design.fleet_manager.security.KioskDeviceTokenService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KioskDeviceService {

    private final KioskDeviceRepository deviceRepository;
    private final KioskDeviceEventRepository deviceEventRepository;
    private final KioskPairingCodeRepository pairingCodeRepository;
    private final CompanyRepository companyRepository;
    private final ClientRepository clientRepository;
    private final KioskDeviceTokenService tokenService;

    private static final String PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sem 0/O e 1/I para evitar confusão
    private final SecureRandom random = new SecureRandom();

    @Transactional(readOnly = true)
    public List<KioskDeviceDTO> findAll() {
        UUID currentTenant = TenantContext.get();
        List<KioskDevice> devices;
        if (currentTenant != null) {
            devices = deviceRepository.findByCompanyId(currentTenant);
        } else {
            devices = deviceRepository.findAll();
        }
        return devices.stream().map(KioskDeviceDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<KioskDeviceDTO> findAll(Pageable pageable) {
        UUID currentTenant = TenantContext.get();
        Page<KioskDevice> page;
        if (currentTenant != null) {
            page = deviceRepository.findByCompanyId(currentTenant, pageable);
        } else {
            page = deviceRepository.findAll(pageable);
        }
        return page.map(KioskDeviceDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public KioskDeviceDTO findById(UUID id) {
        KioskDevice device = getDeviceOrThrow(id);
        return KioskDeviceDTO.fromEntity(device);
    }

    @Transactional(readOnly = true)
    public List<KioskDeviceEventDTO> findEvents(UUID deviceId) {
        getDeviceOrThrow(deviceId);
        return deviceEventRepository.findByDeviceIdOrderByOccurredAtDesc(deviceId).stream()
                .map(KioskDeviceEventDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public KioskDeviceDTO create(CreateKioskDeviceRequest request) {
        UUID resolvedCompanyId = TenantContext.get();
        if (resolvedCompanyId == null) {
            // Fallback se SUPER_ADMIN não impersonou, usa primeira empresa ativa
            resolvedCompanyId = companyRepository.findAll().stream()
                    .findFirst()
                    .map(Company::getId)
                    .orElseThrow(() -> new BusinessException("Nenhuma empresa cadastrada para vincular o totem"));
        }
        final UUID companyId = resolvedCompanyId;

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada com ID: " + companyId));

        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + request.getClientId()));
        }

        String deviceCode = generateUniqueDeviceCode();

        KioskDevice device = KioskDevice.builder()
                .companyId(companyId)
                .company(company)
                .clientId(client != null ? client.getId() : null)
                .client(client)
                .name(request.getName().trim())
                .description(request.getDescription())
                .deviceCode(deviceCode)
                .platform(request.getPlatform() != null ? request.getPlatform().toUpperCase() : "ANDROID")
                .resolutionWidth(request.getResolutionWidth() != null ? request.getResolutionWidth() : 1080)
                .resolutionHeight(request.getResolutionHeight() != null ? request.getResolutionHeight() : 1920)
                .orientation(request.getOrientation() != null ? request.getOrientation().toUpperCase() : "PORTRAIT")
                .status("PENDING_PAIRING")
                .build();

        device = deviceRepository.save(device);
        log.info("🖥️ Novo totem cadastrado: {} (Código: {}) para empresa {}", device.getName(), device.getDeviceCode(), company.getName());

        return KioskDeviceDTO.fromEntity(device);
    }

    @Transactional
    public KioskDeviceDTO update(UUID id, UpdateKioskDeviceRequest request) {
        KioskDevice device = getDeviceOrThrow(id);

        if (request.getName() != null && !request.getName().isBlank()) {
            device.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            device.setDescription(request.getDescription());
        }
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));
            device.setClientId(client.getId());
            device.setClient(client);
        }
        if (request.getPlatform() != null) {
            device.setPlatform(request.getPlatform().toUpperCase());
        }
        if (request.getResolutionWidth() != null) {
            device.setResolutionWidth(request.getResolutionWidth());
        }
        if (request.getResolutionHeight() != null) {
            device.setResolutionHeight(request.getResolutionHeight());
        }
        if (request.getOrientation() != null) {
            device.setOrientation(request.getOrientation().toUpperCase());
        }
        if (request.getStatus() != null) {
            device.setStatus(request.getStatus().toUpperCase());
        }
        if (request.getDesiredPresentationVersionId() != null) {
            device.setDesiredPresentationVersionId(request.getDesiredPresentationVersionId());
        }

        device = deviceRepository.save(device);
        return KioskDeviceDTO.fromEntity(device);
    }

    @Transactional
    public void delete(UUID id) {
        KioskDevice device = getDeviceOrThrow(id);
        tokenService.revoke(device.getId());
        deviceRepository.delete(device);
        log.info("🗑️ Totem removido: {} ({})", device.getName(), id);
    }

    @Transactional
    public PairingCodeResponse generatePairingCode(UUID deviceId) {
        KioskDevice device = getDeviceOrThrow(deviceId);

        // Invalida códigos ativos anteriores do mesmo totem
        List<KioskPairingCode> oldCodes = pairingCodeRepository.findByDeviceIdAndStatus(deviceId, "ACTIVE");
        for (KioskPairingCode c : oldCodes) {
            c.setStatus("CANCELLED");
        }
        pairingCodeRepository.saveAll(oldCodes);

        // Gera PIN de 6 caracteres aleatórios
        String pin = generateRandomPin(6);

        KioskPairingCode pairingCode = KioskPairingCode.builder()
                .deviceId(deviceId)
                .device(device)
                .pairingCode(pin)
                .expiresAt(LocalDateTime.now().plusMinutes(15)) // Expira em 15 minutos
                .attemptsCount(0)
                .status("ACTIVE")
                .build();

        pairingCodeRepository.save(pairingCode);

        // Gera QR Code em Base64 Data URL contendo o PIN e os dados de pareamento
        String qrDataUrl = generateQrCodeBase64(pin);

        return PairingCodeResponse.builder()
                .pairingCode(pin)
                .expiresAt(pairingCode.getExpiresAt())
                .deviceId(device.getId())
                .deviceCode(device.getDeviceCode())
                .deviceName(device.getName())
                .qrCodeDataUrl(qrDataUrl)
                .build();
    }

    @Transactional
    public void revokeDevice(UUID deviceId) {
        KioskDevice device = getDeviceOrThrow(deviceId);
        device.setStatus("REVOKED");
        device.setRevokedAt(LocalDateTime.now());
        deviceRepository.save(device);

        tokenService.revoke(deviceId);
        log.warn("🚫 Totem {} ({}) teve suas credenciais revogadas.", device.getName(), deviceId);
    }

    private KioskDevice getDeviceOrThrow(UUID id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Totem não encontrado com ID: " + id));
    }

    private String generateUniqueDeviceCode() {
        for (int i = 0; i < 10; i++) {
            String code = "TOTEM-" + generateRandomPin(6);
            if (deviceRepository.findByDeviceCode(code).isEmpty()) {
                return code;
            }
        }
        return "TOTEM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateRandomPin(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PIN_CHARS.charAt(random.nextInt(PIN_CHARS.length())));
        }
        return sb.toString();
    }

    private String generateQrCodeBase64(String content) {
        try {
            BitMatrix bitMatrix = new MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, 250, 250);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] qrBytes = outputStream.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(qrBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar QR Code para pareamento do totem: {}", e.getMessage(), e);
            return null;
        }
    }
}
