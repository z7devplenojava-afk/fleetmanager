package br.com.fleetmanager.service;

import br.com.fleetmanager.model.ExtractedHoleriteData;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class PdfService {
    private static final Logger logger = LoggerFactory.getLogger(PdfService.class);
    private static final int BATCH_SIZE = 10; // Processar 10 páginas por vez
    private static final Pattern CPF_PATTERN = Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");
    private static final Pattern NOME_PATTERN = Pattern.compile("(?i)Nome:\\s*([^\\n]+)");
    private static final Pattern CODIGO_PATTERN = Pattern.compile("(?i)Código:\\s*(\\d+)");
    private static final Pattern CARGO_PATTERN = Pattern.compile("(?i)CARGO[\\s:]+([^\\n]+)");
    private static final Pattern PERIODO_PATTERN = Pattern.compile("(\\d{2}/\\d{2}/\\d{4})\\s*a\\s*(\\d{2}/\\d{2}/\\d{4})");
    private static final Pattern MES_REFERENCIA_PATTERN = Pattern.compile("(?i)Mês de Referência:\\s*([^\\n]+)");
    private static final int MAX_POOL_SIZE = 10;
    private final AtomicInteger activeThreads = new AtomicInteger(0);

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private TesseractService tesseractService;

    @Autowired
    private ExtractedHoleriteDataService extractedHoleriteDataService;

    @Autowired
    private OcrService ocrService;

    private final ExecutorService executorService;
    private final BlockingQueue<PDDocument> documentPool;

    @Autowired
    public PdfService(FileStorageService fileStorageService) {
        int processors = Runtime.getRuntime().availableProcessors();
        this.executorService = Executors.newFixedThreadPool(processors);
        this.fileStorageService = fileStorageService;
        
        this.documentPool = new LinkedBlockingQueue<>(MAX_POOL_SIZE);
        initializeDocumentPool();
    }

    private void initializeDocumentPool() {
        for (int i = 0; i < MAX_POOL_SIZE; i++) {
            try {
                documentPool.offer(new PDDocument());
            } catch (Exception e) {
                logger.error("Erro ao inicializar pool de documentos", e);
            }
        }
    }

    public Map<String, List<byte[]>> processPdfFiles(List<MultipartFile> files) {
        Map<String, List<byte[]>> processedFiles = new HashMap<>();
        
        for (MultipartFile file : files) {
            try {
                logger.info("Processando arquivo: {}", file.getOriginalFilename());
                PDDocument document = PDDocument.load(file.getInputStream());
                
                // Processar cada página do PDF
                for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    stripper.setStartPage(pageIndex + 1);
                    stripper.setEndPage(pageIndex + 1);
                    String pageText = stripper.getText(document);
                    if (pageText.trim().isEmpty()) {
                        logger.info("Página {} não contém texto extraível, tentando OCR", pageIndex + 1);
                        pageText = ocrService.extractTextFromPdfPage(document, pageIndex);
                    }

                    // Log do texto extraído para diagnóstico
                    logger.info("Texto extraído da página {}:\n{}", pageIndex + 1, pageText);

                    // Extrair código e nome com regex mais tolerante
                    String codigo = null;
                    String nome = null;
                    Matcher codNomeMatcher = CODIGO_NOME_PATTERN.matcher(pageText);
                    if (codNomeMatcher.find()) {
                        codigo = codNomeMatcher.group(1);
                        nome = codNomeMatcher.group(2).trim();
                    }

                    // Extrair mês/ano final do período
                    String mesAno = null;
                    Matcher periodoMatcher = PERIODO_PATTERN.matcher(pageText);
                    if (periodoMatcher.find()) {
                        String dataFinal = periodoMatcher.group(2); // ex: 28/02/2025
                        String[] partes = dataFinal.split("/");
                        if (partes.length == 3) {
                            mesAno = partes[1] + "-" + partes[2]; // ex: 02-2025
                        }
                    }

                    logger.info("Página {} - Código: {}, Nome: {}, Mês/Ano: {}", pageIndex + 1, codigo, nome, mesAno);

                    PDDocument newDoc = new PDDocument();
                    newDoc.addPage(document.getPage(pageIndex));
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    newDoc.save(baos);
                    newDoc.close();

                    String identificador = codigo != null ? codigo : null;
                    if (identificador == null) {
                        logger.warn("Não foi possível identificar código na página {}", pageIndex + 1);
                        continue;
                    }

                    processedFiles.computeIfAbsent(identificador + "|" + (nome != null ? nome : "sem_nome") + "|" + (mesAno != null ? mesAno : "sem_mes"), k -> new ArrayList<>())
                                .add(baos.toByteArray());
                }
                
                document.close();
                
            } catch (IOException e) {
                logger.error("Erro ao processar arquivo: {}", file.getOriginalFilename(), e);
            }
        }
        
        return processedFiles;
    }

    public String extractCPF(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Matcher matcher = CPF_PATTERN.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    public String extractNome(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Matcher matcher = NOME_PATTERN.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    public String extractMesReferencia(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Matcher matcher = MES_REFERENCIA_PATTERN.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    public String extractCodigo(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        Matcher matcher = CODIGO_PATTERN.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    public void shutdown() {
        executorService.shutdown();
    }

    public Map<String, Object> processarHolerite(MultipartFile file) {
        Path tempFile = null;
        PDDocument document = null;
        String mesReferencia = "";
        Integer anoReferencia = null;
        Set<String> arquivosGerados = new HashSet<>(); // Adicionado para o comportamento original
        Map<String, List<PDDocument>> holeritesPorFuncionario = new HashMap<>(); // Adicionado para o comportamento original

        try {
            // tempFile = fileStorageService.store(file);
            // O PdfService agora recebe um caminho de arquivo temporário se precisar. 
            // O upload inicial é feito por outro serviço ou controller.
            // Para o propósito atual, vamos criar um arquivo temporário localmente se necessário para o PDFBox
            tempFile = Files.createTempFile(UUID.randomUUID().toString(), ".pdf");
            file.transferTo(tempFile.toFile());
            
            document = PDDocument.load(tempFile.toFile());
            int totalPages = document.getNumberOfPages();
            logger.info("Iniciando processamento do PDF com {} páginas", totalPages);

            // Processar em lotes
            for (int batchStart = 0; batchStart < totalPages; batchStart += BATCH_SIZE) {
                int batchEnd = Math.min(batchStart + BATCH_SIZE, totalPages);
                logger.info("Processando lote de páginas {} a {}", batchStart + 1, batchEnd);

                for (int i = batchStart; i < batchEnd; i++) {
                    try {
                        PDDocument page = new PDDocument();
                        page.addPage(document.getPage(i));
                        
                        // Tentar extrair texto diretamente primeiro
                        String text = new PDFTextStripper().getText(page);
                        logger.info("Texto extraído da página {}: {}", i + 1, text);
                        
                        // Se não encontrar dados, tentar OCR
                        if (!encontrouDados(text)) {
                            try {
                                logger.info("Iniciando OCR para página {}", i + 1);
                                PDFRenderer renderer = new PDFRenderer(page);
                                BufferedImage image = renderer.renderImageWithDPI(0, 300);
                                
                                // Salvar a imagem temporariamente
                                Path tempImageFile = Files.createTempFile("ocr-", ".png");
                                try {
                                    logger.info("Salvando imagem temporária para OCR: {}", tempImageFile);
                                    javax.imageio.ImageIO.write(image, "png", tempImageFile.toFile());
                                    
                                    // Limpar a imagem da memória
                                    image.flush();
                                    
                                    logger.info("Iniciando extração de texto com OCR");
                                    text = tesseractService.extractTextFromImage(tempImageFile.toFile());
                                    logger.info("Texto extraído com OCR da página {}: {}", i + 1, text);
                                } finally {
                                    logger.info("Removendo arquivo temporário: {}", tempImageFile);
                                    Files.deleteIfExists(tempImageFile);
                                }
                            } catch (Exception e) {
                                logger.error("Erro ao realizar OCR na página {}: {}", i + 1, e.getMessage());
                                continue;
                            }
                        }
                        
                        // Extrair todas as informações do holerite
                        String cpf = extractValue(text, CPF_PATTERN);
                        String nome = extractValue(text, NOME_PATTERN);
                        String codigo = extractValue(text, CODIGO_PATTERN);
                        String cargo = extractValue(text, CARGO_PATTERN);
                        
                        // Extrair período e determinar mês/ano de referência
                        Matcher periodoMatcher = PERIODO_PATTERN.matcher(text);
                        if (periodoMatcher.find()) {
                            String dataInicio = periodoMatcher.group(1);
                            String dataFim = periodoMatcher.group(2);
                            String[] partesData = dataFim.split("/");
                            mesReferencia = partesData[1];
                            anoReferencia = Integer.parseInt(partesData[2]);
                            logger.info("Período encontrado: {} a {}, Mês: {}, Ano: {}", 
                                dataInicio, dataFim, mesReferencia, anoReferencia);
                        }

                        logger.info("Dados extraídos - Página {}: CPF={}, Nome={}, Código={}, Cargo={}, Mês={}, Ano={}", 
                            i + 1, cpf, nome, codigo, cargo, mesReferencia, anoReferencia);

                        if (cpf != null && !cpf.isEmpty() && nome != null && !nome.isEmpty()) {
                            ExtractedHoleriteData entity = new ExtractedHoleriteData();
                            entity.setNome(nome);
                            entity.setCpf(cpf);
                            entity.setCodigo(codigo);
                            entity.setMesReferencia(mesReferencia);
                            entity.setAnoReferencia(anoReferencia);
                            extractedHoleriteDataService.save(entity);
                            holeritesPorFuncionario.computeIfAbsent(cpf, k -> new ArrayList<>()).add(page);
                            logger.info("Dados salvos no banco para CPF: {}", cpf);
                        } else {
                            logger.warn("Dados incompletos na página {}: CPF={}, Nome={}", i + 1, cpf, nome);
                        }
                    } catch (Exception e) {
                        logger.error("Erro ao processar página {}: {}", i + 1, e.getMessage());
                    }
                }
                
                // Forçar coleta de lixo após cada lote
                System.gc();
            }

            if (holeritesPorFuncionario.isEmpty()) {
                logger.warn("Nenhum funcionário encontrado no PDF");
                return Map.of("message", "Nenhum funcionário encontrado no PDF");
            }

            // Criar diretório para o mês/ano de referência
            String pastaReferencia = String.format("%02d_%d", 
                Integer.parseInt(mesReferencia), anoReferencia);
            // Path pastaHolerites = fileStorageService.getRootLocation().resolve(pastaReferencia); // Removido
            Path pastaHolerites = Paths.get("uploads", "holerites_processados", pastaReferencia); // Novo caminho local
            Files.createDirectories(pastaHolerites);
            logger.info("Criada pasta para holerites: {}", pastaHolerites);

            // Gerar PDFs individuais
            logger.info("Iniciando geração de PDFs individuais");
            for (Map.Entry<String, List<PDDocument>> entry : holeritesPorFuncionario.entrySet()) {
                String cpf = entry.getKey();
                List<PDDocument> pages = entry.getValue();

                PDDocument newDoc = new PDDocument();
                for (PDDocument page : pages) {
                    newDoc.addPage(page.getPage(0));
                }

                String outputFileName = String.format("holerite_%s.pdf", cpf.replaceAll("[^0-9]", ""));
                Path outputPath = pastaHolerites.resolve(outputFileName);
                newDoc.save(outputPath.toFile());
                newDoc.close();
                arquivosGerados.add(outputFileName);
                logger.info("PDF gerado para CPF {}: {}", cpf, outputFileName);
            }

            // Criar arquivo ZIP
            logger.info("Iniciando criação do arquivo ZIP");
            String zipFileName = String.format("holerites_%s.zip", pastaReferencia);
            Path zipPath = pastaHolerites.resolve(zipFileName);
            try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {
                for (String fileName : arquivosGerados) {
                    File fileToZip = pastaHolerites.resolve(fileName).toFile();
                    ZipEntry zipEntry = new ZipEntry(fileName);
                    zos.putNextEntry(zipEntry);
                    Files.copy(fileToZip.toPath(), zos);
                    zos.closeEntry();
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "PDF processado com sucesso!");
            response.put("totalFuncionarios", holeritesPorFuncionario.size());
            response.put("arquivosGerados", new ArrayList<>(arquivosGerados));
            response.put("zipFile", zipFileName);
            response.put("pastaReferencia", pastaReferencia);

            return response;
        } catch (IOException e) {
            logger.error("Erro ao carregar documento PDF", e);
            throw new RuntimeException("Erro ao carregar documento PDF", e);
        } finally {
            logger.info("Removendo arquivo temporário original: {}", tempFile);
            if (tempFile != null) { // Adicionar verificação de nulidade
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException e) {
                    logger.error("Erro ao remover arquivo temporário {}: {}", tempFile, e.getMessage());
                }
            }
            if (document != null) {
                try {
                    document.close();
                } catch (IOException e) {
                    logger.error("Erro ao fechar documento PDF", e);
                }
            }
        }
    }

    private boolean encontrouDados(String text) {
        return CPF_PATTERN.matcher(text).find() && 
               NOME_PATTERN.matcher(text).find() && 
               CODIGO_PATTERN.matcher(text).find() && 
               CARGO_PATTERN.matcher(text).find() &&
               PERIODO_PATTERN.matcher(text).find();
    }

    private String extractValue(String text, Pattern pattern) {
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String value = matcher.group(1).trim();
            logger.debug("Valor extraído: {}", value);
            return value;
        }
        logger.debug("Nenhum valor encontrado para o padrão: {}", pattern.pattern());
        return "";
    }

    // Regex mais tolerante para código e nome (escapes duplos)
    private static final Pattern CODIGO_NOME_PATTERN = Pattern.compile("^[\\s]*(\\d{3,6})\\s+([A-Za-zÀ-ÿ'\\-\\s]+)", Pattern.MULTILINE);
} 