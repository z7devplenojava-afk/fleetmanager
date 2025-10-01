package br.com.fleetmanager.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<String> stringList) {
        if (stringList == null || stringList.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(stringList);
        } catch (JsonProcessingException e) {
            // Lidar com o erro, talvez lançar uma RuntimeException ou logar
            throw new RuntimeException("Erro ao converter List<String> para JSON String", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String string) {
        if (string == null || string.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(string, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (IOException e) {
            // Lidar com o erro
            throw new RuntimeException("Erro ao converter JSON String para List<String>", e);
        }
    }
}
