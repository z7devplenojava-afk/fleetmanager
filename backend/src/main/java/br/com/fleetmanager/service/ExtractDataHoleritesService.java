package br.com.fleetmanager.service;

import br.com.fleetmanager.model.ExtractDataHolerites;
import br.com.fleetmanager.repository.ExtractDataHoleritesRepository;
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
    
    /**
     * Salvar dados extraídos de holerite
     */
    public ExtractDataHolerites saveExtractData(String nome, String cpf, String codigo, String mesReferencia, Integer anoReferencia) {
        log.info("💾 Salvando dados extraídos: {} - CPF: {} - Período: {}/{}", nome, cpf, mesReferencia, anoReferencia);
        
        // Verificar se já existe registro para este CPF e período
        if (extractDataHoleritesRepository.existsByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia)) {
            log.info("⚠️ Dados já existem para CPF {} no período {}/{}. Atualizando...", cpf, mesReferencia, anoReferencia);
            
            // Buscar registro existente e atualizar
            Optional<ExtractDataHolerites> existing = extractDataHoleritesRepository
                .findByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia);
            
            if (existing.isPresent()) {
                ExtractDataHolerites existingData = existing.get();
                existingData.setNome(nome);
                existingData.setCodigo(codigo);
                return extractDataHoleritesRepository.save(existingData);
            }
        }
        
        // Criar novo registro
        ExtractDataHolerites extractData = ExtractDataHolerites.builder()
                .nome(nome)
                .cpf(cpf)
                .codigo(codigo)
                .mesReferencia(mesReferencia)
                .anoReferencia(anoReferencia)
                .build();
        
        ExtractDataHolerites saved = extractDataHoleritesRepository.save(extractData);
        log.info("✅ Dados extraídos salvos com sucesso. ID: {}", saved.getId());
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
     * Buscar por CPF e período
     */
    public Optional<ExtractDataHolerites> findByCpfAndPeriod(String cpf, String mesReferencia, Integer anoReferencia) {
        return extractDataHoleritesRepository.findByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia);
    }
    
    /**
     * Buscar por período
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
        extractDataHoleritesRepository.deleteById(id);
    }
    
    /**
     * Verificar se existe registro para CPF e período
     */
    public boolean existsByCpfAndPeriod(String cpf, String mesReferencia, Integer anoReferencia) {
        return extractDataHoleritesRepository.existsByCpfAndMesReferenciaAndAnoReferencia(cpf, mesReferencia, anoReferencia);
    }
} 