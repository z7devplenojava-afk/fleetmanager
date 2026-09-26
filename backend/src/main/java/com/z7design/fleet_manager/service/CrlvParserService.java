package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CrlvParsedDataDTO;
import com.z7design.fleet_manager.model.Vehicle.BusType;
import com.z7design.fleet_manager.model.Vehicle.FuelType;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.text.Normalizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class CrlvParserService {

    private static final Pattern PLATE_PATTERN = Pattern.compile("(?i)\\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\\b|\\b([A-Z]{3}-[0-9]{4})\\b");
    private static final Pattern CHASSIS_PATTERN = Pattern.compile("(?i)\\b([A-HJ-NPR-Z0-9]{17})\\b");
    private static final Pattern RENAVAM_PATTERN = Pattern.compile("(?i)\\b(\\d{9,11})\\b");
    private static final Pattern YEAR_PATTERN = Pattern.compile("(?i)\\b(19\\d{2}|20\\d{2})\\b");

    public CrlvParsedDataDTO parsePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo PDF não fornecido ou vazio");
        }

        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String rawText = stripper.getText(document);

            return parseText(rawText);

        } catch (Exception e) {
            log.error("Erro ao extrair texto do PDF do CRLV: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao ler arquivo PDF do CRLV: " + e.getMessage());
        }
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
