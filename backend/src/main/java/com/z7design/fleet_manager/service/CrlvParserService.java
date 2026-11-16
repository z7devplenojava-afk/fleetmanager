package com.z7design.fleet_manager.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.LuminanceSource;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.NotFoundException;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.z7design.fleet_manager.dto.CrlvParsedDataDTO;
import com.z7design.fleet_manager.model.Vehicle.BusType;
import com.z7design.fleet_manager.model.Vehicle.FuelType;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrlvParserService {

    private static final Pattern PLATE_PATTERN = Pattern.compile("(?i)\\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\\b|\\b([A-Z]{3}-[0-9]{4})\\b");
    private static final Pattern FILENAME_PLATE_PATTERN = Pattern.compile("(?i)(?:^|[^A-Z0-9])([A-Z]{3}[-_\\s]?[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}[-_\\s]?[0-9]{4})(?:$|[^A-Z0-9])");
    private static final Pattern CHASSIS_PATTERN = Pattern.compile("(?i)\\b([A-HJ-NPR-Z0-9]{17})\\b");
    private static final Pattern RENAVAM_PATTERN = Pattern.compile("(?i)\\b(\\d{9,11})\\b");
    private static final Pattern YEAR_PATTERN = Pattern.compile("(?i)\\b(19\\d{2}|20\\d{2})\\b");

    @Autowired(required = false)
    private OcrService ocrService;

    public CrlvParsedDataDTO parsePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo PDF não fornecido ou vazio");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String rawText = "";

        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {

            // 1. Tentar extração direta de texto via PDFTextStripper ordenado
            try {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                rawText = stripper.getText(document);
            } catch (Exception e) {
                log.debug("PDFTextStripper ordenado falhou para {}: {}", originalFilename, e.getMessage());
            }

            // 2. Se texto muito curto, tentar sem ordenação posicional
            if (rawText == null || rawText.trim().length() < 20) {
                try {
                    PDFTextStripper stripper = new PDFTextStripper();
                    stripper.setSortByPosition(false);
                    String untext = stripper.getText(document);
                    if (untext != null && untext.trim().length() > (rawText != null ? rawText.trim().length() : 0)) {
                        rawText = untext;
                    }
                } catch (Exception ignored) {}
            }

            // 3. Se ainda vazio ou sem placa identificável, tentar escanear QR Code do documento (SENATRAN/SERPRO/DETRAN)
            if (rawText == null || rawText.trim().length() < 20 || !hasPlate(rawText)) {
                String qrData = extractQrCodeFromDocument(document);
                if (qrData != null && !qrData.isBlank()) {
                    log.info("QR Code detectado no CRLV (arquivo: {}): {}", originalFilename, qrData);
                    rawText = (rawText != null ? rawText + "\n" : "") + qrData;
                }
            }

            // 4. Se ainda sem texto e o serviço de OCR estiver disponível, tentar OCR nas páginas
            if ((rawText == null || rawText.trim().length() < 20 || !hasPlate(rawText)) && ocrService != null) {
                try {
                    log.info("Documento sem camada de texto clara. Tentando OCR para: {}", originalFilename);
                    StringBuilder ocrText = new StringBuilder();
                    int maxPages = Math.min(document.getNumberOfPages(), 2);
                    for (int p = 0; p < maxPages; p++) {
                        String pt = ocrService.extractTextFromPdfPage(document, p);
                        if (pt != null && !pt.isBlank()) {
                            ocrText.append("\n").append(pt);
                        }
                    }
                    if (ocrText.length() > 0) {
                        rawText = (rawText != null ? rawText + "\n" : "") + ocrText.toString();
                    }
                } catch (Throwable t) {
                    log.debug("Tentativa de OCR no arquivo {} falhou ou não configurada: {}", originalFilename, t.getMessage());
                }
            }

        } catch (Exception e) {
            log.warn("Erro ao ler documento PDF {}: {}", originalFilename, e.getMessage());
        }

        // 5. Tenta fazer parse do texto coletado se houver conteúdo
        CrlvParsedDataDTO parsed = null;
        if (rawText != null && !rawText.isBlank()) {
            try {
                parsed = parseText(rawText);
            } catch (Exception e) {
                log.debug("parseText retornou exceção para {}: {}", originalFilename, e.getMessage());
            }
        }

        // 6. Resgate inteligente via Nome do Arquivo (Fallback essencial para PDFs escaneados / fotos)
        CrlvParsedDataDTO fromFilename = extractFromFilename(originalFilename);

        if (parsed == null || parsed.getPlate() == null || parsed.getPlate().isBlank()) {
            if (fromFilename != null && fromFilename.getPlate() != null && !fromFilename.getPlate().isBlank()) {
                log.info("CRLV (documento escaneado/imagem) sem placa no texto. Recuperada placa [{}] e metadados via nome do arquivo: {}",
                        fromFilename.getPlate(), originalFilename);
                if (parsed != null) {
                    // Completa os campos do texto com os dados extraídos do nome do arquivo
                    parsed.setPlate(fromFilename.getPlate());
                    if (parsed.getManufactureYear() == null) parsed.setManufactureYear(fromFilename.getManufactureYear());
                    if (parsed.getModelYear() == null) parsed.setModelYear(fromFilename.getModelYear());
                    if (parsed.getFleetNumber() == null) parsed.setFleetNumber(fromFilename.getFleetNumber());
                    if (parsed.getBrand() == null || "Outros".equalsIgnoreCase(parsed.getBrand())) parsed.setBrand(fromFilename.getBrand());
                    if (parsed.getModel() == null || "Não Informado".equalsIgnoreCase(parsed.getModel())) parsed.setModel(fromFilename.getModel());
                    return parsed;
                }
                return fromFilename;
            }
            // Se mesmo com o nome do arquivo não identificou placa:
            throw new IllegalArgumentException("Não foi possível identificar a placa do veículo no documento nem no nome do arquivo (" + originalFilename + ").");
        }

        // Se identificou a placa no texto mas o nome do arquivo tem dados adicionais (ex: frota/prefixo), enriquece
        if (fromFilename != null) {
            if ((parsed.getFleetNumber() == null || parsed.getFleetNumber().isBlank()) && fromFilename.getFleetNumber() != null) {
                parsed.setFleetNumber(fromFilename.getFleetNumber());
            }
            if (parsed.getManufactureYear() == null && fromFilename.getManufactureYear() != null) {
                parsed.setManufactureYear(fromFilename.getManufactureYear());
            }
        }

        return parsed;
    }

    private boolean hasPlate(String text) {
        if (text == null || text.isBlank()) return false;
        return PLATE_PATTERN.matcher(text).find() || FILENAME_PLATE_PATTERN.matcher(text).find();
    }

    /**
     * Tenta ler QR Code de páginas do PDF usando ZXing puro Java.
     */
    private String extractQrCodeFromDocument(PDDocument document) {
        try {
            PDFRenderer renderer = new PDFRenderer(document);
            int pages = Math.min(document.getNumberOfPages(), 3);
            for (int i = 0; i < pages; i++) {
                try {
                    BufferedImage bim = renderer.renderImageWithDPI(i, 200);
                    LuminanceSource source = new BufferedImageLuminanceSource(bim);
                    BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));

                    Map<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);
                    hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
                    hints.put(DecodeHintType.POSSIBLE_FORMATS, List.of(BarcodeFormat.QR_CODE));

                    Result result = new MultiFormatReader().decode(bitmap, hints);
                    if (result != null && result.getText() != null && !result.getText().isBlank()) {
                        return result.getText();
                    }
                } catch (NotFoundException ignored) {
                    // Sem QR code nesta página
                } catch (Exception e) {
                    log.debug("Erro ao decodificar QR code da página {}: {}", i, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("Falha geral ao tentar ler QR code do PDF: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Extrai placa, ano, número de frota e marca do nome do arquivo
     * Exemplo: "CRLV CRLV TDM2F69 2025 Frota 2559.pdf" -> Placa: TDM2F69, Ano: 2025, Frota: 2559
     * Exemplo: "SIK5A46.pdf" -> Placa: SIK5A46
     */
    public CrlvParsedDataDTO extractFromFilename(String filename) {
        if (filename == null || filename.isBlank()) return null;

        String cleanName = filename.replaceAll("(?i)\\.(pdf|png|jpg|jpeg)$", "").trim();

        // 1. Placa
        String plate = null;
        Matcher plateMatcher = FILENAME_PLATE_PATTERN.matcher(cleanName);
        if (plateMatcher.find()) {
            plate = cleanPlate(plateMatcher.group(1));
        }

        // 2. Ano (1970 - 2039)
        Integer year = null;
        Matcher yearMatcher = Pattern.compile("(?i)(?:^|[^0-9])(19[7-9]\\d|20[0-3]\\d)(?:$|[^0-9])").matcher(cleanName);
        if (yearMatcher.find()) {
            year = parseInteger(yearMatcher.group(1));
        }

        // 3. Frota / Prefixo
        String fleetNumber = null;
        Matcher fleetMatcher = Pattern.compile("(?i)(?:frota|carro|prefixo|veiculo|veículo|vss|cod|código|nº|num|#)[\\s_.:-]*([A-Za-z0-9_-]+)").matcher(cleanName);
        if (fleetMatcher.find()) {
            fleetNumber = fleetMatcher.group(1).trim();
        } else {
            // Se o nome começar ou terminar com número de frota separado (ex: "2559 - TDM2F69")
            Matcher prefixLeading = Pattern.compile("^(\\d{2,6})[\\s_.:-]+").matcher(cleanName);
            if (prefixLeading.find()) {
                String candidate = prefixLeading.group(1);
                if (year == null || !candidate.equals(String.valueOf(year))) {
                    fleetNumber = candidate;
                }
            }
        }

        // 4. Marca / Modelo se detectado
        String brand = null;
        String model = null;
        String lower = cleanName.toLowerCase();
        if (lower.contains("mercedes") || lower.contains("m.benz") || lower.contains("m benz")) brand = "Mercedes-Benz";
        else if (lower.contains("volkswagen") || lower.contains("vw") || lower.contains("volks")) brand = "Volkswagen";
        else if (lower.contains("scania")) brand = "Scania";
        else if (lower.contains("volvo")) brand = "Volvo";
        else if (lower.contains("marcopolo")) brand = "Marcopolo";
        else if (lower.contains("caio")) brand = "Caio";
        else if (lower.contains("comil")) brand = "Comil";
        else if (lower.contains("mascarello")) brand = "Mascarello";

        if (plate == null && fleetNumber == null && year == null) {
            return null;
        }

        return CrlvParsedDataDTO.builder()
                .plate(plate)
                .manufactureYear(year)
                .modelYear(year)
                .fleetNumber(fleetNumber)
                .brand(brand != null ? brand : "Outros")
                .model(model != null ? model : "Não Informado")
                .vehicleType(VehicleType.BUS_ROAD)
                .busType(BusType.RODOVIARIO)
                .fuelType(FuelType.DIESEL)
                .rawText("Metadados recuperados do nome do arquivo: " + filename)
                .build();
    }

    public CrlvParsedDataDTO parseText(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            throw new IllegalArgumentException("Texto do documento está vazio ou não pôde ser extraído.");
        }

        CrlvParsedDataDTO.CrlvParsedDataDTOBuilder builder = CrlvParsedDataDTO.builder();
        builder.rawText(rawText);

        // 1. RENAVAM
        String renavam = extractRegex(rawText, "(?i)C[OÓ]DIGO\\s*RENAVAM[\\s\\r\\n:]*(\\d{9,11})");
        if (renavam == null) {
            renavam = extractRegex(rawText, "(?i)RENAVAM[\\s\\r\\n:]*(\\d{9,11})");
        }
        builder.renavam(renavam);

        // 2. PLACA
        String plate = extractRegex(rawText, "(?i)PLACA[\\s\\r\\n:]*([A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}-[0-9]{4})");
        if (plate == null) {
            // Tenta formato onde PLACA e EXERCÍCIO estão lado a lado
            plate = extractRegex(rawText, "(?i)PLACA\\s+EXERC[IÍ]CIO[\\r\\n\\s]+([A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}-[0-9]{4})");
        }
        if (plate == null) {
            // Fallback: procura padrão de placa no documento
            Matcher m = PLATE_PATTERN.matcher(rawText);
            if (m.find()) {
                plate = m.group(1) != null ? m.group(1) : m.group(2);
            }
        }
        if (plate != null) {
            plate = cleanPlate(plate);
        }
        builder.plate(plate);

        // 3. ANO FABRICAÇÃO E ANO MODELO
        Integer fabYear = null;
        Integer modYear = null;

        String combinedYears = extractRegex(rawText, "(?i)ANO\\s*FABRICA[CÇ][AÃ]O\\s+ANO\\s*MODELO[\\r\\n\\s]+(\\d{4})\\s+(\\d{4})");
        if (combinedYears != null) {
            Matcher m = Pattern.compile("(\\d{4})\\s+(\\d{4})").matcher(combinedYears);
            if (m.find()) {
                fabYear = parseInteger(m.group(1));
                modYear = parseInteger(m.group(2));
            }
        }

        if (fabYear == null) {
            String fabStr = extractRegex(rawText, "(?i)ANO\\s*FABRICA[CÇ][AÃ]O[\\s\\r\\n:]*(\\d{4})");
            fabYear = parseInteger(fabStr);
        }
        if (modYear == null) {
            String modStr = extractRegex(rawText, "(?i)ANO\\s*MODELO[\\s\\r\\n:]*(\\d{4})");
            modYear = parseInteger(modStr);
        }

        builder.manufactureYear(fabYear);
        builder.modelYear(modYear);

        // 4. CHASSI
        String chassis = extractRegex(rawText, "(?i)CHASSI[\\s\\r\\n:]*([A-HJ-NPR-Z0-9]{17})");
        if (chassis == null) {
            Matcher m = CHASSIS_PATTERN.matcher(rawText);
            if (m.find()) {
                chassis = m.group(1).toUpperCase();
            }
        }
        builder.chassisNumber(chassis != null ? chassis.toUpperCase() : null);

        // 5. MARCA / MODELO / VERSÃO
        String marcaModelo = extractRegex(rawText, "(?i)MARCA\\s*/\\s*MODELO(?:\\s*/\\s*VERS[AÃ]O)?[\\s\\r\\n:]+([^\\r\\n]+)");
        if (marcaModelo != null) {
            marcaModelo = marcaModelo.trim();
            if (marcaModelo.contains("/")) {
                String[] parts = marcaModelo.split("/", 2);
                builder.brand(normalizeBrand(parts[0].trim()));
                builder.model(parts[1].trim());
            } else {
                builder.brand(extractBrandFromText(marcaModelo));
                builder.model(marcaModelo);
            }
        }

        // 6. ESPÉCIE / TIPO
        String especieTipo = extractRegex(rawText, "(?i)ESP[EÉ]CIE\\s*/\\s*TIPO[\\s\\r\\n:]+([^\\r\\n]+)");
        VehicleType vType = parseVehicleType(especieTipo, rawText);
        BusType bType = parseBusType(especieTipo, rawText);
        builder.vehicleType(vType);
        builder.busType(bType);

        // 7. COR PREDOMINANTE
        String cor = extractRegex(rawText, "(?i)COR\\s*PREDOMINANTE[\\s\\r\\n:]+([A-ZÁ-Úa-zá-ú]+)");
        if (cor != null) {
            cor = capitalizeFirst(cor.trim());
        }
        builder.color(cor);

        // 8. COMBUSTÍVEL
        String fuelRaw = extractRegex(rawText, "(?i)COMBUST[IÍ]VEL[\\s\\r\\n:]+([A-ZÁ-Úa-zá-ú/]+)");
        builder.fuelTypeRaw(fuelRaw);
        builder.fuelType(parseFuelType(fuelRaw));

        // 9. CATEGORIA
        String categoria = extractRegex(rawText, "(?i)CATEGORIA[\\s\\r\\n:]+([A-ZÁ-Úa-zá-ú]+)");
        builder.category(categoria != null ? categoria.trim() : null);

        // 10. LOTAÇÃO / CAPACIDADE
        Integer capacity = null;
        String lotacao = extractRegex(rawText, "(?i)LOTA[CÇ][AÃ]O[\\s\\r\\n:]*(\\d{1,3})\\s*P?");
        if (lotacao != null) {
            capacity = parseInteger(lotacao);
        }
        if (capacity == null) {
            String capStr = extractRegex(rawText, "(?i)CAPACIDADE[\\s\\r\\n:]*(\\d{1,3})\\s*P?");
            capacity = parseInteger(capStr);
        }
        builder.capacity(capacity);

        // 11. POTÊNCIA / CILINDRADA
        String potencia = extractRegex(rawText, "(?i)POT[EÊ]NCIA\\s*/\\s*CILINDRADA[\\s\\r\\n:]*(\\d{1,4})\\s*CV");
        builder.enginePowerHp(parseInteger(potencia));

        // 12. PESO BRUTO TOTAL (PBT)
        String pbtStr = extractRegex(rawText, "(?i)PESO\\s*BRUTO\\s*TOTAL[\\s\\r\\n:]*([0-9.,]+)");
        if (pbtStr != null) {
            try {
                double val = Double.parseDouble(pbtStr.replace(",", "."));
                if (val > 0 && val <= 100) {
                    builder.totalWeightKg((int) Math.round(val * 1000));
                } else {
                    builder.totalWeightKg((int) Math.round(val));
                }
            } catch (Exception ignored) {}
        }

        // 13. MOTOR
        String motor = extractRegex(rawText, "(?i)MOTOR[\\s\\r\\n:]+([A-Z0-9]{6,25})");
        builder.engineNumber(motor != null ? motor.trim().toUpperCase() : null);

        // 14. CMT
        String cmt = extractRegex(rawText, "(?i)CMT[\\s\\r\\n:]*([0-9.,]+)");
        builder.cmt(cmt);

        // 15. EIXOS
        String eixos = extractRegex(rawText, "(?i)EIXOS[\\s\\r\\n:]*(\\d{1,2})");
        builder.axleCount(parseInteger(eixos));

        // 16. CARROCERIA
        String carroceria = extractRegex(rawText, "(?i)CARROCERIA[\\s\\r\\n:]+([^\\r\\n]+)");
        if (carroceria != null && !carroceria.equalsIgnoreCase("NÃO APLICAVEL") && !carroceria.equalsIgnoreCase("NAO APLICAVEL")) {
            builder.bodyType(carroceria.trim());
        }

        // 17. NOME (Proprietário)
        String nome = extractRegex(rawText, "(?i)NOME[\\s\\r\\n:]+([^\\r\\n]+)");
        builder.ownerName(nome != null ? nome.trim() : null);

        // 18. CPF / CNPJ
        String cpfCnpj = extractRegex(rawText, "(?i)CPF\\s*/\\s*CNPJ[\\s\\r\\n:]*([0-9./-]+)");
        builder.ownerCpfCnpj(cpfCnpj != null ? cpfCnpj.trim() : null);

        // 19. LOCAL E DATA
        String local = extractRegex(rawText, "(?i)LOCAL[\\s\\r\\n:]+([^\\r\\n]+)");
        builder.cityState(local != null ? local.trim() : null);

        String data = extractRegex(rawText, "(?i)DATA[\\s\\r\\n:]*(\\d{2}/\\d{2}/\\d{4})");
        builder.issueDate(data != null ? data.trim() : null);

        return builder.build();
    }

    private String extractRegex(String text, String regex) {
        try {
            Matcher m = Pattern.compile(regex).matcher(text);
            if (m.find()) {
                return m.group(1).trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String cleanPlate(String rawPlate) {
        if (rawPlate == null) return null;
        String clean = rawPlate.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        return clean.length() > 7 ? clean.substring(0, 7) : clean;
    }

    private Integer parseInteger(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return Integer.parseInt(val.replaceAll("\\D", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeBrand(String rawBrand) {
        if (rawBrand == null) return "Outros";
        String lower = rawBrand.toLowerCase().trim();
        if (lower.contains("m.benz") || lower.contains("mercedes") || lower.contains("m benz")) return "Mercedes-Benz";
        if (lower.contains("volkswagen") || lower.contains("vw") || lower.contains("volks")) return "Volkswagen";
        if (lower.contains("scania")) return "Scania";
        if (lower.contains("volvo")) return "Volvo";
        if (lower.contains("marcopolo")) return "Marcopolo";
        if (lower.contains("comil")) return "Comil";
        if (lower.contains("caio")) return "Caio";
        if (lower.contains("mascarello")) return "Mascarello";
        if (lower.contains("fiat")) return "Fiat";
        if (lower.contains("ford")) return "Ford";
        if (lower.contains("chevrolet") || lower.contains("gm")) return "Chevrolet";
        if (lower.contains("renault")) return "Renault";
        if (lower.contains("iveco")) return "Iveco";
        if (lower.contains("toyota")) return "Toyota";
        if (lower.contains("hyundai")) return "Hyundai";
        return capitalizeFirst(rawBrand);
    }

    private String extractBrandFromText(String text) {
        return normalizeBrand(text);
    }

    private FuelType parseFuelType(String raw) {
        if (raw == null) return FuelType.DIESEL;
        String norm = normalizeText(raw);
        if (norm.contains("diesel")) return FuelType.DIESEL;
        if (norm.contains("gasol") && norm.contains("alcool")) return FuelType.FLEX;
        if (norm.contains("flex")) return FuelType.FLEX;
        if (norm.contains("gasolina")) return FuelType.GASOLINE;
        if (norm.contains("alcool") || norm.contains("etanol")) return FuelType.ETHANOL;
        return FuelType.DIESEL;
    }

    private VehicleType parseVehicleType(String especieTipo, String rawText) {
        String combined = normalizeText((especieTipo != null ? especieTipo : "") + " " + rawText);
        if (combined.contains("onibus") || combined.contains("bus")) {
            if (combined.contains("urbano")) return VehicleType.BUS_URBAN;
            return VehicleType.BUS_ROAD;
        }
        if (combined.contains("micro")) return VehicleType.MINIBUS;
        if (combined.contains("van")) return VehicleType.VAN;
        if (combined.contains("caminhao") || combined.contains("trator") || combined.contains("carreta")) return VehicleType.TRUCK;
        if (combined.contains("camionete") || combined.contains("pickup") || combined.contains("picape")) return VehicleType.PICKUP;
        if (combined.contains("utilitario") || combined.contains("furgao")) return VehicleType.CAR_UTILITY;
        if (combined.contains("suv")) return VehicleType.SUV;
        if (combined.contains("motocicleta") || combined.contains("moto")) return VehicleType.MOTORCYCLE;
        if (combined.contains("automovel") || combined.contains("passeio")) return VehicleType.CAR;
        return VehicleType.BUS_ROAD;
    }

    private BusType parseBusType(String especieTipo, String rawText) {
        String combined = normalizeText((especieTipo != null ? especieTipo : "") + " " + rawText);
        if (combined.contains("articulado")) return BusType.ARTICULADO;
        if (combined.contains("double decker") || combined.contains("luxo")) return BusType.LUXO_TURISMO;
        if (combined.contains("micro")) return BusType.MICRO_ONIBUS;
        if (combined.contains("urbano")) return BusType.URBANO;
        if (combined.contains("escola") || combined.contains("escolar")) return BusType.ESCOLA;
        if (combined.contains("fretado") || combined.contains("fretamento")) return BusType.FRETADO;
        if (combined.contains("intermunicipal")) return BusType.INTERMUNICIPAL;
        return BusType.RODOVIARIO;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").toLowerCase().trim();
    }

    private String capitalizeFirst(String str) {
        if (str == null || str.isBlank()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
