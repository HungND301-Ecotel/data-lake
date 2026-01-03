package com.quangnt0000.be_modul.utils;

import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import tools.jackson.databind.ObjectMapper;

@Converter
public class PushRequestConverter
        implements AttributeConverter<PushRequest, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(PushRequest attribute) {
        if (attribute == null) return null;
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException("Convert PushRequest to JSON failed", e);
        }
    }

    @Override
    public PushRequest convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return objectMapper.readValue(dbData, PushRequest.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Convert JSON to PushRequest failed", e);
        }
    }
}

