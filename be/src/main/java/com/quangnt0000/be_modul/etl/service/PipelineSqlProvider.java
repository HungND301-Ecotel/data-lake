package com.quangnt0000.be_modul.etl.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import com.quangnt0000.be_modul.etl.entity.PipelineTaskConfigEntity;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class PipelineSqlProvider {
    private static final String SQL_CLASSPATH_PATTERN = "classpath*:nifi_sql/**/*.sql";

    // Map: targetTable -> nội dung SQL đã load sẵn
    private final Map<String, String> sqlCache = new ConcurrentHashMap<>();

    @PostConstruct
    void init() {
        loadAllSqlFiles();
    }

    private void loadAllSqlFiles() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources(SQL_CLASSPATH_PATTERN);

            for (Resource resource : resources) {
                String targetTable = extractTableName(resource.getFilename());
                String sql = readContent(resource);

                if (sqlCache.containsKey(targetTable)) {
                    throw new IllegalStateException(
                        "Trùng tên file SQL cho bảng: " + targetTable + " (kiểm tra lại thư mục nifi_sql/)");
                }
                sqlCache.put(targetTable, sql);
            }

            log.info("Đã load {} file SQL pipeline từ resource", sqlCache.size());
        } catch (IOException e) {
            throw new IllegalStateException("Không thể load các file SQL pipeline", e);
        }
    }

    private String extractTableName(String filename) {
        return filename.replace(".sql", "");
    }

    private String readContent(Resource resource) throws IOException {
        try (InputStream is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8).trim();
        }
    }

    public String build(PipelineTaskConfigEntity config) {
        String targetTable = config.getTargetTable();
        String sql = sqlCache.get(targetTable);

        if (sql == null) {
            throw new IllegalArgumentException("Không tìm thấy file SQL cho bảng: " + targetTable);
        }
        return sql;
    }

    // Dùng khi có git-sync/volume reload — gọi lại nếu cần refresh runtime
    public void reload() {
        sqlCache.clear();
        loadAllSqlFiles();
    }
}
