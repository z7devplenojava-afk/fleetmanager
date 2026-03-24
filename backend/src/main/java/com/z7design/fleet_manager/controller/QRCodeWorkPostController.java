package com.z7design.fleet_manager.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.z7design.fleet_manager.model.QRCodeWorkPost;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.QRCodeWorkPostRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/qrcode-work-posts")
@RequiredArgsConstructor
@Slf4j
public class QRCodeWorkPostController {

    private final QRCodeWorkPostRepository qrCodeWorkPostRepository;
    private final WorkPostRepository workPostRepository;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('WORK_POST_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> generateQRCode(@RequestBody Map<String, Object> request) {
        try {
            UUID workPostId = UUID.fromString((String) request.get("workPostId"));
            String description = (String) request.get("description");
            UUID createdById = UUID.fromString((String) request.get("createdById"));
            
            Double latitude = request.get("latitude") != null 
                    ? Double.valueOf(request.get("latitude").toString()) : null;
            Double longitude = request.get("longitude") != null 
                    ? Double.valueOf(request.get("longitude").toString()) : null;
            Integer radiusMeters = request.get("radiusMeters") != null 
                    ? (Integer) request.get("radiusMeters") : 100;

            WorkPost workPost = workPostRepository.findById(workPostId)
                    .orElseThrow(() -> new RuntimeException("Posto de trabalho nÃ£o encontrado"));

            // Gerar cÃ³digo QR Ãºnico
            String qrCode = UUID.randomUUID().toString();

            QRCodeWorkPost qrCodeWorkPost = new QRCodeWorkPost();
            qrCodeWorkPost.setWorkPost(workPost);
            qrCodeWorkPost.setQrCode(qrCode);
            qrCodeWorkPost.setDescription(description);
            qrCodeWorkPost.setLatitude(latitude);
            qrCodeWorkPost.setLongitude(longitude);
            qrCodeWorkPost.setRadiusMeters(radiusMeters);
            qrCodeWorkPost.setIsActive(true);
            qrCodeWorkPost.setCreatedById(createdById);

            QRCodeWorkPost saved = qrCodeWorkPostRepository.save(qrCodeWorkPost);

            log.info("âœ… QR Code gerado para posto: {} - CÃ³digo: {}", workPost.getName(), qrCode);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "QR Code gerado com sucesso",
                    "data", saved
            ));

        } catch (Exception e) {
            log.error("Erro ao gerar QR Code: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getQRCodeImage(@PathVariable UUID id) {
        try {
            QRCodeWorkPost qrCodeWorkPost = qrCodeWorkPostRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("QR Code nÃ£o encontrado"));

            // Gerar imagem do QR Code
            int width = 300;
            int height = 300;
            BitMatrix bitMatrix = new MultiFormatWriter().encode(
                    qrCodeWorkPost.getQrCode(),
                    BarcodeFormat.QR_CODE,
                    width,
                    height
            );

            BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            byte[] imageBytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentLength(imageBytes.length);
            headers.set("Content-Disposition", "inline; filename=qrcode.png");

            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);

        } catch (WriterException | IOException e) {
            log.error("Erro ao gerar imagem do QR Code: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Erro: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/work-post/{workPostId}")
    @PreAuthorize("hasAnyAuthority('WORK_POST_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getQRCodesByWorkPost(@PathVariable UUID workPostId) {
        try {
            List<QRCodeWorkPost> qrCodes = qrCodeWorkPostRepository.findByWorkPostId(workPostId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", qrCodes
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar QR Codes: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('WORK_POST_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getActiveQRCodes() {
        try {
            List<QRCodeWorkPost> qrCodes = qrCodeWorkPostRepository.findByIsActiveTrue();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", qrCodes,
                    "total", qrCodes.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar QR Codes ativos: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasAnyAuthority('WORK_POST_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> toggleQRCode(@PathVariable UUID id) {
        try {
            QRCodeWorkPost qrCodeWorkPost = qrCodeWorkPostRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("QR Code nÃ£o encontrado"));

            qrCodeWorkPost.setIsActive(!qrCodeWorkPost.getIsActive());
            QRCodeWorkPost updated = qrCodeWorkPostRepository.save(qrCodeWorkPost);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", updated.getIsActive() ? "QR Code ativado" : "QR Code desativado",
                    "data", updated
            ));
        } catch (Exception e) {
            log.error("Erro ao alterar status do QR Code: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateQRCode(@RequestBody Map<String, String> request) {
        try {
            String qrCode = request.get("qrCode");
            
            QRCodeWorkPost qrCodeWorkPost = qrCodeWorkPostRepository
                    .findValidQRCode(qrCode, LocalDateTime.now())
                    .orElseThrow(() -> new RuntimeException("QR Code invÃ¡lido ou expirado"));

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "valid", true,
                    "workPost", qrCodeWorkPost.getWorkPost(),
                    "qrCodeData", qrCodeWorkPost
            ));

        } catch (Exception e) {
            log.error("Erro ao validar QR Code: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "valid", false,
                    "error", e.getMessage()
            ));
        }
    }
}


