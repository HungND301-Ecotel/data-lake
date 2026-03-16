package com.quangnt0000.be_modul.utils;

import com.itextpdf.text.Font;
import com.itextpdf.text.pdf.BaseFont;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class FontUtils {
    private static final String FONT_DIR = "src/main/resources/fonts/";

    public Font getFont(String fontName, String fontStyle, int fontSize) {
        try {
            String fileName = resolveFontFile(fontName);
            BaseFont baseFont = BaseFont.createFont(
                    FONT_DIR + fileName,
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED
            );
            int fontStyle1 = parseStyle(fontStyle);

            return new Font(baseFont, fontSize, fontStyle1);
        } catch (Exception e) {
            e.printStackTrace();
            return new Font(Font.FontFamily.TIMES_ROMAN, fontSize, Font.NORMAL);
        }
    }

    private static String resolveFontFile(String fontName) {
        if (fontName == null) return "times.ttf";
        fontName = fontName.toLowerCase();

        if (fontName.contains("arial")) return "arial.ttf";
        if (fontName.contains("times")) return "times.ttf";
        if (fontName.contains("tahoma")) return "tahoma.ttf";
        if (fontName.contains("calibri")) return "calibri.ttf";
        if (fontName.contains("verdana")) return "verdana.ttf";
        if (fontName.contains("georgia")) return "georgia.ttf";

        return "times.ttf";
    }

    private static int parseStyle(String styleList) {
        if (styleList == null || styleList.trim().isEmpty()) return Font.NORMAL;

        List<String> styles = Arrays.stream(styleList.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .distinct()
                .toList();

        int combined = Font.NORMAL;

        if (styles.contains("BOLD")) combined |= Font.BOLD;
        if (styles.contains("ITALIC")) combined |= Font.ITALIC;
        if (styles.contains("UNDERLINE")) combined |= Font.UNDERLINE;
        if (styles.contains("STRIKETHRU") || styles.contains("STRIKETHROUGH")) combined |= Font.STRIKETHRU;

        return combined;
    }
}
