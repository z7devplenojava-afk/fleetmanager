package com.z7design.fleet_manager.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.*;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import java.io.ByteArrayOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OcrService {
    private static final Logger logger = LoggerFactory.getLogger(OcrService.class);
    private final Tesseract tesseract;
    private final ExecutorService executorService;
    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}");
    private static final Pattern NOME_PATTERN = Pattern.compile("Nome:\\s*([^\\n]+)");

    public OcrService() {
        this.tesseract = new Tesseract();
        this.tesseract.setDatapath("tessdata");
        this.tesseract.setLanguage("por");
        this.tesseract.setPageSegMode(1); // Modo de segmentaÃ§Ã£o automÃ¡tica
        this.tesseract.setOcrEngineMode(1); // Usar LSTM OCR Engine
        
        this.executorService = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors()
        );
    }

    public String extractTextFromPdfPage(PDDocument document, int pageIndex) {
        try {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            BufferedImage image = pdfRenderer.renderImageWithDPI(pageIndex, 300);
            
            // Converter imagem para texto usando OCR
            String text = tesseract.doOCR(image);
            logger.debug("Texto extraÃ­do da pÃ¡gina {}: {}", pageIndex + 1, text);
            
            return text;
        } catch (IOException | TesseractException e) {
            logger.error("Erro ao extrair texto da pÃ¡gina {} usando OCR", pageIndex + 1, e);
            return "";
        }
    }

    public Map<String, List<byte[]>> processScannedPdfs(List<MultipartFile> files) {
        Map<String, List<byte[]>> processedFiles = new HashMap<>();
        
        for (MultipartFile file : files) {
            try {
                logger.info("Processando arquivo escaneado: {}", file.getOriginalFilename());
                PDDocument document = PDDocument.load(file.getInputStream());
                
                // Processar cada pÃ¡gina do PDF
                for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
                    // Extrair texto usando OCR
                    String pageText = extractTextFromPdfPage(document, pageIndex);
                    
                    // Extrair informaÃ§Ãµes
                    String cpf = extractCPF(pageText);
                    String codigo = extractCodigo(pageText);
                    String nome = extractNome(pageText);
                    String mesReferencia = extractMesReferencia(pageText);
                    
                    logger.info("PÃ¡gina {} - CPF: {}, CÃ³digo: {}, Nome: {}, MÃªs: {}", 
                        pageIndex + 1, cpf, codigo, nome, mesReferencia);
                    
                    // Criar novo PDF com a pÃ¡gina
                    PDDocument newDoc = new PDDocument();
                    newDoc.addPage(document.getPage(pageIndex));
                    
                    // Salvar pÃ¡gina em um array de bytes
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    newDoc.save(baos);
                    newDoc.close();
                    
                    // Usar CPF como identificador se disponÃ­vel, senÃ£o usar cÃ³digo
                    String identificador = cpf != null ? cpf : codigo;
                    if (identificador == null) {
                        logger.warn("NÃ£o foi possÃ­vel identificar CPF ou cÃ³digo na pÃ¡gina {}", pageIndex + 1);
                        continue;
                    }
                    
                    // Adicionar pÃ¡gina ao mapa de arquivos processados
                    processedFiles.computeIfAbsent(identificador, k -> new ArrayList<>())
                                .add(baos.toByteArray());
                }
                
                document.close();
                
            } catch (IOException e) {
                logger.error("Erro ao processar arquivo: {}", file.getOriginalFilename(), e);
            }
        }
        
        return processedFiles;
    }

    private String extractCPF(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Pattern pattern = Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private String extractCodigo(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Pattern pattern = Pattern.compile("(?i)CÃ³digo:\\s*(\\d+)");
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private String extractNome(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Pattern pattern = Pattern.compile("(?i)Nome:\\s*([^\\n]+)");
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private String extractMesReferencia(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Pattern pattern = Pattern.compile("(?i)MÃªs de ReferÃªncia:\\s*([^\\n]+)");
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private BufferedImage preProcessImage(BufferedImage original) {
        // 1. Converter para escala de cinza
        BufferedImage grayImage = new BufferedImage(
            original.getWidth(), 
            original.getHeight(), 
            BufferedImage.TYPE_BYTE_GRAY
        );
        Graphics2D g2d = grayImage.createGraphics();
        g2d.drawImage(original, 0, 0, null);
        g2d.dispose();

        // 2. Aumentar contraste
        BufferedImage contrastImage = increaseContrast(grayImage);

        // 3. Reduzir ruÃ­do
        BufferedImage denoisedImage = removeNoise(contrastImage);

        // 4. Melhorar nitidez
        BufferedImage sharpenedImage = sharpen(denoisedImage);

        // 5. BinarizaÃ§Ã£o adaptativa
        return adaptiveThreshold(sharpenedImage);
    }

    private BufferedImage increaseContrast(BufferedImage image) {
        BufferedImage result = new BufferedImage(
            image.getWidth(), 
            image.getHeight(), 
            image.getType()
        );

        for (int x = 0; x < image.getWidth(); x++) {
            for (int y = 0; y < image.getHeight(); y++) {
                int rgb = image.getRGB(x, y);
                int gray = rgb & 0xFF;
                
                // Aumentar contraste
                if (gray < 128) {
                    gray = Math.max(0, gray - 30);
                } else {
                    gray = Math.min(255, gray + 30);
                }
                
                result.setRGB(x, y, (gray << 16) | (gray << 8) | gray);
            }
        }
        return result;
    }

    private BufferedImage removeNoise(BufferedImage image) {
        BufferedImage result = new BufferedImage(
            image.getWidth(), 
            image.getHeight(), 
            image.getType()
        );

        // Aplicar filtro de mediana 3x3
        for (int x = 1; x < image.getWidth() - 1; x++) {
            for (int y = 1; y < image.getHeight() - 1; y++) {
                int[] values = new int[9];
                int index = 0;
                
                for (int i = -1; i <= 1; i++) {
                    for (int j = -1; j <= 1; j++) {
                        values[index++] = image.getRGB(x + i, y + j) & 0xFF;
                    }
                }
                
                // Ordenar e pegar o valor do meio
                java.util.Arrays.sort(values);
                int median = values[4];
                
                result.setRGB(x, y, (median << 16) | (median << 8) | median);
            }
        }
        return result;
    }

    private BufferedImage sharpen(BufferedImage image) {
        float[] sharpenMatrix = {
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        };
        
        BufferedImageOp op = new ConvolveOp(
            new Kernel(3, 3, sharpenMatrix),
            ConvolveOp.EDGE_NO_OP,
            null
        );
        
        return op.filter(image, null);
    }

    private BufferedImage adaptiveThreshold(BufferedImage image) {
        BufferedImage result = new BufferedImage(
            image.getWidth(), 
            image.getHeight(), 
            image.getType()
        );

        int windowSize = 15;
        int halfWindow = windowSize / 2;

        for (int x = 0; x < image.getWidth(); x++) {
            for (int y = 0; y < image.getHeight(); y++) {
                int sum = 0;
                int count = 0;

                // Calcular mÃ©dia local
                for (int i = -halfWindow; i <= halfWindow; i++) {
                    for (int j = -halfWindow; j <= halfWindow; j++) {
                        int nx = x + i;
                        int ny = y + j;
                        
                        if (nx >= 0 && nx < image.getWidth() && 
                            ny >= 0 && ny < image.getHeight()) {
                            sum += image.getRGB(nx, ny) & 0xFF;
                            count++;
                        }
                    }
                }

                int threshold = sum / count;
                int pixel = image.getRGB(x, y) & 0xFF;
                
                // Binarizar
                int newPixel = (pixel > threshold) ? 255 : 0;
                result.setRGB(x, y, (newPixel << 16) | (newPixel << 8) | newPixel);
            }
        }
        return result;
    }

    public void shutdown() {
        executorService.shutdown();
    }
} 
