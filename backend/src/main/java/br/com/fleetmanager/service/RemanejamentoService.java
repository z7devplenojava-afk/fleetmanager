package br.com.fleetmanager.service;

import br.com.fleetmanager.model.*;
import br.com.fleetmanager.repository.RemanejamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class RemanejamentoService {
    @Autowired
    private RemanejamentoRepository remanejamentoRepository;
    
    @Autowired
    private RemanejamentoHistoricoService historicoService;

    /**
     * Cria um novo remanejamento e registra no histórico
     */
    public Remanejamento create(Remanejamento remanejamento, User usuarioQueExecutou, String motivoAlteracao) {
        Remanejamento saved = remanejamentoRepository.save(remanejamento);
        
        // Registrar no histórico
        historicoService.registrarAcao(
            saved, 
            AcaoHistorico.CRIACAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "Criação de remanejamento"
        );
        
        return saved;
    }

    /**
     * Atualiza um remanejamento existente e registra no histórico
     */
    public Remanejamento update(UUID id, Remanejamento remanejamento, User usuarioQueExecutou, String motivoAlteracao) {
        // Buscar dados anteriores para comparação
        Optional<Remanejamento> existingOpt = remanejamentoRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Remanejamento não encontrado");
        }
        
        Remanejamento existing = existingOpt.get();
        remanejamento.setId(id);
        Remanejamento updated = remanejamentoRepository.save(remanejamento);
        
        // Registrar no histórico com dados anteriores
        historicoService.registrarAcao(
            updated, 
            AcaoHistorico.EDICAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "Edição de remanejamento",
            existing,
            null // IP será capturado pelo controller
        );
        
        return updated;
    }

    /**
     * Exclui um remanejamento e registra no histórico
     */
    public void delete(UUID id, User usuarioQueExecutou, String motivoAlteracao) {
        Optional<Remanejamento> existingOpt = remanejamentoRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Remanejamento não encontrado");
        }
        
        Remanejamento existing = existingOpt.get();
        
        // Registrar no histórico antes de deletar
        historicoService.registrarAcao(
            existing, 
            AcaoHistorico.EXCLUSAO, 
            usuarioQueExecutou, 
            motivoAlteracao != null ? motivoAlteracao : "Exclusão de remanejamento"
        );
        
        remanejamentoRepository.deleteById(id);
    }

    /**
     * Métodos de consulta (não modificam dados, não registram histórico)
     */
    public Optional<Remanejamento> findById(UUID id) {
        return remanejamentoRepository.findById(id);
    }

    public List<Remanejamento> findAll() {
        return remanejamentoRepository.findAll();
    }

    public List<Remanejamento> findByEmployeeId(UUID employeeId) {
        return remanejamentoRepository.findByEmployeeId(employeeId);
    }
    
    /**
     * Métodos de conveniência para compatibilidade com código existente
     */
    public Remanejamento create(Remanejamento remanejamento) {
        // Usar um usuário padrão ou null para compatibilidade
        return create(remanejamento, null, "Criação automática");
    }

    public Remanejamento update(UUID id, Remanejamento remanejamento) {
        // Usar um usuário padrão ou null para compatibilidade
        return update(id, remanejamento, null, "Edição automática");
    }

    public void delete(UUID id) {
        // Usar um usuário padrão ou null para compatibilidade
        delete(id, null, "Exclusão automática");
    }
} 