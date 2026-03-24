package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.TwoFactorCode;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.TwoFactorCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwoFactorService {

    private final TwoFactorCodeRepository twoFactorCodeRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Gera um cÃ³digo de 6 dÃ­gitos
     */
    public String generateCode() {
        int code = secureRandom.nextInt(900000) + 100000; // Gera nÃºmero entre 100000 e 999999
        return String.valueOf(code);
    }

    /**
     * Cria e salva um cÃ³digo 2FA para o usuÃ¡rio
     */
    @Transactional
    public TwoFactorCode createCode(User user, String destination) {
        log.info("ðŸ” Criando cÃ³digo 2FA para usuÃ¡rio: {} - Destino: {}", user.getUsername(), destination);

        // Invalidar cÃ³digos anteriores do usuÃ¡rio
        twoFactorCodeRepository.expireAllUserCodes(user.getId());

        // Gerar novo cÃ³digo
        String code = generateCode();
        
        TwoFactorCode twoFactorCode = TwoFactorCode.builder()
                .user(user)
                .code(code)
                .destination(destination)
                .deliveryChannel(TwoFactorCode.DeliveryChannel.WHATSAPP)
                .build();

        twoFactorCode = twoFactorCodeRepository.save(twoFactorCode);
        log.info("âœ… CÃ³digo 2FA criado: {} - Expira em: {}", code, twoFactorCode.getExpiresAt());

        return twoFactorCode;
    }

    /**
     * Valida um cÃ³digo 2FA
     */
    @Transactional
    public boolean validateCode(User user, String code) {
        log.info("ðŸ” Validando cÃ³digo 2FA para usuÃ¡rio: {} - CÃ³digo: {}", 
                user.getUsername(), code);

        var twoFactorCodeOpt = twoFactorCodeRepository.findValidCode(
                user.getId(), code, LocalDateTime.now());

        if (twoFactorCodeOpt.isPresent()) {
            TwoFactorCode validCode = twoFactorCodeOpt.get();
            validCode.markAsUsed();
            twoFactorCodeRepository.save(validCode);
            log.info("âœ… CÃ³digo 2FA vÃ¡lido e marcado como usado");
            return true;
        } else {
            log.warn("âŒ CÃ³digo 2FA invÃ¡lido, expirado ou jÃ¡ usado");
            return false;
        }
    }

    /**
     * Limpa cÃ³digos expirados automaticamente (executa a cada hora)
     */
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void cleanupExpiredCodes() {
        try {
            log.info("ðŸ§¹ Limpando cÃ³digos 2FA expirados");
            // Deleta cÃ³digos expirados hÃ¡ mais de 7 dias
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
            twoFactorCodeRepository.deleteExpiredCodes(cutoffDate);
            log.info("âœ… Limpeza de cÃ³digos 2FA concluÃ­da");
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao limpar cÃ³digos 2FA expirados: {}", e.getMessage(), e);
        }
    }
}


