package com.z7design.fleet_manager.util;

import com.z7design.fleet_manager.model.Company;
import lombok.extern.slf4j.Slf4j;

/**
 * UtilitÃ¡rio para formataÃ§Ã£o de dados da empresa para relatÃ³rios
 */
@Slf4j
public class CompanyDataFormatter {
    
    /**
     * Formata CNPJ com mÃ¡scara: XX.XXX.XXX/XXXX-XX
     */
    public static String formatCnpj(String cnpj) {
        if (cnpj == null || cnpj.isEmpty()) {
            return "";
        }
        
        // Remover caracteres nÃ£o numÃ©ricos
        String digits = cnpj.replaceAll("[^0-9]", "");
        
        // Formatar: XX.XXX.XXX/XXXX-XX
        if (digits.length() == 14) {
            return String.format("%s.%s.%s/%s-%s",
                digits.substring(0, 2),
                digits.substring(2, 5),
                digits.substring(5, 8),
                digits.substring(8, 12),
                digits.substring(12, 14));
        }
        
        return cnpj; // Retornar original se nÃ£o tiver 14 dÃ­gitos
    }
    
    /**
     * Formata telefone: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
     */
    public static String formatPhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return "";
        }
        
        // Remover caracteres nÃ£o numÃ©ricos
        String digits = phone.replaceAll("[^0-9]", "");
        
        if (digits.length() == 10) {
            // Telefone fixo: (XX) XXXX-XXXX
            return String.format("(%s) %s-%s",
                digits.substring(0, 2),
                digits.substring(2, 6),
                digits.substring(6, 10));
        } else if (digits.length() == 11) {
            // Celular: (XX) XXXXX-XXXX
            return String.format("(%s) %s-%s",
                digits.substring(0, 2),
                digits.substring(2, 7),
                digits.substring(7, 11));
        }
        
        return phone; // Retornar original se nÃ£o tiver formato conhecido
    }
    
    /**
     * Formata endereÃ§o completo da empresa
     * Formato: Rua, NÃºmero - Complemento - Bairro - Cidade/Estado - CEP
     */
    public static String formatFullAddress(Company company) {
        if (company == null) {
            return "";
        }
        
        StringBuilder address = new StringBuilder();
        
        // Rua e nÃºmero
        if (company.getEnderecoRua() != null && !company.getEnderecoRua().isEmpty()) {
            address.append(company.getEnderecoRua());
            
            if (company.getEnderecoNumero() != null && !company.getEnderecoNumero().isEmpty()) {
                address.append(", ").append(company.getEnderecoNumero());
            }
        } else if (company.getAddress() != null && !company.getAddress().isEmpty()) {
            // Fallback para campo address legado
            address.append(company.getAddress());
        }
        
        // Complemento
        if (company.getEnderecoComplemento() != null && !company.getEnderecoComplemento().isEmpty()) {
            if (address.length() > 0) {
                address.append(" - ");
            }
            address.append(company.getEnderecoComplemento());
        }
        
        // Bairro
        if (company.getEnderecoBairro() != null && !company.getEnderecoBairro().isEmpty()) {
            if (address.length() > 0) {
                address.append(" - ");
            }
            address.append(company.getEnderecoBairro());
        }
        
        // Cidade/Estado
        if (company.getCity() != null && !company.getCity().isEmpty()) {
            if (address.length() > 0) {
                address.append(" - ");
            }
            address.append(company.getCity());
            
            if (company.getState() != null && !company.getState().isEmpty()) {
                address.append("/").append(company.getState());
            }
        }
        
        // CEP
        if (company.getZipCode() != null && !company.getZipCode().isEmpty()) {
            if (address.length() > 0) {
                address.append(" - ");
            }
            String cep = formatZipCode(company.getZipCode());
            address.append(cep);
        }
        
        return address.toString();
    }
    
    /**
     * Formata CEP: XXXXX-XXX
     */
    public static String formatZipCode(String zipCode) {
        if (zipCode == null || zipCode.isEmpty()) {
            return "";
        }
        
        String digits = zipCode.replaceAll("[^0-9]", "");
        
        if (digits.length() == 8) {
            return String.format("%s-%s", digits.substring(0, 5), digits.substring(5, 8));
        }
        
        return zipCode;
    }
    
    /**
     * Formata texto completo do rodapÃ© da empresa
     * Formato: Nome | EndereÃ§o | Tel: XXX | Email: XXX
     */
    public static String formatCompanyFooter(Company company, boolean includeEmail) {
        if (company == null) {
            return "";
        }
        
        StringBuilder footer = new StringBuilder();
        
        // Nome da empresa
        if (company.getName() != null && !company.getName().isEmpty()) {
            footer.append(company.getName());
        }
        
        // EndereÃ§o
        String address = formatFullAddress(company);
        if (!address.isEmpty()) {
            if (footer.length() > 0) {
                footer.append(" | ");
            }
            footer.append(address);
        }
        
        // Telefone
        if (company.getPhone() != null && !company.getPhone().isEmpty()) {
            if (footer.length() > 0) {
                footer.append(" | ");
            }
            footer.append("Tel: ").append(formatPhone(company.getPhone()));
        }
        
        // Email
        if (includeEmail && company.getEmail() != null && !company.getEmail().isEmpty()) {
            if (footer.length() > 0) {
                footer.append(" | ");
            }
            footer.append("Email: ").append(company.getEmail());
        }
        
        return footer.toString();
    }
    
    /**
     * Formata CNPJ para exibiÃ§Ã£o no cabeÃ§alho
     * Retorna string vazia se CNPJ nÃ£o estiver disponÃ­vel
     */
    public static String formatCnpjForHeader(Company company) {
        if (company == null || company.getCnpj() == null || company.getCnpj().isEmpty()) {
            return "";
        }
        
        String formatted = formatCnpj(company.getCnpj());
        return formatted.isEmpty() ? "" : "CNPJ: " + formatted;
    }
}

