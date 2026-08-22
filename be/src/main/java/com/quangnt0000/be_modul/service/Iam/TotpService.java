package com.quangnt0000.be_modul.service.Iam;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Mã một lần theo thời gian (TOTP, RFC 6238) cho MFA - UC01.02.
 *
 * <p>Cài đặt trực tiếp bằng HmacSHA1 của JDK để không phải thêm thư viện ngoài;
 * tham số mặc định (30 giây, 6 chữ số, SHA-1) tương thích Google Authenticator,
 * Microsoft Authenticator và các ứng dụng OTP phổ biến.
 */
@Service
public class TotpService {

    private static final int DIGITS = 6;
    private static final int PERIOD_SECONDS = 30;
    /** Chấp nhận lệch một chu kỳ trước/sau để bù sai lệch đồng hồ. */
    private static final int WINDOW = 1;
    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private final SecureRandom random = new SecureRandom();

    /** Sinh khoá base32 20 byte (160 bit) theo khuyến nghị của RFC 4226. */
    public String generateSecret() {
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return base32Encode(bytes);
    }

    /** URI để hiển thị mã QR trong ứng dụng xác thực. */
    public String buildOtpAuthUri(String issuer, String accountName, String secret) {
        return "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d"
                .formatted(urlEncode(issuer), urlEncode(accountName), secret,
                        urlEncode(issuer), DIGITS, PERIOD_SECONDS);
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        String normalized = code.trim().replace(" ", "");
        if (normalized.length() != DIGITS || !normalized.chars().allMatch(Character::isDigit)) {
            return false;
        }
        long counter = Instant.now().getEpochSecond() / PERIOD_SECONDS;
        for (int offset = -WINDOW; offset <= WINDOW; offset++) {
            if (constantTimeEquals(generate(secret, counter + offset), normalized)) {
                return true;
            }
        }
        return false;
    }

    String generate(String secret, long counter) {
        try {
            byte[] key = base32Decode(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("Không sinh được mã TOTP", e);
        }
    }

    /** So sánh không phụ thuộc thời gian để tránh tấn công đo thời gian. */
    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            diff |= a.charAt(i) ^ b.charAt(i);
        }
        return diff == 0;
    }

    static String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                result.append(BASE32.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            result.append(BASE32.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return result.toString();
    }

    static byte[] base32Decode(String encoded) {
        String clean = encoded.trim().replace("=", "").toUpperCase();
        int outputLength = clean.length() * 5 / 8;
        byte[] result = new byte[outputLength];
        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;
        for (char c : clean.toCharArray()) {
            int value = BASE32.indexOf(c);
            if (value < 0) {
                throw new IllegalArgumentException("Khoá base32 không hợp lệ");
            }
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return result;
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
