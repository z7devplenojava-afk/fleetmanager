package br.com.fleetmanager.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import br.com.fleetmanager.model.ModeloDocumento;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfGenerationService {
    
    // Regex para encontrar placeholders no formato {{variavel}}
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    
    /**
     * Gera PDF a partir de um modelo DOCX
     */
    public byte[] gerarPdfDeDocx(ModeloDocumento modelo, Map<String, Object> dadosPreenchidos) throws IOException {
        if (modelo.getTipoArquivo() != ModeloDocumento.TipoArquivo.DOCX) {
            throw new IllegalArgumentException("Modelo deve ser do tipo DOCX");
        }
        
        String conteudoFinal = substituirPlaceholders(modelo.getConteudoTemplate(), dadosPreenchidos);
        return gerarPdf(conteudoFinal, modelo.getNomeModelo());
    }
    
    /**
     * Gera PDF a partir de um modelo PDF
     */
    public byte[] gerarPdfDePdf(ModeloDocumento modelo, Map<String, Object> dadosPreenchidos) throws IOException {
        if (modelo.getTipoArquivo() != ModeloDocumento.TipoArquivo.PDF) {
            throw new IllegalArgumentException("Modelo deve ser do tipo PDF");
        }
        
        if (!modelo.getExtraivel()) {
            throw new IllegalArgumentException("PDF não é extraível (escaneado/imagem)");
        }
        
        String conteudoFinal = substituirPlaceholders(modelo.getConteudoTemplate(), dadosPreenchidos);
        return gerarPdf(conteudoFinal, modelo.getNomeModelo());
    }
    
    /**
     * Gera PDF a partir de texto
     */
    public byte[] gerarPdf(String conteudo, String titulo) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try (PdfWriter writer = new PdfWriter(baos);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {
            
            // Configurar documento
            document.setMargins(50, 50, 50, 50);
            
            // Adicionar título
            if (titulo != null && !titulo.trim().isEmpty()) {
                Paragraph tituloPara = new Paragraph(titulo)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(20);
                document.add(tituloPara);
            }
            
            // Adicionar data de geração
            String dataGeracao = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            Paragraph dataPara = new Paragraph("Gerado em: " + dataGeracao)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontSize(10)
                .setMarginBottom(20);
            document.add(dataPara);
            
            // Processar conteúdo linha por linha
            String[] linhas = conteudo.split("\n");
            for (String linha : linhas) {
                if (linha.trim().isEmpty()) {
                    document.add(new Paragraph(" ")); // Linha em branco
                } else {
                    Paragraph para = new Paragraph(linha.trim())
                        .setFontSize(12)
                        .setMarginBottom(5);
                    document.add(para);
                }
            }
            
            // Adicionar rodapé
            Paragraph rodape = new Paragraph("Documento gerado automaticamente pelo sistema Secure Guard")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(8)
                .setMarginTop(30);
            document.add(rodape);
        }
        
        return baos.toByteArray();
    }
    
    /**
     * Gera PDF com formatação avançada
     */
    public byte[] gerarPdfFormatado(String conteudo, String titulo, Map<String, Object> dadosPreenchidos) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try (PdfWriter writer = new PdfWriter(baos);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {
            
            // Configurar documento
            document.setMargins(50, 50, 50, 50);
            
            // Adicionar cabeçalho
            adicionarCabecalho(document, titulo);
            
            // Adicionar informações do funcionário
            adicionarInformacoesFuncionario(document, dadosPreenchidos);
            
            // Adicionar conteúdo principal
            adicionarConteudoPrincipal(document, conteudo);
            
            // Adicionar rodapé
            adicionarRodape(document);
        }
        
        return baos.toByteArray();
    }
    
    /**
     * Adiciona cabeçalho ao documento
     */
    private void adicionarCabecalho(Document document, String titulo) {
        if (titulo != null && !titulo.trim().isEmpty()) {
            Paragraph tituloPara = new Paragraph(titulo)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(18)
                .setBold()
                .setMarginBottom(10);
            document.add(tituloPara);
        }
        
        // Linha separadora
        Paragraph linha = new Paragraph("_".repeat(80))
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(20);
        document.add(linha);
    }
    
    /**
     * Adiciona informações do funcionário
     */
    private void adicionarInformacoesFuncionario(Document document, Map<String, Object> dadosPreenchidos) {
        if (dadosPreenchidos == null || dadosPreenchidos.isEmpty()) {
            return;
        }
        
        Paragraph infoPara = new Paragraph("INFORMAÇÕES DO FUNCIONÁRIO")
            .setBold()
            .setFontSize(14)
            .setMarginBottom(10);
        document.add(infoPara);
        
        // Adicionar informações principais
        String[] campos = {"nome", "cpf", "cargo", "departamento", "data_admissao"};
        String[] labels = {"Nome:", "CPF:", "Cargo:", "Departamento:", "Data de Admissão:"};
        
        for (int i = 0; i < campos.length; i++) {
            Object valor = dadosPreenchidos.get(campos[i]);
            if (valor != null) {
                Paragraph campoPara = new Paragraph()
                    .add(new Text(labels[i]).setBold())
                    .add(" " + valor.toString())
                    .setMarginBottom(3);
                document.add(campoPara);
            }
        }
        
        // Espaçamento
        document.add(new Paragraph(" "));
    }
    
    /**
     * Adiciona conteúdo principal
     */
    private void adicionarConteudoPrincipal(Document document, String conteudo) {
        Paragraph conteudoPara = new Paragraph("CONTEÚDO DO DOCUMENTO")
            .setBold()
            .setFontSize(14)
            .setMarginBottom(10);
        document.add(conteudoPara);
        
        // Processar conteúdo linha por linha
        String[] linhas = conteudo.split("\n");
        for (String linha : linhas) {
            if (linha.trim().isEmpty()) {
                document.add(new Paragraph(" "));
            } else {
                Paragraph para = new Paragraph(linha.trim())
                    .setFontSize(12)
                    .setMarginBottom(5);
                document.add(para);
            }
        }
    }
    
    /**
     * Adiciona rodapé ao documento
     */
    private void adicionarRodape(Document document) {
        // Espaçamento
        document.add(new Paragraph(" "));
        
        // Linha separadora
        Paragraph linha = new Paragraph("_".repeat(80))
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(10);
        document.add(linha);
        
        // Informações do rodapé
        String dataGeracao = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        Paragraph rodape = new Paragraph()
            .add(new Text("Documento gerado automaticamente pelo sistema Secure Guard").setFontSize(8))
            .add(new Text(" - ").setFontSize(8))
            .add(new Text("Gerado em: " + dataGeracao).setFontSize(8))
            .setTextAlignment(TextAlignment.CENTER);
        document.add(rodape);
    }
    
    /**
     * Substitui placeholders em um texto
     */
    private String substituirPlaceholders(String texto, Map<String, Object> dados) {
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
    private String obterValorPlaceholder(String placeholder, Map<String, Object> dados) {
        Object valor = dados.get(placeholder);
        
        if (valor == null) {
            return "[" + placeholder + "]"; // Placeholder não encontrado
        }
        
        if (valor instanceof LocalDateTime) {
            return ((LocalDateTime) valor).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
        
        return valor.toString();
    }
    
    /**
     * Gera nome do arquivo PDF
     */
    public String gerarNomeArquivo(ModeloDocumento modelo, String nomeFuncionario) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String nomeLimpo = nomeFuncionario.replaceAll("[^a-zA-Z0-9]", "_");
        return String.format("%s_%s_%s.pdf", modelo.getNomeModelo().replaceAll("[^a-zA-Z0-9]", "_"), nomeLimpo, timestamp);
    }
}
