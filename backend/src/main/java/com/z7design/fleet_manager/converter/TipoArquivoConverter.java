package com.z7design.fleet_manager.converter;

import com.z7design.fleet_manager.model.ModeloDocumento;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TipoArquivoConverter implements AttributeConverter<ModeloDocumento.TipoArquivo, String> {
    
    @Override
    public String convertToDatabaseColumn(ModeloDocumento.TipoArquivo tipoArquivo) {
        if (tipoArquivo == null) {
            return null;
        }
        // Converter para minÃºsculas para corresponder Ã  constraint do banco
        return tipoArquivo.name().toLowerCase();
    }
    
    @Override
    public ModeloDocumento.TipoArquivo convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        // Converter de minÃºsculas para Enum
        return ModeloDocumento.TipoArquivo.fromString(dbData);
    }
}


