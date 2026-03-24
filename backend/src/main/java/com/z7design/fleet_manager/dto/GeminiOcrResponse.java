package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiOcrResponse {
    
    @JsonProperty("document_type")
    private String documentType;
    
    @JsonProperty("cpf")
    private String cpf;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("period")
    private String period;
    
    @JsonProperty("value_liquid")
    private String valueLiquid;
    
    @JsonProperty("company_name")
    private String companyName;
    
    @JsonProperty("company_cnpj")
    private String companyCnpj;
    
    @JsonProperty("sector")
    private String sector;
    
    @JsonProperty("items_earnings")
    private List<Item> itemsEarnings;
    
    @JsonProperty("items_deductions")
    private List<Item> itemsDeductions;
    
    @JsonProperty("page_continues")
    private Boolean pageContinues;
    
    @JsonProperty("confidence")
    private Double confidence;
    
    // Campo para armazenar o texto completo extraÃ­do do OCR (usado principalmente pelo Tesseract)
    private String fullText;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        @JsonProperty("code")
        private String code;
        
        @JsonProperty("desc")
        private String description;
        
        @JsonProperty("value")
        private String value;
    }
}


