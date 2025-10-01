package br.com.fleetmanager.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class TesseractService {
    private static final Logger logger = LoggerFactory.getLogger(TesseractService.class);
    private Tesseract tesseract;
    private boolean tesseractAvailable = false;

    public TesseractService() {
        this.tesseract = new Tesseract();
        try {
            initializeTesseract();
        } catch (Exception e) {
            logger.warn("Tesseract não está disponível. Funcionalidades OCR serão desabilitadas: {}", e.getMessage());
            tesseractAvailable = false;
        }
    }
    
    private void initializeTesseract() {
        try {
            String datapath = new ClassPathResource("tessdata").getFile().getAbsolutePath();
            logger.info("Configurando Tesseract com datapath: {}", datapath);
            
            // Verificar se o diretório existe
            File tessdataDir = new File(datapath);
            if (!tessdataDir.exists()) {
                logger.warn("Diretório tessdata não encontrado: {}", datapath);
                return;
            }
            
            // Verificar se o arquivo de treinamento existe
            File trainedDataFile = new File(datapath, "por.traineddata");
            if (!trainedDataFile.exists()) {
                logger.warn("Arquivo de treinamento não encontrado: {}", trainedDataFile.getAbsolutePath());
                return;
            }
            
            logger.info("Arquivo de treinamento encontrado: {}", trainedDataFile.getAbsolutePath());
            
            tesseract.setDatapath(datapath);
            tesseract.setLanguage("por");
            tesseractAvailable = true;
            logger.info("Tesseract configurado com sucesso. Datapath: {}, Idioma: por", datapath);
        } catch (IOException e) {
            logger.warn("Erro ao configurar Tesseract: {}", e.getMessage());
            tesseractAvailable = false;
        }
    }

    public String extractTextFromImage(File imageFile) throws TesseractException {
        if (!tesseractAvailable) {
            logger.warn("Tesseract não está disponível. Retornando texto vazio.");
            return "";
        }
        
        logger.info("Iniciando extração de texto da imagem: {}", imageFile.getName());
        String result = tesseract.doOCR(imageFile);
        logger.info("Texto extraído com sucesso da imagem: {}", imageFile.getName());
        return result;
    }

    public String extractTextFromPdf(MultipartFile pdfFile) throws IOException, TesseractException {
        if (!tesseractAvailable) {
            logger.warn("Tesseract não está disponível. Retornando texto vazio.");
            return "";
        }
        
        logger.info("Iniciando extração de texto do PDF: {}", pdfFile.getOriginalFilename());
        
        // Criar diretório temporário para o PDF
        Path tempDir = Files.createTempDirectory("pdf_temp");
        File tempPdfFile = new File(tempDir.toFile(), pdfFile.getOriginalFilename());
        
        try {
            // Salvar o arquivo PDF temporariamente
            pdfFile.transferTo(tempPdfFile);
            logger.info("PDF salvo temporariamente em: {}", tempPdfFile.getAbsolutePath());
            
            // Extrair texto do PDF
            String result = tesseract.doOCR(tempPdfFile);
            logger.info("Texto extraído com sucesso do PDF: {}", pdfFile.getOriginalFilename());
            
            return result;
        } finally {
            // Limpar arquivos temporários
            if (tempPdfFile.exists()) {
                tempPdfFile.delete();
            }
            Files.deleteIfExists(tempDir);
            logger.info("Arquivos temporários removidos");
        }
    }
    
    public boolean isAvailable() {
        return tesseractAvailable;
    }
} 