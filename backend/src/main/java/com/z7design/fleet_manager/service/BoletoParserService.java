package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.BoletoParsedDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoletoParserService {

    private final FileStorageService fileStorageService;

    private static final DateTimeFormatter DATE_FORMAT_DD_MM_YYYY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Expressões regulares para detecção de linha digitável bancária (47 dígitos) ou concessionária (48 dígitos)
    private static final Pattern PATTERN_LINHA_DIGITAVEL_BANCARIA = Pattern.compile(
            "(?m)\\b(\\d{5})[.\\s]?(\\d{5})\\s+(\\d{5})[.\\s]?(\\d{6})\\s+(\\d{5})[.\\s]?(\\d{6})\\s+(\\d)\\s+(\\d{14})\\b"
    );

    private static final Pattern PATTERN_LINHA_DIGITAVEL_CONTINUA = Pattern.compile(
            "(?m)\\b(\\d{47})\\b"
    );

    private static final Pattern PATTERN_LINHA_DIGITAVEL_CONCESSIONARIA = Pattern.compile(
            "(?m)\\b(\\d{11,12})[\\s-]?(\\d)\\s+(\\d{11,12})[\\s-]?(\\d)\\s+(\\d{11,12})[\\s-]?(\\d)\\s+(\\d{11,12})[\\s-]?(\\d)\\b"
    );

    private static final Pattern PATTERN_VENCIMENTO_TEXTO = Pattern.compile(
            "(?i)(?:vencimento|data\\s+de\\s+vencimento|venc\\.?)\\s*[:\\-]?\\s*([0-3]?[0-9][/.\\-][0-1]?[0-9][/.\\-][2][0-9]{3})"
    );

    private static final Pattern PATTERN_VALOR_TEXTO = Pattern.compile(
            "(?i)(?:valor\\s+do\\s+documento|valor\\s+cobrado|valor\\s+nominal|valor\\s+a\\s+pagar|(=)\\s*valor)\\s*[:\\-]?\\s*(?:R\\$\\s*)?([0-9]{1,3}(?:\\.[0-9]{3})*,[0-9]{2})"
    );

    private static final Pattern PATTERN_CNPJ = Pattern.compile(
            "\\b\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}\\b"
    );

    /**
     * Processa um arquivo PDF de boleto, extrai metadados e armazena o arquivo.
     */
    public BoletoParsedDTO parseBoleto(MultipartFile file) {
        String originalName = file != null ? file.getOriginalFilename() : "boleto.pdf";
        log.info("Processando parse de boleto: {} ({} bytes)", originalName, file != null ? file.getSize() : 0);

        String storedFileUrl = null;
        try {
            if (file != null && !file.isEmpty()) {
                storedFileUrl = fileStorageService.storeFile(file);
            }
        } catch (Exception e) {
            log.warn("Não foi possível salvar o arquivo do boleto em disco: {}", e.getMessage());
        }

        String lowerName = originalName != null ? originalName.toLowerCase() : "";
        boolean isImage = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png") || lowerName.endsWith(".webp")
                || (file != null && file.getContentType() != null && file.getContentType().startsWith("image/"));

        if (isImage) {
            return BoletoParsedDTO.builder()
                    .originalFileName(originalName)
                    .fileUrl(storedFileUrl)
                    .amount(BigDecimal.ZERO)
                    .parseSuccess(true)
                    .errorMessage("Imagem anexada. Preencha ou confira vencimento e valor manualmente (leitura automática é feita em PDFs de boleto).")
                    .build();
        }

        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String fullText = stripper.getText(document);

            return extractDataFromText(fullText, originalName, storedFileUrl);

        } catch (Exception e) {
            log.error("Erro ao ler PDF do boleto {}: {}", originalName, e.getMessage(), e);
            return BoletoParsedDTO.builder()
                    .originalFileName(originalName)
                    .fileUrl(storedFileUrl)
                    .parseSuccess(false)
                    .errorMessage("Falha ao extrair texto do PDF: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Processa múltiplos boletos em lote.
     */
    public List<BoletoParsedDTO> parseBoletosBatch(MultipartFile[] files) {
        List<BoletoParsedDTO> results = new ArrayList<>();
        if (files == null || files.length == 0) {
            return results;
        }

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                results.add(parseBoleto(file));
            }
        }
        return results;
    }

    /**
     * Extrai metadados financeiros a partir do texto completo do PDF.
     */
    public BoletoParsedDTO extractDataFromText(String text, String originalFileName, String storedFileUrl) {
        BoletoParsedDTO.BoletoParsedDTOBuilder builder = BoletoParsedDTO.builder()
                .originalFileName(originalFileName)
                .fileUrl(storedFileUrl)
                .parseSuccess(true);

        if (text == null || text.isBlank()) {
            return builder
                    .parseSuccess(false)
                    .errorMessage("O documento PDF não contém texto legível (pode ser imagem digitalizada sem OCR).")
                    .build();
        }

        // 1. Tentar encontrar Linha Digitável Bancária Formatada (47 dígitos)
        String linhaDigitavel = null;
        String rawDigits = null;

        Matcher matcherBancaria = PATTERN_LINHA_DIGITAVEL_BANCARIA.matcher(text);
        if (matcherBancaria.find()) {
            String p1 = matcherBancaria.group(1) + matcherBancaria.group(2);
            String p2 = matcherBancaria.group(3) + matcherBancaria.group(4);
            String p3 = matcherBancaria.group(5) + matcherBancaria.group(6);
            String dv = matcherBancaria.group(7);
            String fatorValor = matcherBancaria.group(8);

            linhaDigitavel = String.format("%s.%s %s.%s %s.%s %s %s",
                    p1.substring(0, 5), p1.substring(5),
                    p2.substring(0, 5), p2.substring(5),
                    p3.substring(0, 5), p3.substring(5),
                    dv, fatorValor);
            rawDigits = p1 + p2 + p3 + dv + fatorValor;
        } else {
            // Tenta 47 dígitos contínuos
            Matcher matcherContinua = PATTERN_LINHA_DIGITAVEL_CONTINUA.matcher(text.replaceAll("[.\\-\\s]", ""));
            if (matcherContinua.find()) {
                rawDigits = matcherContinua.group(1);
                linhaDigitavel = formatarLinhaDigitavel47(rawDigits);
            } else {
                // Tenta Linha Digitável de Concessionária / Arrecadação (48 dígitos)
                Matcher matcherConc = PATTERN_LINHA_DIGITAVEL_CONCESSIONARIA.matcher(text);
                if (matcherConc.find()) {
                    rawDigits = (matcherConc.group(1) + matcherConc.group(2) +
                            matcherConc.group(3) + matcherConc.group(4) +
                            matcherConc.group(5) + matcherConc.group(6) +
                            matcherConc.group(7) + matcherConc.group(8)).replaceAll("\\D", "");
                    linhaDigitavel = rawDigits;
                }
            }
        }

        BigDecimal amount = null;
        LocalDate dueDate = null;
        String barcode = null;
        String bankCode = null;
        String bankName = null;

        if (rawDigits != null && rawDigits.length() == 47) {
            // Boleto Bancário 47 dígitos
            bankCode = rawDigits.substring(0, 3);
            bankName = resolveBankName(bankCode);

            // Código de barras (44 posições):
            // Banco(3) + Moeda(1) + DV(1) + Fator(4) + Valor(10) + CampoLivre(25)
            try {
                String bancoMoeda = rawDigits.substring(0, 4);
                String dvGeral = rawDigits.substring(32, 33);
                String fatorValor = rawDigits.substring(33, 47);
                String campoLivre1 = rawDigits.substring(4, 9);
                String campoLivre2 = rawDigits.substring(10, 20);
                String campoLivre3 = rawDigits.substring(21, 31);
                barcode = bancoMoeda + dvGeral + fatorValor + campoLivre1 + campoLivre2 + campoLivre3;

                // Fator de vencimento (4 dígitos) e Valor (10 dígitos)
                String fatorStr = fatorValor.substring(0, 4);
                String valorStr = fatorValor.substring(4, 14);

                int fator = Integer.parseInt(fatorStr);
                if (fator > 0) {
                    dueDate = calculateDueDateFromFactor(fator);
                }

                long valorCentavos = Long.parseLong(valorStr);
                if (valorCentavos > 0) {
                    amount = BigDecimal.valueOf(valorCentavos).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }
            } catch (Exception ex) {
                log.warn("Erro ao decodificar campos da linha digitável {}: {}", rawDigits, ex.getMessage());
            }
        } else if (rawDigits != null && rawDigits.length() == 48) {
            // Arrecadação / Concessionária (48 dígitos)
            bankCode = "ARR";
            bankName = "Concessionária / Tributos";
            try {
                // Dígitos 5 a 15 geralmente contêm o valor
                String valorStr = rawDigits.substring(4, 15);
                long valorCentavos = Long.parseLong(valorStr);
                if (valorCentavos > 0) {
                    amount = BigDecimal.valueOf(valorCentavos).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }
            } catch (Exception ignored) {}
        }

        // 2. Extração de Data de Vencimento Complementar via Texto
        if (dueDate == null) {
            Matcher matchDate = PATTERN_VENCIMENTO_TEXTO.matcher(text);
            if (matchDate.find()) {
                String dStr = matchDate.group(1).replace('-', '/').replace('.', '/');
                try {
                    dueDate = LocalDate.parse(dStr, DATE_FORMAT_DD_MM_YYYY);
                } catch (Exception ignored) {}
            }
        }

        // 3. Extração de Valor Complementar via Texto
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            Matcher matchVal = PATTERN_VALOR_TEXTO.matcher(text);
            if (matchVal.find()) {
                String vStr = matchVal.group(1).replace(".", "").replace(",", ".");
                try {
                    amount = new BigDecimal(vStr);
                } catch (Exception ignored) {}
            }
        }

        // 4. Identificar Beneficiário (Nome + CNPJ) e Pagador
        Matcher matchCnpj = PATTERN_CNPJ.matcher(text);
        List<String> cnpjs = new ArrayList<>();
        while (matchCnpj.find()) {
            String found = matchCnpj.group();
            if (!cnpjs.contains(found)) {
                cnpjs.add(found);
            }
        }

        String[] beneficiaryInfo = extractBeneficiaryInfo(text, cnpjs);
        String beneficiaryName = beneficiaryInfo[0];
        String beneficiaryCnpj = beneficiaryInfo[1];
        String payerCnpj = cnpjs.stream()
                .filter(c -> beneficiaryCnpj == null || !c.equals(beneficiaryCnpj))
                .findFirst()
                .orElse(null);

        // Se ainda não encontrou código de barras mas tem linha digitável
        if (barcode == null && rawDigits != null) {
            barcode = rawDigits;
        }

        return builder
                .linhaDigitavel(linhaDigitavel != null ? linhaDigitavel : rawDigits)
                .barcode(barcode)
                .amount(amount != null ? amount : BigDecimal.ZERO)
                .dueDate(dueDate)
                .bankCode(bankCode)
                .bankName(bankName)
                .beneficiaryName(beneficiaryName)
                .beneficiaryCnpjCpf(beneficiaryCnpj)
                .payerCnpjCpf(payerCnpj)
                .build();
    }

    private String[] extractBeneficiaryInfo(String text, List<String> fallbackCnpjs) {
        String foundCnpj = null;
        String foundName = null;

        if (text != null && !text.isBlank()) {
            String[] lines = text.split("\\r?\\n");
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;

                String lower = line.toLowerCase();
                boolean isBeneficiaryHeader = (lower.contains("benefici") || lower.contains("cedente") || lower.contains("favorecido"))
                        && !lower.contains("beneficiário final")
                        && !lower.contains("agência/código")
                        && !lower.contains("agencia/codigo");

                if (!isBeneficiaryHeader) continue;

                // Analisa a própria linha e até as próximas 2 linhas logo abaixo do cabeçalho
                for (int offset = 0; offset <= 2 && (i + offset) < lines.length; offset++) {
                    String candidate = lines[i + offset].trim();
                    if (candidate.isEmpty()) continue;
                    String candLower = candidate.toLowerCase();
                    if (offset > 0 && (candLower.startsWith("pagador") || candLower.startsWith("sacado")
                            || candLower.startsWith("nosso número") || candLower.startsWith("nosso numero"))) {
                        break;
                    }

                    Matcher cnpjMatcher = PATTERN_CNPJ.matcher(candidate);
                    if (foundCnpj == null && cnpjMatcher.find()) {
                        foundCnpj = cnpjMatcher.group();
                    }

                    String cleaned = candidate
                            .replaceAll("(?i)\\b(?:nome\\s+do\\s+)?(?:benefici[aá]rio|cedente|favorecido)\\b\\s*[:\\-/]*", " ")
                            .replaceAll("(?i)\\b(?:cpf\\s*/\\s*cnpj|cnpj\\s*/\\s*cpf|cnpj|cpf|ag[eê]ncia\\s*/\\s*c[oó]digo.*)\\b\\s*[:\\-/]*", " ")
                            .replaceAll(PATTERN_CNPJ.pattern(), " ")
                            .replaceAll("[|\\[\\]]", " ")
                            .replaceAll("\\s{2,}", " ")
                            .replaceAll("^[\\s\\-:./]+|[\\s\\-:./]+$", "")
                            .trim();

                    if (foundName == null && cleaned.length() >= 3 && cleaned.matches(".*[A-Za-zÀ-ÿ]{3,}.*")) {
                        // Evita capturar apenas cabeçalhos de coluna
                        if (!cleaned.equalsIgnoreCase("Nome") && !cleaned.equalsIgnoreCase("Razão Social")
                                && !cleaned.equalsIgnoreCase("Razao Social") && !cleaned.equalsIgnoreCase("Vencimento")) {
                            foundName = cleaned.length() > 180 ? cleaned.substring(0, 180) : cleaned;
                        }
                    }
                }

                if (foundName != null && foundCnpj != null) {
                    break;
                }
            }
        }

        if (foundCnpj == null && fallbackCnpjs != null && !fallbackCnpjs.isEmpty()) {
            foundCnpj = fallbackCnpjs.get(0);
        }

        return new String[] { foundName, foundCnpj };
    }

    /**
     * Calcula a data de vencimento a partir do fator Febraban.
     */
    private LocalDate calculateDueDateFromFactor(int factor) {
        // Ciclo 1 da Febraban: base 07/10/1997 até 21/02/2025 (fator 9999)
        // Ciclo 2 da Febraban: a partir de 22/02/2025, o fator 1000 recomeça correspondendo a 22/02/2025.
        // Hoje estamos em 2026, portanto fatores >= 1000 pertencem ao segundo ciclo se calculados agora.
        LocalDate baseCiclo2 = LocalDate.of(2025, 2, 22);
        LocalDate baseCiclo1 = LocalDate.of(1997, 10, 7);

        // Se o fator for >= 1000:
        if (factor >= 1000) {
            LocalDate dateCiclo2 = baseCiclo2.plusDays(factor - 1000);
            if (dateCiclo2.isAfter(LocalDate.of(2024, 12, 31))) {
                return dateCiclo2;
            }
            return baseCiclo1.plusDays(factor);
        } else {
            return baseCiclo1.plusDays(factor);
        }
    }

    private String formatarLinhaDigitavel47(String num) {
        if (num == null || num.length() != 47) return num;
        return String.format("%s.%s %s.%s %s.%s %s %s",
                num.substring(0, 5), num.substring(5, 10),
                num.substring(10, 15), num.substring(15, 21),
                num.substring(21, 26), num.substring(26, 32),
                num.substring(32, 33), num.substring(33, 47));
    }

    private String resolveBankName(String bankCode) {
        if (bankCode == null) return "Boleto Bancário";
        return switch (bankCode) {
            case "001" -> "Banco do Brasil";
            case "237" -> "Bradesco";
            case "341" -> "Itaú Unibanco";
            case "104" -> "Caixa Econômica Federal";
            case "033" -> "Santander";
            case "756" -> "Sicoob";
            case "748" -> "Sicredi";
            case "077" -> "Banco Inter";
            case "260" -> "Nubank";
            case "422" -> "Banco Safra";
            case "212" -> "Banco Original";
            case "655" -> "Banco Neon";
            default -> "Banco " + bankCode;
        };
    }
}

