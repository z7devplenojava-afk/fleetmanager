package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.ModeloDocumento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModeloDocumentoRepository extends JpaRepository<ModeloDocumento, UUID> {
    
    /**
     * Busca modelos ativos ordenados por data de criação
     */
    List<ModeloDocumento> findByAtivoTrueOrderByDataCriacaoDesc();
    
    /**
     * Busca modelos por categoria
     */
    List<ModeloDocumento> findByCategoriaAndAtivoTrue(String categoria);
    
    /**
     * Busca modelos por nome (case insensitive)
     */
    List<ModeloDocumento> findByNomeModeloContainingIgnoreCaseAndAtivoTrue(String nome);
    
    /**
     * Busca modelo por nome exato
     */
    Optional<ModeloDocumento> findByNomeModeloAndAtivoTrue(String nomeModelo);
    
    /**
     * Busca modelos criados por um usuário específico
     */
    List<ModeloDocumento> findByCriadoPorIdAndAtivoTrue(UUID criadoPorId);
    
    /**
     * Busca modelos que contêm um placeholder específico
     */
    @Query("SELECT m FROM ModeloDocumento m WHERE m.ativo = true AND m.placeholders LIKE %:placeholder%")
    List<ModeloDocumento> findByPlaceholderContaining(@Param("placeholder") String placeholder);
    
    /**
     * Busca modelos com paginação
     */
    Page<ModeloDocumento> findByAtivoTrueOrderByDataCriacaoDesc(Pageable pageable);
    
    /**
     * Busca modelos por categoria com paginação
     */
    Page<ModeloDocumento> findByCategoriaAndAtivoTrueOrderByDataCriacaoDesc(String categoria, Pageable pageable);
    
    /**
     * Conta modelos ativos por categoria
     */
    @Query("SELECT m.categoria, COUNT(m) FROM ModeloDocumento m WHERE m.ativo = true GROUP BY m.categoria")
    List<Object[]> countByCategoria();
    
    /**
     * Busca modelos que não foram utilizados recentemente
     */
    @Query("SELECT m FROM ModeloDocumento m WHERE m.ativo = true AND m.id NOT IN " +
           "(SELECT DISTINCT dg.modelo.id FROM DocumentoGerado dg WHERE dg.dataCriacao >= :dataLimite)")
    List<ModeloDocumento> findUnusedModels(@Param("dataLimite") java.time.LocalDateTime dataLimite);
    
    /**
     * Verifica se existe modelo com o mesmo nome
     */
    boolean existsByNomeModeloAndAtivoTrue(String nomeModelo);
    
    /**
     * Busca modelos por versão
     */
    List<ModeloDocumento> findByVersaoAndAtivoTrue(String versao);
    
    /**
     * Busca modelos criados em um período específico
     */
    @Query("SELECT m FROM ModeloDocumento m WHERE m.ativo = true AND m.dataCriacao BETWEEN :dataInicio AND :dataFim ORDER BY m.dataCriacao DESC")
    List<ModeloDocumento> findByDataCriacaoBetween(@Param("dataInicio") java.time.LocalDateTime dataInicio, 
                                                   @Param("dataFim") java.time.LocalDateTime dataFim);
}
