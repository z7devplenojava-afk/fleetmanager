package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.DocumentoGeradoRepository;
import com.z7design.fleet_manager.repository.ModeloDocumentoRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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
        
        // Buscar modelo e funcionÃ¡rio
        ModeloDocumento modelo = modeloDocumentoRepository.findById(modeloId)
                .orElseThrow(() -> new RuntimeException("Modelo nÃ£o encontrado"));
        
        Employee funcionario = employeeRepository.findById(funcionarioId)
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Preencher dados automÃ¡ticos do funcionÃ¡rio
        Map<String, Object> dadosCompletos = preencherDadosAutomaticos(funcionario, dadosPreenchidos);
        
        // Gerar conteÃºdo final
        String conteudoTemplate = modelo.getConteudoTemplate();
        log.info("ðŸ“ Template do modelo: {} (tamanho: {} chars)", 
            modelo.getNomeModelo(), 
            conteudoTemplate != null ? conteudoTemplate.length() : 0);
        
        String conteudoFinal = substituirPlaceholders(conteudoTemplate, dadosCompletos);
        
        // Se nÃ£o houver conteÃºdo template, criar um conteÃºdo bÃ¡sico com os dados do funcionÃ¡rio
        if (conteudoFinal == null || conteudoFinal.trim().isEmpty()) {
            log.warn("âš ï¸ Template vazio ou nulo para modelo {}. Gerando conteÃºdo bÃ¡sico.", modelo.getNomeModelo());
            conteudoFinal = gerarConteudoBasico(funcionario, dadosCompletos);
        }
        
        log.info("ðŸ“„ ConteÃºdo final gerado: {} caracteres", conteudoFinal.length());
        
        // Gerar PDF usando o conteÃºdo final
        byte[] arquivoPdf = gerarPdf(modelo, dadosCompletos, conteudoFinal);
        
        // Validar que o PDF foi gerado corretamente
        if (arquivoPdf == null || arquivoPdf.length == 0) {
            log.error("âŒ Erro ao gerar PDF: arquivo vazio ou nulo para modelo {} e funcionÃ¡rio {}", modeloId, funcionarioId);
            throw new RuntimeException("Erro ao gerar PDF: arquivo vazio ou nulo");
        }
        
        log.info("âœ… PDF gerado com sucesso: {} bytes para modelo {} e funcionÃ¡rio {}", arquivoPdf.length, modeloId, funcionarioId);
        
        String nomeArquivoPdf = pdfGenerationService.gerarNomeArquivo(modelo, funcionario.getName());
        
        // Converter dados para JSON
        String dadosJson = converterParaJson(dadosCompletos);
        
        // Criar documento gerado usando new em vez de builder para evitar problemas de ordem
        DocumentoGerado documento = new DocumentoGerado();
        documento.setModelo(modelo);
        documento.setFuncionario(funcionario);
        documento.setConteudoFinal(conteudoFinal);
        documento.setDadosPreenchidos(dadosJson);
        documento.setArquivoGerado(arquivoPdf); // byte[] - deve ser BYTEA
        documento.setNomeArquivoGerado(nomeArquivoPdf);
        documento.setTamanhoArquivoGerado((long) arquivoPdf.length); // Long - deve ser BIGINT
        documento.setStatus(DocumentoGerado.StatusDocumento.PENDENTE);
        documento.setCriadoPor(criadoPor);
        documento.setDataCriacao(LocalDateTime.now());
        
        return documentoGeradoRepository.save(documento);
    }
    
    /**
     * Assina um documento
     */
    public DocumentoGerado assinarDocumento(UUID documentoId, User usuario, String ipAddress) {
        DocumentoGerado documento = buscarPorId(documentoId);
        
        if (documento.isAssinado()) {
            throw new RuntimeException("Documento jÃ¡ foi assinado");
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
                .orElseThrow(() -> new RuntimeException("Documento nÃ£o encontrado"));
    }
    
    /**
     * Lista documentos por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarPorFuncionario(UUID funcionarioId) {
        Employee funcionario = employeeRepository.findById(funcionarioId)
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));
        
        return documentoGeradoRepository.findByFuncionarioOrderByDataCriacaoDesc(funcionario);
    }
    
    /**
     * Lista documentos por modelo
     */
    @Transactional(readOnly = true)
    public List<DocumentoGerado> listarPorModelo(UUID modeloId) {
        ModeloDocumento modelo = modeloDocumentoRepository.findById(modeloId)
                .orElseThrow(() -> new RuntimeException("Modelo nÃ£o encontrado"));
        
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
     * Lista documentos com paginaÃ§Ã£o
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
     * Preenche dados automÃ¡ticos do funcionÃ¡rio
     */
    private Map<String, Object> preencherDadosAutomaticos(Employee funcionario, Map<String, Object> dadosManuais) {
        Map<String, Object> dadosCompletos = new HashMap<>();
        
        // Dados automÃ¡ticos do funcionÃ¡rio
        dadosCompletos.put("nome", funcionario.getName());
        dadosCompletos.put("cpf", funcionario.getDocument()); // CPF estÃ¡ no campo document
        dadosCompletos.put("rg", ""); // RG nÃ£o existe na entidade atual
        dadosCompletos.put("cargo", funcionario.getPosition() != null ? funcionario.getPosition().getName() : "");
        dadosCompletos.put("departamento", funcionario.getUnit() != null ? funcionario.getUnit().getName() : "");
        dadosCompletos.put("data_admissao", funcionario.getHireDate());
        dadosCompletos.put("salario", ""); // SalÃ¡rio nÃ£o existe na entidade atual
        dadosCompletos.put("endereco", funcionario.getAddress());
        dadosCompletos.put("telefone", funcionario.getPhone());
        dadosCompletos.put("email", funcionario.getEmail());
        
        // Dados da empresa
        dadosCompletos.put("empresa", "Secure Guard"); // TODO: Buscar da configuraÃ§Ã£o
        dadosCompletos.put("cnpj", "00.000.000/0001-00"); // TODO: Buscar da configuraÃ§Ã£o
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
     * ObtÃ©m valor para um placeholder especÃ­fico
     */
    private String obterValorPlaceholder(String placeholder, Map<String, Object> dados) {
        Object valor = dados.get(placeholder);
        
        if (valor == null) {
            return "[" + placeholder + "]"; // Placeholder nÃ£o encontrado
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
     * EstatÃ­sticas de documentos
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
    private byte[] gerarPdf(ModeloDocumento modelo, Map<String, Object> dadosPreenchidos, String conteudoFinal) {
        try {
            // Usar o conteÃºdo final diretamente para gerar o PDF
            return pdfGenerationService.gerarPdf(conteudoFinal, modelo.getNomeModelo());
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera conteÃºdo bÃ¡sico quando nÃ£o hÃ¡ template
     */
    private String gerarConteudoBasico(Employee funcionario, Map<String, Object> dadosCompletos) {
        StringBuilder conteudo = new StringBuilder();
        
        String nomeModelo = funcionario.getName() != null ? funcionario.getName() : "FuncionÃ¡rio";
        conteudo.append("DECLARAÃ‡ÃƒO\n\n");
        conteudo.append("Declaro para os devidos fins que:\n\n");
        
        // InformaÃ§Ãµes do funcionÃ¡rio
        if (dadosCompletos.get("nome") != null) {
            conteudo.append("Nome: ").append(dadosCompletos.get("nome")).append("\n");
        }
        if (dadosCompletos.get("cpf") != null && !dadosCompletos.get("cpf").toString().isEmpty()) {
            conteudo.append("CPF: ").append(dadosCompletos.get("cpf")).append("\n");
        }
        if (dadosCompletos.get("rg") != null && !dadosCompletos.get("rg").toString().isEmpty()) {
            conteudo.append("RG: ").append(dadosCompletos.get("rg")).append("\n");
        }
        if (dadosCompletos.get("cargo") != null && !dadosCompletos.get("cargo").toString().isEmpty()) {
            conteudo.append("Cargo: ").append(dadosCompletos.get("cargo")).append("\n");
        }
        if (dadosCompletos.get("departamento") != null && !dadosCompletos.get("departamento").toString().isEmpty()) {
            conteudo.append("Departamento: ").append(dadosCompletos.get("departamento")).append("\n");
        }
        if (dadosCompletos.get("data_admissao") != null) {
            conteudo.append("Data de AdmissÃ£o: ").append(dadosCompletos.get("data_admissao")).append("\n");
        }
        if (dadosCompletos.get("endereco") != null && !dadosCompletos.get("endereco").toString().isEmpty()) {
            conteudo.append("EndereÃ§o: ").append(dadosCompletos.get("endereco")).append("\n");
        }
        if (dadosCompletos.get("telefone") != null && !dadosCompletos.get("telefone").toString().isEmpty()) {
            conteudo.append("Telefone: ").append(dadosCompletos.get("telefone")).append("\n");
        }
        if (dadosCompletos.get("email") != null && !dadosCompletos.get("email").toString().isEmpty()) {
            conteudo.append("E-mail: ").append(dadosCompletos.get("email")).append("\n");
        }
        
        conteudo.append("\n");
        conteudo.append("Data: ").append(LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n");
        conteudo.append("\n");
        conteudo.append("_________________________________________\n");
        conteudo.append(nomeModelo).append("\n");
        conteudo.append("CPF: ").append(dadosCompletos.get("cpf") != null ? dadosCompletos.get("cpf") : "").append("\n");
        
        return conteudo.toString();
    }
}

