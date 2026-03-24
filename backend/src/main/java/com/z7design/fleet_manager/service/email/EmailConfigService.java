package com.z7design.fleet_manager.service.email;

import com.z7design.fleet_manager.model.email.EmailConfig;
import com.z7design.fleet_manager.model.enums.EmailContextType;
import com.z7design.fleet_manager.repository.email.EmailConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailConfigService {

    @Autowired
    private EmailConfigRepository emailConfigRepository;

    public EmailConfig save(EmailConfig config) {
        return emailConfigRepository.save(config);
    }

    public List<EmailConfig> findAll() {
        return emailConfigRepository.findAll();
    }

    public Optional<EmailConfig> findById(UUID id) {
        return emailConfigRepository.findById(id);
    }

    public void delete(UUID id) {
        emailConfigRepository.deleteById(id);
    }

    /**
     * Resoluve a configuração correta baseada no contexto.
     * Tenta Departamento -> Empresa -> Global.
     */
    public Optional<EmailConfig> resolveConfig(UUID departmentId, UUID companyId) {
        if (departmentId != null) {
            Optional<EmailConfig> deptConfig = emailConfigRepository
                    .findByContextTypeAndContextId(EmailContextType.DEPARTMENT, departmentId);
            if (deptConfig.isPresent() && deptConfig.get().getIsActive()) {
                return deptConfig;
            }
        }

        if (companyId != null) {
            Optional<EmailConfig> companyConfig = emailConfigRepository
                    .findByContextTypeAndContextId(EmailContextType.COMPANY, companyId);
            if (companyConfig.isPresent() && companyConfig.get().getIsActive()) {
                return companyConfig;
            }
        }

        return emailConfigRepository.findByContextType(EmailContextType.GLOBAL)
                .filter(EmailConfig::getIsActive);
    }
}
