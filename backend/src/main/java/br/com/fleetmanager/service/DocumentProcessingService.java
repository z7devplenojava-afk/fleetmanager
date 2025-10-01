package br.com.fleetmanager.service;

import br.com.fleetmanager.model.ModeloDocumento;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DocumentProcessingService {
    
    // Regex para encontrar placeholders no formato {{variavel}}
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    
    /**
     * Extrai texto de um arquivo DOCX
     */
    public String extrairTextoDocx(byte[] arquivoBytes) throws IOException {
        StringBuilder texto = new StringBuilder();
        
        try (ByteArrayInputStream bis = new ByteArrayInputStream(arquivoBytes);
             XWPFDocument document = new XWPFDocument(bis)) {
            
            // Extrair texto dos parágrafos
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String paragrafoTexto = paragraph.getText();
                if (paragrafoTexto != null && !paragrafoTexto.trim().isEmpty()) {
                    texto.append(paragrafoTexto).append("\n");
                }
            }
            
            // Extrair texto das tabelas
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        String cellTexto = cell.getText();
                        if (cellTexto != null && !cellTexto.trim().isEmpty()) {
                            texto.append(cellTexto).append(" ");
                        }
                    }
                    texto.append("\n");
                }
            }
        }
        
        return texto.toString();
    }
    
    /**
     * Extrai texto de um arquivo PDF
     */
    public String extrairTextoPdf(byte[] arquivoBytes) throws IOException {
        StringBuilder texto = new StringBuilder();
        
        try (ByteArrayInputStream bis = new ByteArrayInputStream(arquivoBytes);
             PDDocument document = PDDocument.load(bis)) {
            
            PDFTextStripper stripper = new PDFTextStripper();
            texto.append(stripper.getText(document));
        }
        
        return texto.toString();
    }
    
    /**
     * Extrai placeholders de um texto
     */
    public List<String> extrairPlaceholders(String texto) {
        List<String> placeholders = new ArrayList<>();
        
        if (texto == null || texto.trim().isEmpty()) {
            return placeholders;
        }
        
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(texto);
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            if (!placeholders.contains(placeholder)) {
                placeholders.add(placeholder);
            }
        }
        
        return placeholders;
    }
    
    /**
     * Substitui placeholders em um texto
     */
    public String substituirPlaceholders(String texto, java.util.Map<String, Object> dados) {
        if (texto == null || dados == null) {
            return texto;
        }
        
        String resultado = texto;
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(texto);
        
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
    private String obterValorPlaceholder(String placeholder, java.util.Map<String, Object> dados) {
        Object valor = dados.get(placeholder);
        
        if (valor == null) {
            return "[" + placeholder + "]"; // Placeholder não encontrado
        }
        
        if (valor instanceof java.time.LocalDateTime) {
            return ((java.time.LocalDateTime) valor).toLocalDate().toString();
        }
        
        return valor.toString();
    }
    
    /**
     * Determina se um PDF é extraível (texto) ou escaneado (imagem)
     */
    public boolean isPdfExtraivel(byte[] arquivoBytes) {
        try {
            String texto = extrairTextoPdf(arquivoBytes);
            // Se o texto tem menos de 50 caracteres, provavelmente é uma imagem escaneada
            return texto != null && texto.trim().length() > 50;
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * Valida se um arquivo é um DOCX válido
     */
    public boolean isValidDocx(byte[] arquivoBytes) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(arquivoBytes);
             XWPFDocument document = new XWPFDocument(bis)) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * Valida se um arquivo é um PDF válido
     */
    public boolean isValidPdf(byte[] arquivoBytes) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(arquivoBytes);
             PDDocument document = PDDocument.load(bis)) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * Processa um arquivo e extrai informações
     */
    public ProcessamentoResultado processarArquivo(byte[] arquivoBytes, String nomeArquivo) throws IOException {
        String extensao = obterExtensao(nomeArquivo).toLowerCase();
        
        ProcessamentoResultado resultado = new ProcessamentoResultado();
        resultado.setNomeArquivo(nomeArquivo);
        resultado.setTamanhoArquivo((long) arquivoBytes.length);
        
        switch (extensao) {
            case "docx":
                if (!isValidDocx(arquivoBytes)) {
                    throw new IllegalArgumentException("Arquivo DOCX inválido");
                }
                resultado.setTipoArquivo(ModeloDocumento.TipoArquivo.DOCX);
                resultado.setConteudoExtraido(extrairTextoDocx(arquivoBytes));
                resultado.setExtraivel(true);
                break;
                
            case "pdf":
                if (!isValidPdf(arquivoBytes)) {
                    throw new IllegalArgumentException("Arquivo PDF inválido");
                }
                resultado.setTipoArquivo(ModeloDocumento.TipoArquivo.PDF);
                resultado.setConteudoExtraido(extrairTextoPdf(arquivoBytes));
                resultado.setExtraivel(isPdfExtraivel(arquivoBytes));
                break;
                
            default:
                throw new IllegalArgumentException("Tipo de arquivo não suportado: " + extensao);
        }
        
        // Extrair placeholders se o conteúdo for extraível
        if (resultado.isExtraivel() && resultado.getConteudoExtraido() != null) {
            resultado.setPlaceholders(extrairPlaceholders(resultado.getConteudoExtraido()));
        }
        
        return resultado;
    }
    
    /**
     * Obtém extensão de um arquivo
     */
    private String obterExtensao(String nomeArquivo) {
        if (nomeArquivo == null || !nomeArquivo.contains(".")) {
            return "";
        }
        return nomeArquivo.substring(nomeArquivo.lastIndexOf(".") + 1);
    }
    
    /**
     * Classe para resultado do processamento
     */
    public static class ProcessamentoResultado {
        private String nomeArquivo;
        private Long tamanhoArquivo;
        private ModeloDocumento.TipoArquivo tipoArquivo;
        private String conteudoExtraido;
        private List<String> placeholders;
        private boolean extraivel;
        
        // Getters e Setters
        public String getNomeArquivo() { return nomeArquivo; }
        public void setNomeArquivo(String nomeArquivo) { this.nomeArquivo = nomeArquivo; }
        
        public Long getTamanhoArquivo() { return tamanhoArquivo; }
        public void setTamanhoArquivo(Long tamanhoArquivo) { this.tamanhoArquivo = tamanhoArquivo; }
        
        public ModeloDocumento.TipoArquivo getTipoArquivo() { return tipoArquivo; }
        public void setTipoArquivo(ModeloDocumento.TipoArquivo tipoArquivo) { this.tipoArquivo = tipoArquivo; }
        
        public String getConteudoExtraido() { return conteudoExtraido; }
        public void setConteudoExtraido(String conteudoExtraido) { this.conteudoExtraido = conteudoExtraido; }
        
        public List<String> getPlaceholders() { return placeholders; }
        public void setPlaceholders(List<String> placeholders) { this.placeholders = placeholders; }
        
        public boolean isExtraivel() { return extraivel; }
        public void setExtraivel(boolean extraivel) { this.extraivel = extraivel; }
    }
}
