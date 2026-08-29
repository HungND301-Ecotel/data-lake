package com.quangnt0000.be_modul.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.SSLException;

@Configuration
public class WebClientConfig {

    @Value("${datalake.base-url:http://113.22.123.208:1313}")
    private String dataLakeBaseUrl;

    @Bean
    @Qualifier("vinacominWebClient")
    public WebClient webClient() {
        String baseUrl = "https://apidatabi.vinacomin.vn";
        int connectionTimeout = 5000;
        int readTimeout = 10000;

        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectionTimeout)
                .responseTimeout(Duration.ofMillis(readTimeout))
                .doOnConnected(conn ->
                    conn.addHandlerLast("readTimeoutHandler", new ReadTimeoutHandler(readTimeout, TimeUnit.MILLISECONDS))
                        .addHandlerLast("writeTimeoutHandler", new WriteTimeoutHandler(readTimeout, TimeUnit.MILLISECONDS))
                );

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    @Bean
    @Qualifier("dataLakeWebClient")
    public WebClient dataLakeWebClient() {
        return WebClient.builder()
                .baseUrl(dataLakeBaseUrl)
                .build();
    }

    @Bean
    @Qualifier("nifiWebClient")
    public WebClient nifiWebClient() {
            String nifiBaseUrl = "https://localhost:8443/nifi-api/";
            try {
                    SslContext sslContext = SslContextBuilder.forClient()
                                    .trustManager(InsecureTrustManagerFactory.INSTANCE)
                                    .build();

                    HttpClient httpClient = HttpClient.create()
                                    .secure(spec -> spec.sslContext(sslContext));

                    return WebClient.builder()
                                    .baseUrl(nifiBaseUrl)
                                    .clientConnector(new ReactorClientHttpConnector(httpClient))
                                    .build();

            } catch (SSLException e) {
                    throw new RuntimeException(e);
            }
    }
}
