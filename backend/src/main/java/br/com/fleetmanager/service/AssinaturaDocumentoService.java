package br.com.fleetmanager.service;

import br.com.fleetmanager.model.AssinaturaDocumento;
import br.com.fleetmanager.model.DocumentoGerado;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.repository.AssinaturaDocumentoRepository;
import br.com.fleetmanager.repository.DocumentoGeradoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AssinaturaDocumentoService {
    
    private final AssinaturaDocumentoRepository assinaturaDocumentoRepository;
    private final DocumentoGeradoRepository documentoGeradoRepository;
    
    public AssinaturaDocumentoService(AssinaturaDocumentoRepository assinaturaDocumentoRepository,
                                     DocumentoGeradoRepository documentoGeradoRepository) {
        this.assinaturaDocumentoRepository = assinaturaDocumentoRepository;
        this.documentoGeradoRepository = documentoGeradoRepository;
    }
    
    /**
     * Cria uma nova assinatura eletrônica
     */
    public AssinaturaDocumento criarAssinaturaEletronica(UUID documentoId, User usuario, 
                                                        HttpServletRequest request, String observacoes) {
        
        DocumentoGerado documento = documentoGeradoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Documento não encontrado"));
        
        // Verificar se já foi assinado por este usuário
        if (assinaturaDocumentoRepository.existsByDocumentoGeradoAndUsuario(documento, usuario)) {
            throw new RuntimeException("Documento já foi assinado por este usuário");
        }
        
        // Obter informações da requisição
        String ipAddress = obterIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        // Criar assinatura
        AssinaturaDocumento assinatura = AssinaturaDocumento.builder()
                .documentoGerado(documento)
                .usuario(usuario)
                .tipoAssinatura(AssinaturaDocumento.TipoAssinatura.ELETRONICA)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .dataAssinatura(LocalDateTime.now())
                .observacoes(observacoes)
                .build();
        
        // Gerar hash da assinatura
        assinatura.gerarHashAssinatura();
        
        // Salvar assinatura
        AssinaturaDocumento assinaturaSalva = assinaturaDocumentoRepository.save(assinatura);
        
        // Atualizar status do documento se necessário
        atualizarStatusDocumento(documento);
        
        return assinaturaSalva;
    }
    
    /**
     * Cria uma assinatura digital (futura implementação)
     */
    public AssinaturaDocumento criarAssinaturaDigital(UUID documentoId, User usuario, 
                                                     String certificadoDigital, String hashDocumento,
                                                     HttpServletRequest request) {
        
        DocumentoGerado documento = documentoGeradoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Documento não encontrado"));
        
        // Verificar se já foi assinado por este usuário
        if (assinaturaDocumentoRepository.existsByDocumentoGeradoAndUsuario(documento, usuario)) {
            throw new RuntimeException("Documento já foi assinado por este usuário");
        }
        
        // Obter informações da requisição
        String ipAddress = obterIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        // Criar assinatura digital
        AssinaturaDocumento assinatura = AssinaturaDocumento.builder()
                .documentoGerado(documento)
                .usuario(usuario)
                .tipoAssinatura(AssinaturaDocumento.TipoAssinatura.DIGITAL)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .dataAssinatura(LocalDateTime.now())
                .certificadoDigital(certificadoDigital)
                .hashAssinatura(hashDocumento)
                .build();
        
        // Salvar assinatura
        AssinaturaDocumento assinaturaSalva = assinaturaDocumentoRepository.save(assinatura);
        
        // Atualizar status do documento
        atualizarStatusDocumento(documento);
        
        return assinaturaSalva;
    }
    
    /**
     * Lista assinaturas de um documento
     */
    @Transactional(readOnly = true)
    public List<AssinaturaDocumento> listarPorDocumento(UUID documentoId) {
        DocumentoGerado documento = documentoGeradoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Documento não encontrado"));
        
        return assinaturaDocumentoRepository.findByDocumentoGeradoOrderByDataAssinaturaDesc(documento);
    }
    
    /**
     * Lista assinaturas de um usuário
     */
    @Transactional(readOnly = true)
    public List<AssinaturaDocumento> listarPorUsuario(UUID usuarioId) {
        return assinaturaDocumentoRepository.findByUsuarioOrderByDataAssinaturaDesc(
                new User() {{ setId(usuarioId); }}
        );
    }
    
    /**
     * Lista assinaturas por tipo
     */
    @Transactional(readOnly = true)
    public List<AssinaturaDocumento> listarPorTipo(AssinaturaDocumento.TipoAssinatura tipo) {
        return assinaturaDocumentoRepository.findByTipoAssinaturaOrderByDataAssinaturaDesc(tipo);
    }
    
    /**
     * Lista assinaturas em um período
     */
    @Transactional(readOnly = true)
    public List<AssinaturaDocumento> listarPorPeriodo(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return assinaturaDocumentoRepository.findByDataAssinaturaBetween(dataInicio, dataFim);
    }
    
    /**
     * Lista assinaturas de um usuário em um período
     */
    @Transactional(readOnly = true)
    public List<AssinaturaDocumento> listarPorUsuarioEPeriodo(UUID usuarioId, LocalDateTime dataInicio, LocalDateTime dataFim) {
        return assinaturaDocumentoRepository.findByUsuarioAndDataAssinaturaBetween(usuarioId, dataInicio, dataFim);
    }
    
    /**
     * Busca assinatura por hash
     */
    @Transactional(readOnly = true)
    public AssinaturaDocumento buscarPorHash(String hashAssinatura) {
        return assinaturaDocumentoRepository.findByHashAssinatura(hashAssinatura)
                .orElseThrow(() -> new RuntimeException("Assinatura não encontrada"));
    }
    
    /**
     * Verifica se hash de assinatura já existe
     */
    @Transactional(readOnly = true)
    public boolean existeHashAssinatura(String hashAssinatura) {
        return assinaturaDocumentoRepository.existsByHashAssinatura(hashAssinatura);
    }
    
    /**
     * Lista assinaturas com certificado digital
     */
    @Transactional(readOnly = true)
    public List<AssinaturaDocumento> listarComCertificadoDigital() {
        return assinaturaDocumentoRepository.findWithDigitalCertificate();
    }
    
    /**
     * Busca última assinatura de um documento
     */
    @Transactional(readOnly = true)
    public AssinaturaDocumento buscarUltimaAssinatura(UUID documentoId) {
        return assinaturaDocumentoRepository.findLatestByDocumentoGerado(documentoId)
                .orElse(null);
    }
    
    /**
     * Estatísticas de assinaturas
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obterEstatisticas() {
        Map<String, Object> stats = new java.util.HashMap<>();
        
        // Contar por tipo de assinatura
        List<Object[]> tipoCounts = assinaturaDocumentoRepository.countByTipoAssinatura();
        Map<String, Long> tipoStats = new java.util.HashMap<>();
        for (Object[] row : tipoCounts) {
            tipoStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("porTipo", tipoStats);
        
        // Contar por usuário
        List<Object[]> usuarioCounts = assinaturaDocumentoRepository.countByUsuario();
        Map<String, Long> usuarioStats = new java.util.HashMap<>();
        for (Object[] row : usuarioCounts) {
            usuarioStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("porUsuario", usuarioStats);
        
        // Assinaturas com certificado digital
        List<AssinaturaDocumento> comCertificado = listarComCertificadoDigital();
        stats.put("comCertificadoDigital", comCertificado.size());
        
        // Assinaturas hoje
        LocalDateTime inicioHoje = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime fimHoje = LocalDateTime.now().toLocalDate().atTime(23, 59, 59);
        List<AssinaturaDocumento> hoje = listarPorPeriodo(inicioHoje, fimHoje);
        stats.put("hoje", hoje.size());
        
        return stats;
    }
    
    /**
     * Obtém IP address da requisição
     */
    private String obterIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Atualiza status do documento baseado nas assinaturas
     */
    private void atualizarStatusDocumento(DocumentoGerado documento) {
        // Se o documento ainda está pendente e foi assinado, marcar como assinado
        if (documento.getStatus() == DocumentoGerado.StatusDocumento.PENDENTE) {
            documento.marcarComoAssinado(documento.getAssinadoPor(), documento.getIpAssinatura());
            documentoGeradoRepository.save(documento);
        }
    }
    
    /**
     * Valida integridade de uma assinatura
     */
    @Transactional(readOnly = true)
    public boolean validarIntegridadeAssinatura(UUID assinaturaId) {
        AssinaturaDocumento assinatura = assinaturaDocumentoRepository.findById(assinaturaId)
                .orElseThrow(() -> new RuntimeException("Assinatura não encontrada"));
        
        // Gerar hash novamente e comparar
        String hashOriginal = assinatura.getHashAssinatura();
        assinatura.gerarHashAssinatura();
        String hashRecalculado = assinatura.getHashAssinatura();
        
        return hashOriginal.equals(hashRecalculado);
    }
}
