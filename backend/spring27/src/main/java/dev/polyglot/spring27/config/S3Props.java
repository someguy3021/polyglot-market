package dev.polyglot.spring27.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * S3/MinIO конфиг из корневого .env. urlBase может отличаться от эндпоинта загрузки
 * (в k8s-стенде pod пишет в service, браузер читает через проброс) — как в NestJS.
 */
@Component
public class S3Props {

    private final String endpoint;
    private final String bucket;
    private final String accessKey;
    private final String secretKey;
    private final String urlBase;

    public S3Props(@Value("${s3.endpoint}") String endpoint,
            @Value("${s3.bucket}") String bucket,
            @Value("${s3.access-key}") String accessKey,
            @Value("${s3.secret-key}") String secretKey,
            @Value("${s3.url-base:}") String urlBase) {
        this.endpoint = endpoint;
        this.bucket = bucket;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.urlBase = urlBase;
    }

    public String endpoint() {
        return endpoint;
    }

    public String bucket() {
        return bucket;
    }

    public String accessKey() {
        return accessKey;
    }

    public String secretKey() {
        return secretKey;
    }

    /** База публичных URL картинок: S3_URL_BASE или endpoint/bucket. */
    public String publicUrlBase() {
        String base = urlBase == null || urlBase.trim().isEmpty() ? endpoint + "/" + bucket : urlBase;
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
