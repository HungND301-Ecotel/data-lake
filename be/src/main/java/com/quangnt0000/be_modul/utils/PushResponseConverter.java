package com.quangnt0000.be_modul.utils;

import com.quangnt0000.be_modul.dto.TWH_Push.PushResponse;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import tools.jackson.databind.ObjectMapper;

@Converter
public class PushResponseConverter
        implements AttributeConverter<PushResponse, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(PushResponse attribute) {
        if (attribute == null) return null;
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException("Convert PushResponse to JSON failed", e);
        }
    }

    @Override
    public PushResponse convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return objectMapper.readValue(dbData, PushResponse.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Convert JSON to PushResponse failed", e);
        }
    }
}

