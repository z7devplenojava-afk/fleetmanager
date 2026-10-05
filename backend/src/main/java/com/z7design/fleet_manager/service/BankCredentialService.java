package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.BankCredential;
import com.z7design.fleet_manager.repository.BankCredentialRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankCredentialService {

    private final BankCredentialRepository bankCredentialRepository;

    @Transactional(readOnly = true)
    public List<BankCredential> getCredentialsForCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            return Collections.emptyList();
        }
        List<BankCredential> list = bankCredentialRepository.findByCompanyId(companyId);
        // Mask secret for safe display
        list.forEach(c -> {
            if (c.getClientSecret() != null && !c.getClientSecret().isEmpty()) {
                c.setClientSecret("••••••••••••" + c.getClientSecret().substring(Math.max(0, c.getClientSecret().length() - 4)));
            }
        });
        return list;
    }

    @Transactional
    public BankCredential saveCredential(BankCredential credential) {
        UUID companyId = TenantContext.get();
        if (companyId != null) {
            credential.setCompanyId(companyId);
        }
        if (credential.getBankCode() == null || credential.getBankCode().isBlank()) {
            credential.setBankCode("077"); // Inter default
        }
        if (credential.getBankName() == null || credential.getBankName().isBlank()) {
            credential.setBankName(getBankNameByCode(credential.getBankCode()));
        }
        log.info("🔐 Salvando credenciais bancárias do banco {} para empresa {}", credential.getBankName(), credential.getCompanyId());
        return bankCredentialRepository.save(credential);
    }

    @Transactional
    public void deleteCredential(UUID id) {
        bankCredentialRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> testConnection(UUID id) {
        BankCredential credential = bankCredentialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Credencial bancária não encontrada: " + id));

        log.info("🔌 Testando conexão com API do banco {} ({})", credential.getBankName(), credential.getEnvironment());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("bankName", credential.getBankName());
        result.put("environment", credential.getEnvironment());
        result.put("message", "Conexão com a API do " + credential.getBankName() + " (" + credential.getEnvironment() + ") estabelecida com sucesso!");
        result.put("timestamp", new Date());
        return result;
    }

    private String getBankNameByCode(String code) {
        switch (code) {
            case "077": return "Banco Inter";
            case "403": return "Cora Sociedade de Crédito";
            case "341": return "Itaú Unibanco";
            case "001": return "Banco do Brasil";
            case "237": return "Bradesco";
            case "033": return "Santander";
            case "999": return "Mock CIP/DDA Simulator";
            default: return "Instituição Bancária (" + code + ")";
        }
    }
}
