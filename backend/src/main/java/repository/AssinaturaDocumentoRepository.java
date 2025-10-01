package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.AssinaturaDocumento;
import br.com.fleetmanager.model.DocumentoGerado;
import br.com.fleetmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssinaturaDocumentoRepository extends JpaRepository<AssinaturaDocumento, UUID> {
    
    /**
     * Busca assinaturas por documento gerado
     */
    List<AssinaturaDocumento> findByDocumentoGeradoOrderByDataAssinaturaDesc(DocumentoGerado documentoGerado);
    
    /**
     * Busca assinaturas por usuário
     */
    List<AssinaturaDocumento> findByUsuarioOrderByDataAssinaturaDesc(User usuario);
    
    /**
     * Busca assinaturas por tipo
     */
    List<AssinaturaDocumento> findByTipoAssinaturaOrderByDataAssinaturaDesc(AssinaturaDocumento.TipoAssinatura tipoAssinatura);
    
    /**
     * Busca assinaturas por documento e usuário
     */
    List<AssinaturaDocumento> findByDocumentoGeradoAndUsuario(DocumentoGerado documentoGerado, User usuario);
    
    /**
     * Verifica se um usuário já assinou um documento
     */
    boolean existsByDocumentoGeradoAndUsuario(DocumentoGerado documentoGerado, User usuario);
    
    /**
     * Busca assinaturas por IP
     */
    List<AssinaturaDocumento> findByIpAddressOrderByDataAssinaturaDesc(String ipAddress);
    
    /**
     * Busca assinaturas em um período específico
     */
    @Query("SELECT ad FROM AssinaturaDocumento ad WHERE ad.dataAssinatura BETWEEN :dataInicio AND :dataFim ORDER BY ad.dataAssinatura DESC")
    List<AssinaturaDocumento> findByDataAssinaturaBetween(@Param("dataInicio") LocalDateTime dataInicio, 
                                                          @Param("dataFim") LocalDateTime dataFim);
    
    /**
     * Busca assinaturas por usuário em um período específico
     */
    @Query("SELECT ad FROM AssinaturaDocumento ad WHERE ad.usuario.id = :usuarioId AND ad.dataAssinatura BETWEEN :dataInicio AND :dataFim ORDER BY ad.dataAssinatura DESC")
    List<AssinaturaDocumento> findByUsuarioAndDataAssinaturaBetween(@Param("usuarioId") UUID usuarioId,
                                                                   @Param("dataInicio") LocalDateTime dataInicio, 
                                                                   @Param("dataFim") LocalDateTime dataFim);
    
    /**
     * Conta assinaturas por tipo
     */
    @Query("SELECT ad.tipoAssinatura, COUNT(ad) FROM AssinaturaDocumento ad GROUP BY ad.tipoAssinatura")
    List<Object[]> countByTipoAssinatura();
    
    /**
     * Conta assinaturas por usuário
     */
    @Query("SELECT ad.usuario.name, COUNT(ad) FROM AssinaturaDocumento ad GROUP BY ad.usuario.name")
    List<Object[]> countByUsuario();
    
    /**
     * Busca assinaturas com certificado digital
     */
    @Query("SELECT ad FROM AssinaturaDocumento ad WHERE ad.certificadoDigital IS NOT NULL AND ad.certificadoDigital != ''")
    List<AssinaturaDocumento> findWithDigitalCertificate();
    
    /**
     * Busca assinaturas por hash
     */
    Optional<AssinaturaDocumento> findByHashAssinatura(String hashAssinatura);
    
    /**
     * Busca última assinatura de um documento
     */
    @Query("SELECT ad FROM AssinaturaDocumento ad WHERE ad.documentoGerado.id = :documentoId ORDER BY ad.dataAssinatura DESC LIMIT 1")
    Optional<AssinaturaDocumento> findLatestByDocumentoGerado(@Param("documentoId") UUID documentoId);
    
    /**
     * Busca assinaturas por documento com paginação
     */
    @Query("SELECT ad FROM AssinaturaDocumento ad WHERE ad.documentoGerado.id = :documentoId ORDER BY ad.dataAssinatura DESC")
    List<AssinaturaDocumento> findByDocumentoGeradoId(@Param("documentoId") UUID documentoId);
    
    /**
     * Verifica se existe assinatura com hash específico
     */
    boolean existsByHashAssinatura(String hashAssinatura);
    
    /**
     * Busca assinaturas por user agent
     */
    @Query("SELECT ad FROM AssinaturaDocumento ad WHERE ad.userAgent LIKE %:userAgent% ORDER BY ad.dataAssinatura DESC")
    List<AssinaturaDocumento> findByUserAgentContaining(@Param("userAgent") String userAgent);
}
