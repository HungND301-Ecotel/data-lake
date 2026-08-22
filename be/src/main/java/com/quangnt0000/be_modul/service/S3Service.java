package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.dto.FileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {
    @Value("${aws.s3.bucket}")
    private String bucket;

    private final S3Client s3Client;

    public FileResponse uploadFile(String key, MultipartFile file) {
        try {
            String originalFileName = file.getOriginalFilename();
            String extension = "";

            assert originalFileName != null;
            int dotIndex = originalFileName.lastIndexOf(".");
            if (dotIndex > 0) {
                extension = originalFileName.substring(dotIndex);
            }
            String randomFileName = UUID.randomUUID() + extension;
            key = key.replace("*", "/");
            String fileName = key + "/" + randomFileName;
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
            return FileResponse.builder()
                    .key(fileName)
                    .type(file.getContentType())
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * Tải lên nội dung đã có trong bộ nhớ, dùng cho tệp do hệ thống sinh ra
     * (bản render báo cáo) thay vì tệp người dùng gửi lên.
     */
    public FileResponse uploadBytes(String key, byte[] content, String contentType,
                                    String fileName) {
        try {
            String prefix = key.replace("*", "/");
            String objectKey = prefix + "/" + UUID.randomUUID() + "-" + fileName;
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content));
            return FileResponse.builder()
                    .key(objectKey)
                    .type(contentType)
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /** Đọc toàn bộ nội dung một object thành mảng byte. */
    public byte[] readBytes(String fileKey) {
        try {
            String key = fileKey.replace("*", "/");
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            try (ResponseInputStream<GetObjectResponse> stream =
                         s3Client.getObject(getObjectRequest)) {
                return stream.readAllBytes();
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Không đọc được tệp: " + fileKey);
        }
    }

    public ResponseEntity<String> deleteFile(String key) {
        try{
            key = key.replace("*", "/");
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            return ResponseEntity.ok("Successfully deleted file " + key);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Delete False:" + e.getMessage());
        }

    }

    public ResponseEntity<Resource> getFile(String fileKey) {
        try {
            InputStream inputStream = s3Client.getObject(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(fileKey)
                            .build()
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileKey.substring(fileKey.lastIndexOf("/") + 1) + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new InputStreamResource(inputStream));

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    public ResponseEntity<Resource> getFileV2(String fileKey) {
        try {
            ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(fileKey)
                            .build()
            );

            String fileName = fileKey.substring(fileKey.lastIndexOf("/") + 1);
            String contentType = getContentTypeFromExtension(fileKey);

            InputStreamResource resource = new InputStreamResource(s3Object);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String getContentTypeFromExtension(String fileKey) {
        String extension = fileKey.substring(fileKey.lastIndexOf('.') + 1).toLowerCase();

        return switch (extension) {
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "xls" -> "application/vnd.ms-excel";
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "doc" -> "application/msword";
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "txt" -> "text/plain";
            default -> "application/octet-stream"; // mặc định
        };
    }


    public ResponseEntity<Resource> getFileV3(String fileKey) {
        try {
            InputStream inputStream = s3Client.getObject(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(fileKey)
                            .build()
            );

            String fileName = fileKey.substring(fileKey.lastIndexOf("/") + 1);

            String contentType = fileName.endsWith(".xlsx")
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "application/vnd.ms-excel";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(new InputStreamResource(inputStream));

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }




}
