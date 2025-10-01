package br.com.fleetmanager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.com.fleetmanager.model.*;
import br.com.fleetmanager.repository.DocumentoGeradoRepository;
import br.com.fleetmanager.repository.ModeloDocumentoRepository;
import br.com.fleetmanager.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class DocumentoGeradoService {
    
    private final DocumentoGeradoRepository documentoGeradoRepository;
    private final ModeloDocumentoRepository modeloDocumentoRepository;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;
    private final PdfGenerationService pdfGenerationService;
    
    // Regex para encontrar placeholders no formato {{variavel}}
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    
    public DocumentoGeradoService(DocumentoGeradoRepository documentoGeradoRepository,
                                 ModeloDocumentoRepository modeloDocumentoRepository,
                                 EmployeeRepository employeeRepository,
                                 ObjectMapper objectMapper,
                                 PdfGenerationService pdfGenerationService) {
        this.documentoGeradoRepository = documentoGeradoRepository;
        this.modeloDocumentoRepository = modeloDocumentoRepository;
        this.employeeRepository = employeeRepository;
        this.objectMapper = objectMapper;
        this.pdfGenerationService = pdfGenerationService;
    }
    
    /**
     * Gera um novo documento a partir de um modelo
     */
    public DocumentoGerado gerarDocumento(UUID modeloId, UUID funcionarioId, 
                                          Map<String, Object> dadosPreenchidos, 
                                          User criadoPor) {
        
        // Buscar modelo e funcionário
        ModeloDocumento modelo = modeloDocumentoRepository.findById(modeloId)
                .orElseThrow(() -> new RuntimeException("Modelo não encontrado"));
        
        Employee funcionario = employeeRepository.findById(funcionarioId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        // Preencher dados automáticos do funcionário
        Map<String, Object> dadosCompletos = preencherDadosAutomaticos(funcionario, dadosPreenchidos);
        
        // Gerar conteúdo final
        String conteudoFinal = substituirPlaceholders(modelo.getConteudoTemplate(), dadosCompletos);
        
        // Gerar PDF
        byte[] arquivoPdf = gerarPdf(modelo, dadosCompletos);
        String nomeArquivoPdf = pdfGenerationService.gerarNomeArquivo(modelo, funcionario.getName());
        
        // Converter dados para JSON
        String dadosJson = converterParaJson(dadosCompletos);
        
        // Criar documento gerado
        DocumentoGerado documento = DocumentoGerado.builder()
                .modelo(modelo)
                .funcionario(funcionario)
                .conteudoFinal(conteudoFinal)
                .dadosPreenchidos(dadosJson)
                .arquivoGerado(arquivoPdf)
                .nomeArquivoGerado(nomeArquivoPdf)
                .tamanhoArquivoGerado((long) arquivoPdf.length)
                .status(DocumentoGerado.StatusDocumento.PENDENTE)
                .criadoPor(criadoPor)
                .dataCriacao(LocalDateTime.now())
                .build();
        
        return documentoGeradoRepository.save(documento);
    }
    
    /**
     * Assina um documento
     */
    public DocumentoGerado assinarDocumento(UUID documentoId, User usuario, String ipAddress) {
        DocumentoGerado documento = buscarPorId(documentoId);
        
        if (documento.isAssinado()) {
            throw new RuntimeException("Documento já foi assinado");
        }
        
        documento.marcarComoAssinado(usuario, ipAddress);
        
        return documentoGeradoRepository.save(documento);
    }
    
    /**
     * Busca documento por ID
     */
    @Transactional(readOnly = true)
    public DocumentoGerado buscarPorId(UUID id) {
        return documentoGeradoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento não encontrado"));
    }
    
    /**
     * Lista documentos por funcionário
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarPorFuncionario(UUID funcionarioId) {
        Employee funcionario = employeeRepository.findById(funcionarioId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        return documentoGeradoRepository.findByFuncionarioOrderByDataCriacaoDesc(funcionario);
    }
    
    /**
     * Lista documentos por modelo
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarPorModelo(UUID modeloId) {
        ModeloDocumento modelo = modeloDocumentoRepository.findById(modeloId)
                .orElseThrow(() -> new RuntimeException("Modelo não encontrado"));
        
        return documentoGeradoRepository.findByModeloOrderByDataCriacaoDesc(modelo);
    }
    
    /**
     * Lista documentos por status
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarPorStatus(DocumentoGerado.StatusDocumento status) {
        return documentoGeradoRepository.findByStatusOrderByDataCriacaoDesc(status);
    }
    
    /**
     * Lista documentos com paginação
     */
    @Transactional(readOnly = true)
    public Page<DocumentoGerado> listarComPaginacao(Pageable pageable) {
        return documentoGeradoRepository.findAllByOrderByDataCriacaoDesc(pageable);
    }
    
    /**
     * Lista documentos pendentes
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarPendentes() {
        return documentoGeradoRepository.findByStatusOrderByDataCriacaoDesc(DocumentoGerado.StatusDocumento.PENDENTE);
    }
    
    /**
     * Lista documentos vencidos
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarVencidos() {
        return documentoGeradoRepository.findExpiredDocuments(LocalDateTime.now());
    }
    
    /**
     * Lista documentos que vencem em breve
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarVencendoEmBreve(int dias) {
        LocalDateTime dataInicio = LocalDateTime.now();
        LocalDateTime dataFim = LocalDateTime.now().plusDays(dias);
        
        return documentoGeradoRepository.findDocumentsExpiringSoon(dataInicio, dataFim);
    }
    
    /**
     * Atualiza status de documentos vencidos
     */
    public void atualizarStatusVencidos() {
        List<DocumentoGerado> documentosVencidos = documentoGeradoRepository.findDocumentsToUpdateStatus(LocalDateTime.now());
        
        for (DocumentoGerado documento : documentosVencidos) {
            documento.marcarComoVencido();
            documentoGeradoRepository.save(documento);
        }
    }
    
    /**
     * Cancela um documento
     */
    public DocumentoGerado cancelarDocumento(UUID documentoId) {
        DocumentoGerado documento = buscarPorId(documentoId);
        documento.cancelar();
        return documentoGeradoRepository.save(documento);
    }
    
    /**
     * Define data de vencimento para um documento
     */
    public DocumentoGerado definirVencimento(UUID documentoId, LocalDateTime dataVencimento) {
        DocumentoGerado documento = buscarPorId(documentoId);
        documento.setDataVencimento(dataVencimento);
        return documentoGeradoRepository.save(documento);
    }
    
    /**
     * Preenche dados automáticos do funcionário
     */
    private Map<String, Object> preencherDadosAutomaticos(Employee funcionario, Map<String, Object> dadosManuais) {
        Map<String, Object> dadosCompletos = new HashMap<>();
        
        // Dados automáticos do funcionário
        dadosCompletos.put("nome", funcionario.getName());
        dadosCompletos.put("cpf", funcionario.getDocument()); // CPF está no campo document
        dadosCompletos.put("rg", ""); // RG não existe na entidade atual
        dadosCompletos.put("cargo", funcionario.getPosition() != null ? funcionario.getPosition().getName() : "");
        dadosCompletos.put("departamento", funcionario.getUnit() != null ? funcionario.getUnit().getName() : "");
        dadosCompletos.put("data_admissao", funcionario.getHireDate());
        dadosCompletos.put("salario", ""); // Salário não existe na entidade atual
        dadosCompletos.put("endereco", funcionario.getAddress());
        dadosCompletos.put("telefone", funcionario.getPhone());
        dadosCompletos.put("email", funcionario.getEmail());
        
        // Dados da empresa
        dadosCompletos.put("empresa", "Secure Guard"); // TODO: Buscar da configuração
        dadosCompletos.put("cnpj", "00.000.000/0001-00"); // TODO: Buscar da configuração
        dadosCompletos.put("data_atual", LocalDateTime.now().toLocalDate());
        
        // Sobrescrever com dados manuais se fornecidos
        if (dadosManuais != null) {
            dadosCompletos.putAll(dadosManuais);
        }
        
        return dadosCompletos;
    }
    
    /**
     * Substitui placeholders no template
     */
    private String substituirPlaceholders(String template, Map<String, Object> dados) {
        if (template == null || dados == null) {
            return template;
        }
        
        String resultado = template;
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            String valor = obterValorPlaceholder(placeholder, dados);
            resultado = resultado.replace(matcher.group(0), valor);
        }
        
        return resultado;
    }
    
    /**
     * Obtém valor para um placeholder específico
     */
    private String obterValorPlaceholder(String placeholder, Map<String, Object> dados) {
        Object valor = dados.get(placeholder);
        
        if (valor == null) {
            return "[" + placeholder + "]"; // Placeholder não encontrado
        }
        
        if (valor instanceof LocalDateTime) {
            return ((LocalDateTime) valor).toLocalDate().toString();
        }
        
        return valor.toString();
    }
    
    /**
     * Converte dados para JSON
     */
    private String converterParaJson(Map<String, Object> dados) {
        try {
            return objectMapper.writeValueAsString(dados);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erro ao converter dados para JSON", e);
        }
    }
    
    /**
     * Converte JSON para dados
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> converterDeJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erro ao converter JSON para dados", e);
        }
    }
    
    /**
     * Estatísticas de documentos
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obterEstatisticas() {
        Map<String, Object> stats = new HashMap<>();
        
        // Contar por status
        List<Object[]> statusCounts = documentoGeradoRepository.countByStatus();
        Map<String, Long> statusStats = new HashMap<>();
        for (Object[] row : statusCounts) {
            statusStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("porStatus", statusStats);
        
        // Contar por modelo
        List<Object[]> modeloCounts = documentoGeradoRepository.countByModelo();
        Map<String, Long> modeloStats = new HashMap<>();
        for (Object[] row : modeloCounts) {
            modeloStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("porModelo", modeloStats);
        
        // Documentos vencidos
        List<DocumentoGerado> vencidos = listarVencidos();
        stats.put("vencidos", vencidos.size());
        
        // Documentos pendentes
        List<DocumentoGerado> pendentes = listarPendentes();
        stats.put("pendentes", pendentes.size());
        
        return stats;
    }
    
    /**
     * Gera PDF a partir de um modelo
     */
    private byte[] gerarPdf(ModeloDocumento modelo, Map<String, Object> dadosPreenchidos) {
        try {
            switch (modelo.getTipoArquivo()) {
                case DOCX:
                    return pdfGenerationService.gerarPdfDeDocx(modelo, dadosPreenchidos);
                case PDF:
                    return pdfGenerationService.gerarPdfDePdf(modelo, dadosPreenchidos);
                default:
                    throw new IllegalArgumentException("Tipo de arquivo não suportado: " + modelo.getTipoArquivo());
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }
}
