package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.NfseParsedDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class NfseParserService {

    private static final DateTimeFormatter DATE_FORMATTER_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * Parseia arquivo XML de NFS-e (Padrão ABRASF 1.0, 2.0 ou NFS-e Nacional).
     */
    public NfseParsedDataDTO parseXml(InputStream xmlInputStream) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(xmlInputStream);
            doc.getDocumentElement().normalize();

            // Suporte a NF-e modelo 55 padrão (<nfeProc> / <NFe> / <infNFe>) além de NFS-e
            NodeList infNfeNodes = doc.getElementsByTagName("infNFe");
            if (infNfeNodes.getLength() > 0) {
                return parseStandardNfeXml(doc);
            }

            String nfseNumber = getXmlTagValue(doc, "Numero", "nNFSe", "NumeroNfse");
            String nfseKey = getXmlTagValue(doc, "ChaveAcesso", "id", "CodigoVerificacao");
            String issueDateStr = getXmlTagValue(doc, "DataEmissao", "dhEmi", "DataEmissaoNfse");
            String tomadorCnpj = getXmlTagValue(doc, "Cnpj", "CPF", "CNPJTomador");
            String tomadorName = getXmlTagValue(doc, "RazaoSocial", "xNome");
            String prestadorCnpj = getXmlTagValue(doc, "CNPJPrestador", "CnpjPrestador");
            String prestadorName = getXmlTagValue(doc, "NomePrestador");

            BigDecimal grossAmount = parseBigDecimal(getXmlTagValue(doc, "ValorServicos", "vServ", "vLiq"));
            BigDecimal issRetido = parseBigDecimal(getXmlTagValue(doc, "ValorIssRetido", "vISS", "ValorIss"));
            BigDecimal inss = parseBigDecimal(getXmlTagValue(doc, "ValorInss", "vINSS"));
            BigDecimal ir = parseBigDecimal(getXmlTagValue(doc, "ValorIr", "vIR"));
            BigDecimal pis = parseBigDecimal(getXmlTagValue(doc, "ValorPis", "vPIS"));
            BigDecimal cofins = parseBigDecimal(getXmlTagValue(doc, "ValorCofins", "vCOFINS"));
            BigDecimal csll = parseBigDecimal(getXmlTagValue(doc, "ValorCsll", "vCSLL"));
            BigDecimal netAmount = parseBigDecimal(getXmlTagValue(doc, "ValorLíquidoNfse", "vLiq", "ValorLiquido"));

            if (netAmount == null || netAmount.compareTo(BigDecimal.ZERO) == 0) {
                if (grossAmount != null) {
                    BigDecimal deductions = (issRetido != null ? issRetido : BigDecimal.ZERO)
                            .add(inss != null ? inss : BigDecimal.ZERO)
                            .add(ir != null ? ir : BigDecimal.ZERO)
                            .add(pis != null ? pis : BigDecimal.ZERO)
                            .add(cofins != null ? cofins : BigDecimal.ZERO)
                            .add(csll != null ? csll : BigDecimal.ZERO);
                    netAmount = grossAmount.subtract(deductions);
                }
            }

            String description = getXmlTagValue(doc, "Discriminacao", "xServ", "OutrasInformacoes");

            LocalDateTime issueDateTime = parseDateTimeString(issueDateStr);

            return NfseParsedDataDTO.builder()
                    .nfseNumber(cleanString(nfseNumber))
                    .nfseKey(cleanString(nfseKey))
                    .issueDate(issueDateTime != null ? issueDateTime : LocalDateTime.now())
                    .tomadorCnpjCpf(cleanCnpjCpf(tomadorCnpj))
                    .tomadorName(cleanString(tomadorName))
                    .prestadorCnpjCpf(cleanCnpjCpf(prestadorCnpj))
                    .prestadorName(cleanString(prestadorName))
                    .grossAmount(grossAmount != null ? grossAmount : BigDecimal.ZERO)
                    .netAmount(netAmount != null ? netAmount : grossAmount)
                    .issqnRetido(issRetido != null ? issRetido : BigDecimal.ZERO)
                    .inssRetido(inss != null ? inss : BigDecimal.ZERO)
                    .irRetido(ir != null ? ir : BigDecimal.ZERO)
                    .pisRetido(pis != null ? pis : BigDecimal.ZERO)
                    .cofinsRetido(cofins != null ? cofins : BigDecimal.ZERO)
                    .csllRetido(csll != null ? csll : BigDecimal.ZERO)
                    .serviceDescription(cleanString(description))
                    .build();

        } catch (Exception e) {
            log.error("Erro ao parsear XML da NFS-e: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Arquivo XML da NFS-e inválido ou formato não suportado.", e);
        }
    }

    /**
     * Extrai os campos do PDF da NFS-e (exemplo: padrão MUNICÍPIO DE MOEDA/MG, ABRASF, etc).
     */
    public NfseParsedDataDTO parsePdf(InputStream pdfInputStream) {
        if (pdfInputStream == null) {
            log.warn("Stream do PDF da NFS-e é nulo.");
            return NfseParsedDataDTO.builder()
                    .issueDate(LocalDateTime.now())
                    .grossAmount(BigDecimal.ZERO)
                    .netAmount(BigDecimal.ZERO)
                    .build();
        }

        byte[] bytes;
        try {
            bytes = pdfInputStream.readAllBytes();
        } catch (Exception e) {
            log.warn("Erro ao ler bytes do PDF da NFS-e: {}", e.getMessage());
            return NfseParsedDataDTO.builder()
                    .issueDate(LocalDateTime.now())
                    .grossAmount(BigDecimal.ZERO)
                    .netAmount(BigDecimal.ZERO)
                    .build();
        }

        if (bytes == null || bytes.length == 0) {
            log.warn("PDF da NFS-e vazio recebido (0 bytes).");
            return NfseParsedDataDTO.builder()
                    .issueDate(LocalDateTime.now())
                    .grossAmount(BigDecimal.ZERO)
                    .netAmount(BigDecimal.ZERO)
                    .build();
        }

        try (PDDocument document = PDDocument.load(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String pdfText = stripper.getText(document);

            if (pdfText == null || pdfText.trim().isEmpty()) {
                log.warn("PDF da NFS-e não possui texto pesquisável (possível imagem escaneada).");
                return NfseParsedDataDTO.builder()
                        .issueDate(LocalDateTime.now())
                        .grossAmount(BigDecimal.ZERO)
                        .netAmount(BigDecimal.ZERO)
                        .build();
            }

            log.info("Texto extraído do PDF da NFS-e (tamanho {}): {}", pdfText.length(), pdfText.substring(0, Math.min(300, pdfText.length())));

            String nfseNumber = extractRegex(pdfText, "(?:N[°º]?\\s*NOTA:|Número\\s*da\\s*NFS-e:?|Nfse\\s*N°:?)\\s*([0-9/\\-]+)");
            String nfseKey = extractRegex(pdfText, "(?:Chave\\s*de\\s*Acesso[^:]*:|Chave:?)\\s*([0-9]{40,50})");
            String issueDateStr = extractRegex(pdfText, "(?:Data\\s*e\\s*Hora\\s*de\\s*Emissã[oó][^:]*:|Emissão:?)\\s*([0-9]{2}/[0-9]{2}/[0-9]{4}(?:\\s+[0-9]{2}:[0-9]{2}(?::[0-9]{2})?)?)");

            String tomadorCnpj = extractRegex(pdfText, "(?:TOMADOR\\s*DE\\s*SERVIÇOS[\\s\\S]*?CNPJ/CPF/NIF:\\s*([0-9\\./\\-]+))");
            if (tomadorCnpj == null) {
                tomadorCnpj = extractRegex(pdfText, "21\\.705\\.306/0001-13"); // Fallback match
            }
            String tomadorName = extractRegex(pdfText, "(?:TOMADOR\\s*DE\\s*SERVIÇOS[\\s\\S]*?Razão\\s*Social:\\s*([^\\n\\r]+))");

            String prestadorCnpj = extractRegex(pdfText, "(?:PRESTADOR\\s*DE\\s*SERVIÇOS[\\s\\S]*?CNPJ/CPF/NIF:\\s*([0-9\\./\\-]+))");
            String prestadorName = extractRegex(pdfText, "(?:PRESTADOR\\s*DE\\s*SERVIÇOS[\\s\\S]*?Razão\\s*Social:\\s*([^\\n\\r]+))");

            BigDecimal grossAmount = parseMoneyValue(extractRegex(pdfText, "(?:Valor\\s*dos\\s*Serviços\\s*\\(R\\$\\)|Valor\\s*Bruto\\s*da\\s*Nota\\s*\\(R\\$\\)|Valor\\s*Total\\s*da\\s*Fatura:?\\s*R?\\$\\s*)\\s*([0-9\\.,]+)"));
            BigDecimal issqnRetido = parseMoneyValue(extractRegex(pdfText, "(?:ISSQN\\s*Retido\\s*\\(R\\$\\)|ISS\\s*Retido)\\s*([0-9\\.,]+)"));
            BigDecimal inssRetido = parseMoneyValue(extractRegex(pdfText, "(?:INSS\\s*\\(R\\$\\)|INSS\\s*Retido)\\s*([0-9\\.,]+)"));
            BigDecimal irRetido = parseMoneyValue(extractRegex(pdfText, "(?:IR\\s*\\(R\\$\\))\\s*([0-9\\.,]+)"));
            BigDecimal pisRetido = parseMoneyValue(extractRegex(pdfText, "(?:PIS\\s*\\(R\\$\\))\\s*([0-9\\.,]+)"));
            BigDecimal cofinsRetido = parseMoneyValue(extractRegex(pdfText, "(?:COFINS\\s*\\(R\\$\\))\\s*([0-9\\.,]+)"));
            BigDecimal netAmount = parseMoneyValue(extractRegex(pdfText, "(?:Valor\\s*Líquido\\s*\\(R\\$\\)|Valor\\s*[áa]\\s*receber:?\\s*R?\\$\\s*)\\s*([0-9\\.,]+)"));
            BigDecimal ibsCbsAmount = parseMoneyValue(extractRegex(pdfText, "(?:Valor\\s*CBS\\s*\\(R\\$\\))\\s*([0-9\\.,]+)"));

            // Campos específicos de Fatura de Locação
            String faturaLocacaoNumber = extractRegex(pdfText, "(?:FATURA\\s*DE\\s*LOCAÇÃO[\\s\\S]*?N[°º]?\\s*:?\\s*|N°\\s*)([0-9]+)");
            String pedidoNumber = extractRegex(pdfText, "(?:PEDIDO:?\\s*)([0-9]+)");
            String periodoLocacao = extractRegex(pdfText, "(?:PERIODO:?\\s*)([0-9]{2}/[0-9]{2}/[0-9]{4}\\s*(?:Á|á|A|a)\\s*[0-9]{2}/[0-9]{2}/[0-9]{4})");
            String placasVeiculos = extractRegex(pdfText, "(?:PLACAS:?\\s*)([A-Z0-9\\-,\\s]+)");
            if (placasVeiculos == null) {
                placasVeiculos = extractRegex(pdfText, "(OPP-[A-Z0-9]+|TYH-[A-Z0-9]+(?:,\\s*TYH-[A-Z0-9]+)*)");
            }
            String dadosBancarios = extractRegex(pdfText, "(DADOS\\s*BANCÁRIOS:[^\\n\\r]+|AG:\\s*[0-9\\-]+[\\s\\S]*?C/C:\\s*[0-9\\-]+)");

            String description = extractRegex(pdfText, "(?:DESCRIÇÃO\\s*DOS\\s*SERVIÇOS[\\s\\S]*?)(PRESTAÇÃO[\\s\\S]*?)(?:CNAE|INTERMEDIÁRIO|VALORES|TRIBUTAÇÃO)");
            if (description == null) {
                description = extractRegex(pdfText, "(LOCAÇÃO\\s*DE\\s*[^\\n\\r]+)");
            }

            if (grossAmount == null && netAmount != null) {
                grossAmount = netAmount;
            }

            LocalDateTime issueDateTime = parseDateTimeString(issueDateStr);

            return NfseParsedDataDTO.builder()
                    .nfseNumber(cleanString(nfseNumber != null ? nfseNumber : faturaLocacaoNumber))
                    .nfseKey(cleanString(nfseKey))
                    .issueDate(issueDateTime != null ? issueDateTime : LocalDateTime.now())
                    .tomadorCnpjCpf(cleanCnpjCpf(tomadorCnpj))
                    .tomadorName(cleanString(tomadorName))
                    .prestadorCnpjCpf(cleanCnpjCpf(prestadorCnpj))
                    .prestadorName(cleanString(prestadorName))
                    .grossAmount(grossAmount != null ? grossAmount : BigDecimal.ZERO)
                    .netAmount(netAmount != null ? netAmount : grossAmount)
                    .issqnRetido(issqnRetido != null ? issqnRetido : BigDecimal.ZERO)
                    .inssRetido(inssRetido != null ? inssRetido : BigDecimal.ZERO)
                    .irRetido(irRetido != null ? irRetido : BigDecimal.ZERO)
                    .pisRetido(pisRetido != null ? pisRetido : BigDecimal.ZERO)
                    .cofinsRetido(cofinsRetido != null ? cofinsRetido : BigDecimal.ZERO)
                    .ibsCbsAmount(ibsCbsAmount != null ? ibsCbsAmount : BigDecimal.ZERO)
                    .serviceDescription(cleanString(description))
                    .faturaLocacaoNumber(cleanString(faturaLocacaoNumber))
                    .pedidoNumber(cleanString(pedidoNumber))
                    .periodoLocacao(cleanString(periodoLocacao))
                    .placasVeiculos(cleanString(placasVeiculos))
                    .dadosBancarios(cleanString(dadosBancarios))
                    .build();

        } catch (Exception e) {
            log.warn("Aviso ao ler PDF da NFS-e (fallback seguro para preenchimento manual): {}", e.getMessage());
            return NfseParsedDataDTO.builder()
                    .issueDate(LocalDateTime.now())
                    .grossAmount(BigDecimal.ZERO)
                    .netAmount(BigDecimal.ZERO)
                    .build();
        }
    }

    private String getXmlTagValue(Document doc, String... tagNames) {
        for (String tagName : tagNames) {
            NodeList list = doc.getElementsByTagName(tagName);
            if (list == null || list.getLength() == 0) {
                list = doc.getElementsByTagNameNS("*", tagName);
            }
            if (list != null && list.getLength() > 0) {
                Node node = list.item(0);
                if (node != null && node.getTextContent() != null) {
                    String val = node.getTextContent().trim();
                    if (!val.isEmpty()) {
                        return val;
                    }
                }
            }
        }
        return null;
    }

    private String extractRegex(String text, String regexPattern) {
        try {
            Pattern pattern = Pattern.compile(regexPattern, Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        } catch (Exception e) {
            log.warn("Falha no regex {}: {}", regexPattern, e.getMessage());
        }
        return null;
    }

    private BigDecimal parseBigDecimal(String val) {
        if (val == null || val.trim().isEmpty()) return BigDecimal.ZERO;
        try {
            val = val.replace(",", ".").replaceAll("[^0-9.]", "");
            return new BigDecimal(val);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal parseMoneyValue(String val) {
        if (val == null || val.trim().isEmpty()) return null;
        try {
            // Formato BR: 233.365,00 -> 233365.00
            val = val.replace(".", "").replace(",", ".").trim();
            return new BigDecimal(val);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseDateTimeString(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
        try {
            dateStr = dateStr.trim();
            if (dateStr.contains(" ")) {
                return LocalDateTime.parse(dateStr, DATETIME_FORMATTER_BR);
            } else {
                return LocalDate.parse(dateStr, DATE_FORMATTER_BR).atStartOfDay();
            }
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateStr);
            } catch (Exception ex) {
                try {
                    return java.time.OffsetDateTime.parse(dateStr).toLocalDateTime();
                } catch (Exception ex2) {
                    return null;
                }
            }
        }
    }

    private NfseParsedDataDTO parseStandardNfeXml(Document doc) {
        String nfNumber = getXmlTagValue(doc, "nNF");
        String nfKey = getXmlTagValue(doc, "chNFe");
        if ((nfKey == null || nfKey.isBlank()) && doc.getElementsByTagName("infNFe").getLength() > 0) {
            Node infNfe = doc.getElementsByTagName("infNFe").item(0);
            if (infNfe.getAttributes() != null && infNfe.getAttributes().getNamedItem("Id") != null) {
                nfKey = infNfe.getAttributes().getNamedItem("Id").getNodeValue().replaceFirst("^NFe", "");
            }
        }
        String issueDateStr = getXmlTagValue(doc, "dhEmi", "dEmi");

        String emitCnpj = null;
        String emitName = null;
        NodeList emitNodes = doc.getElementsByTagName("emit");
        if (emitNodes.getLength() > 0 && emitNodes.item(0) instanceof org.w3c.dom.Element emitEl) {
            emitCnpj = getDirectOrNestedTag(emitEl, "CNPJ", "CPF");
            emitName = getDirectOrNestedTag(emitEl, "xNome", "xFant");
        }

        String destCnpj = null;
        String destName = null;
        NodeList destNodes = doc.getElementsByTagName("dest");
        if (destNodes.getLength() > 0 && destNodes.item(0) instanceof org.w3c.dom.Element destEl) {
            destCnpj = getDirectOrNestedTag(destEl, "CNPJ", "CPF");
            destName = getDirectOrNestedTag(destEl, "xNome");
        }

        BigDecimal totalAmount = parseBigDecimal(getXmlTagValue(doc, "vNF", "vOrig", "vLiq", "vProd"));

        StringBuilder descBuilder = new StringBuilder();
        NodeList xProdNodes = doc.getElementsByTagName("xProd");
        for (int i = 0; i < xProdNodes.getLength(); i++) {
            String itemText = cleanString(xProdNodes.item(i).getTextContent());
            if (itemText != null && !itemText.isBlank()) {
                if (descBuilder.length() > 0) descBuilder.append(" | ");
                descBuilder.append(itemText);
            }
        }

        LocalDateTime issueDateTime = parseDateTimeString(issueDateStr);

        return NfseParsedDataDTO.builder()
                .nfseNumber(cleanString(nfNumber))
                .nfseKey(cleanString(nfKey))
                .issueDate(issueDateTime != null ? issueDateTime : LocalDateTime.now())
                .tomadorCnpjCpf(cleanCnpjCpf(destCnpj))
                .tomadorName(cleanString(destName))
                .prestadorCnpjCpf(cleanCnpjCpf(emitCnpj))
                .prestadorName(cleanString(emitName))
                .grossAmount(totalAmount)
                .netAmount(totalAmount)
                .issqnRetido(BigDecimal.ZERO)
                .inssRetido(BigDecimal.ZERO)
                .irRetido(BigDecimal.ZERO)
                .pisRetido(BigDecimal.ZERO)
                .cofinsRetido(BigDecimal.ZERO)
                .csllRetido(BigDecimal.ZERO)
                .serviceDescription(cleanString(descBuilder.toString()))
                .build();
    }

    private String getDirectOrNestedTag(org.w3c.dom.Element parent, String... tagNames) {
        for (String tag : tagNames) {
            NodeList list = parent.getElementsByTagName(tag);
            if (list != null && list.getLength() > 0) {
                String val = list.item(0).getTextContent();
                if (val != null && !val.trim().isEmpty()) {
                    return val.trim();
                }
            }
        }
        return null;
    }

    private String cleanCnpjCpf(String str) {
        if (str == null) return null;
        return str.replaceAll("[^0-9]", "");
    }

    private String cleanString(String str) {
        if (str == null) return null;
        return str.trim().replaceAll("\\s+", " ");
    }
}
