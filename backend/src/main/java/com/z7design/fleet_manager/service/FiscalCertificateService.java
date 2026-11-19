package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.fiscal.FiscalEmissionDtos.FiscalCertificateResponse;
import com.z7design.fleet_manager.fiscal.CertificateCrypto;
import com.z7design.fleet_manager.fiscal.FiscalCertificateMaterial;
import com.z7design.fleet_manager.model.FiscalCertificate;
import com.z7design.fleet_manager.repository.FiscalCertificateRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.security.Key;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class FiscalCertificateService {

    private static final Pattern CNPJ_PATTERN =
            Pattern.compile("(\\d{2}\\.?\\d{3}\\.?\\d{3}/?\\d{4}-?\\d{2})");
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    private final FiscalCertificateRepository repository;
    private final CertificateCrypto crypto;

    @Transactional
    public FiscalCertificateResponse upload(MultipartFile file, String password) {
        UUID companyId = requireCompany();
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione o arquivo do certificado A1 (.pfx/.p12).");
        }
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a senha do certificado.");
        }

        byte[] pfx;
        try {
            pfx = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não foi possível ler o arquivo enviado.");
        }

        char[] pass = password.toCharArray();
        LoadedCertificate loaded = load(pfx, pass);
        if (loaded.certificate().getNotAfter().toInstant().isBefore(java.time.Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O certificado enviado está vencido.");
        }

        CertificateCrypto.Encrypted encryptedPfx = crypto.encrypt(pfx);
        CertificateCrypto.Encrypted encryptedPassword = crypto.encrypt(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        FiscalCertificate certificate = new FiscalCertificate();
        certificate.setCompanyId(companyId);
        certificate.setAlias(loaded.alias());
        certificate.setFileName(file.getOriginalFilename());
        certificate.setSubject(loaded.certificate().getSubjectX500Principal().getName());
        certificate.setCnpj(extractCnpj(loaded.certificate()));
        certificate.setSerialNumber(loaded.certificate().getSerialNumber().toString(16));
        certificate.setValidFrom(toLocal(loaded.certificate().getNotBefore()));
        certificate.setValidUntil(toLocal(loaded.certificate().getNotAfter()));
        certificate.setEncryptedPfx(encryptedPfx.cipherText());
        certificate.setPfxIv(encryptedPfx.iv());
        certificate.setEncryptedPassword(encryptedPassword.cipherText());
        certificate.setPasswordIv(encryptedPassword.iv());

        boolean hasActive = repository.findByCompanyIdAndActiveTrue(companyId).isPresent();
        certificate.setActive(!hasActive);
        certificate = repository.save(certificate);
        log.info("Certificado A1 {} armazenado para a empresa {}. CNPJ: {}",
                certificate.getId(), companyId, certificate.getCnpj());
        return toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public List<FiscalCertificateResponse> list() {
        return repository.findByCompanyIdOrderByCreatedAtDesc(requireCompany()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FiscalCertificateResponse activate(UUID id) {
        UUID companyId = requireCompany();
        FiscalCertificate certificate = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificado não encontrado."));
        if (certificate.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível ativar um certificado vencido.");
        }
        repository.deactivateAll(companyId);
        certificate.setActive(true);
        return toResponse(repository.save(certificate));
    }

    @Transactional
    public void delete(UUID id) {
        UUID companyId = requireCompany();
        FiscalCertificate certificate = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificado não encontrado."));
        repository.delete(certificate);
    }

    @Transactional(readOnly = true)
    public FiscalCertificate requireActive(UUID companyId) {
        FiscalCertificate certificate = repository.findByCompanyIdAndActiveTrue(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Nenhum certificado A1 ativo. Envie e ative o certificado e-CNPJ da empresa antes de emitir."));
        if (certificate.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O certificado A1 ativo está vencido.");
        }
        return certificate;
    }

    @Transactional(readOnly = true)
    public FiscalCertificateMaterial material(UUID companyId) {
        FiscalCertificate certificate = requireActive(companyId);
        byte[] pfx = crypto.decrypt(certificate.getEncryptedPfx(), certificate.getPfxIv());
        String password = new String(crypto.decrypt(certificate.getEncryptedPassword(), certificate.getPasswordIv()),
                java.nio.charset.StandardCharsets.UTF_8);
        LoadedCertificate loaded = load(pfx, password.toCharArray());
        return new FiscalCertificateMaterial(loaded.privateKey(), loaded.certificate(), loaded.chain(),
                pfx, password.toCharArray());
    }

    private LoadedCertificate load(byte[] pfx, char[] password) {
        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(pfx), password);
            Enumeration<String> aliases = keyStore.aliases();
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                if (!keyStore.isKeyEntry(alias)) {
                    continue;
                }
                Key key = keyStore.getKey(alias, password);
                if (!(key instanceof PrivateKey privateKey)) {
                    continue;
                }
                java.security.cert.Certificate[] chainArray = keyStore.getCertificateChain(alias);
                if (chainArray == null || chainArray.length == 0) {
                    continue;
                }
                List<X509Certificate> chain = new ArrayList<>();
                for (java.security.cert.Certificate item : chainArray) {
                    if (item instanceof X509Certificate x509) {
                        chain.add(x509);
                    }
                }
                if (chain.isEmpty()) {
                    continue;
                }
                return new LoadedCertificate(alias, privateKey, chain.get(0), chain);
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O arquivo não contém uma chave privada com certificado. Verifique se é um A1 (.pfx/.p12).");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
            if (message.contains("password") || message.contains("mac") || message.contains("integrity")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha do certificado inválida.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não foi possível abrir o certificado. Verifique o arquivo e a senha.");
        }
    }

    private String extractCnpj(X509Certificate certificate) {
        String subject = certificate.getSubjectX500Principal().getName();
        Matcher matcher = CNPJ_PATTERN.matcher(subject);
        if (matcher.find()) {
            return matcher.group(1).replaceAll("\\D", "");
        }
        // Alguns certificados trazem apenas os 14 dígitos no CN.
        Matcher digits = Pattern.compile("(\\d{14})").matcher(subject);
        return digits.find() ? digits.group(1) : null;
    }

    private FiscalCertificateResponse toResponse(FiscalCertificate certificate) {
        return new FiscalCertificateResponse(
                certificate.getId(),
                certificate.getAlias(),
                certificate.getFileName(),
                certificate.getSubject(),
                certificate.getCnpj(),
                certificate.getSerialNumber(),
                certificate.getValidFrom(),
                certificate.getValidUntil(),
                certificate.isActive(),
                certificate.isExpired(),
                certificate.getCreatedAt()
        );
    }

    private static LocalDateTime toLocal(java.util.Date date) {
        return date.toInstant().atZone(ZONE).toLocalDateTime();
    }

    private static UUID requireCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empresa do usuário não identificada.");
        }
        return companyId;
    }

    private record LoadedCertificate(
            String alias,
            PrivateKey privateKey,
            X509Certificate certificate,
            List<X509Certificate> chain
    ) {
        private LoadedCertificate {
            chain = Collections.unmodifiableList(chain);
        }
    }
}
