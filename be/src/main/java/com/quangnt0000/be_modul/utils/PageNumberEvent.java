package com.quangnt0000.be_modul.utils;

import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfPageEventHelper;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

@Service
public class PageNumberEvent extends PdfPageEventHelper {

    @Override
    public void onEndPage(PdfWriter writer, Document document) {
        PdfContentByte cb = writer.getDirectContent();

        BaseFont bf = null;
        try {
            bf = BaseFont.createFont("src/main/resources/fonts/times.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } catch (Exception e) {
            e.printStackTrace();
        }

        int pageNumber = writer.getPageNumber();

        float x = (document.right() + document.left()) / 2;
        float y = document.bottom() - 10;

        cb.beginText();
        cb.setFontAndSize(bf, 12);
        cb.showTextAligned(Element.ALIGN_CENTER, String.valueOf(pageNumber), x, y, 0);
        cb.endText();
    }
}

