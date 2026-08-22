package com.quangnt0000.be_modul.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class S3Config {
    @Value("${aws.accessKeyId}")
    private String accessKeyId;

    @Value("${aws.secretAccessKey}")
    private String secretAccessKey;

    @Value("${aws.region}")
    private String region;

    /**
     * Endpoint tự đặt cho object storage triển khai tại chỗ (MinIO, Ceph RGW).
     * Bỏ trống thì dùng endpoint AWS mặc định.
     *
     * <p>Tài liệu giải pháp mục 3.1 chọn Object Storage on-premise nói giao thức
     * S3, nên đây là cấu hình cho môi trường thật chứ không phải tiện ích test.
     */
    @Value("${aws.s3.endpoint:}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        AwsCredentials awsCredentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(awsCredentials));

        if (endpoint != null && !endpoint.isBlank()) {
            // Object storage tại chỗ thường không hỗ trợ virtual-host style.
            builder.endpointOverride(URI.create(endpoint)).forcePathStyle(true);
        }
        return builder.build();
    }
}
