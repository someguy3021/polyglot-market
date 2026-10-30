package dev.polyglot.spring27.seller;

import org.springframework.stereotype.Component;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import dev.polyglot.spring27.config.S3Props;

/** S3/MinIO: загрузка и удаление объектов (path-style, локальный endpoint). SDK v1 — эпоха Boot 2.7. */
@Component
public class S3Storage {

    private final AmazonS3 client;
    private final String bucket;

    public S3Storage(S3Props props) {
        this.bucket = props.bucket();
        this.client = AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(props.endpoint(), "us-east-1"))
                .withCredentials(new AWSStaticCredentialsProvider(
                        new BasicAWSCredentials(props.accessKey(), props.secretKey())))
                .withPathStyleAccessEnabled(true)
                .build();
    }

    public void put(String key, byte[] bytes, String contentType) {
        ObjectMetadataLite metadata = new ObjectMetadataLite(bytes.length, contentType);
        com.amazonaws.services.s3.model.PutObjectRequest request =
                new com.amazonaws.services.s3.model.PutObjectRequest(bucket, key, new java.io.ByteArrayInputStream(bytes), metadata);
        client.putObject(request);
    }

    public void remove(String key) {
        client.deleteObject(bucket, key);
    }

    /** Минимальный ObjectMetadata без лишних зависимостей от версии SDK. */
    private static class ObjectMetadataLite extends com.amazonaws.services.s3.model.ObjectMetadata {
        public ObjectMetadataLite(int length, String contentType) {
            setContentLength(length);
            setContentType(contentType);
        }
    }
}
