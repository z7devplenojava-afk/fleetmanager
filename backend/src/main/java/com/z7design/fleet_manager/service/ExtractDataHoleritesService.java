package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.ExtractDataHolerites;
import com.z7design.fleet_manager.repository.ExtractDataHoleritesRepository;
import com.z7design.fleet_manager.security.TenantSecurityValidator;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExtractDataHoleritesService {
    
    private final ExtractDataHoleritesRepository extractDataHoleritesRepository;
    private final TenantSecurityValidator tenantSecurityValidator;
    
    /**
     * Salvar dados extraÃ­dos de holerite
     */
    public ExtractDataHolerites saveExtractData(String nome, String cpf, String codigo, String mesReferencia, Integer anoReferencia) {
        log.info("ðŸ’¾ Salvando dados extraÃ­dos: {} - CPF: {} - PerÃ­odo: {}/{}", nome, cpf, mesReferencia, anoReferencia);
        
        // Verificar se jÃ¡ existe registro para este CPF e perÃ­odo
        if (extractDataHoleritesRepository.existsByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia)) {
            log.info("âš ï¸ Dados jÃ¡ existem para CPF {} no perÃ­odo {}/{}. Atualizando...", cpf, mesReferencia, anoReferencia);
            
            // Buscar registro existente e atualizar
            Optional<ExtractDataHolerites> existing = extractDataHoleritesRepository
                .findByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia);
            
            if (existing.isPresent()) {
                ExtractDataHolerites existingData = existing.get();
                tenantSecurityValidator.validateTenantAccess(existingData.getCompanyId());
                existingData.setNome(nome);
                existingData.setCodigo(codigo);
                if (existingData.getCompanyId() == null) {
                    existingData.setCompanyId(TenantContext.get());
                }
                return extractDataHoleritesRepository.save(existingData);
            }
        }
        
        // Criar novo registro
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new IllegalStateException("Não foi possível identificar a empresa do usuário para salvar o holerite.");
        }
        ExtractDataHolerites extractData = ExtractDataHolerites.builder()
                .companyId(tenantId)
                .nome(nome)
                .cpf(cpf)
                .codigo(codigo)
                .mesReferencia(mesReferencia)
                .anoReferencia(anoReferencia)
                .build();
        
        ExtractDataHolerites saved = extractDataHoleritesRepository.save(extractData);
        log.info("âœ… Dados extraÃ­dos salvos com sucesso. ID: {}", saved.getId());
        return saved;
    }
    
    /**
     * Buscar por ID
     */
    public Optional<ExtractDataHolerites> findById(UUID id) {
        return extractDataHoleritesRepository.findById(id);
    }
    
    /**
     * Buscar por CPF
     */
    public Optional<ExtractDataHolerites> findByCpf(String cpf) {
        return extractDataHoleritesRepository.findByCpf(cpf);
    }
    
    /**
     * Buscar por CPF e perÃ­odo
     */
    public Optional<ExtractDataHolerites> findByCpfAndPeriod(String cpf, String mesReferencia, Integer anoReferencia) {
        return extractDataHoleritesRepository.findByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia);
    }
    
    /**
     * Buscar por perÃ­odo
     */
    public List<ExtractDataHolerites> findByPeriod(String mesReferencia, Integer anoReferencia) {
        return extractDataHoleritesRepository.findByMesReferenciaAndAnoReferencia(mesReferencia, anoReferencia);
    }
    
    /**
     * Buscar por nome
     */
    public List<ExtractDataHolerites> findByNome(String nome) {
        return extractDataHoleritesRepository.findByNomeContainingIgnoreCase(nome);
    }
    
    /**
     * Listar todos
     */
    public List<ExtractDataHolerites> findAll() {
        return extractDataHoleritesRepository.findAll();
    }
    
    /**
     * Deletar por ID
     */
    public void deleteById(UUID id) {
        ExtractDataHolerites entity = extractDataHoleritesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registro não encontrado."));
        tenantSecurityValidator.validateTenantAccess(entity.getCompanyId());
        extractDataHoleritesRepository.delete(entity);
    }
    
    /**
     * Verificar se existe registro para CPF e perÃ­odo
     */
    public boolean existsByCpfAndPeriod(String cpf, String mesReferencia, Integer anoReferencia) {
        return extractDataHoleritesRepository.existsByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia);
    }
} 
