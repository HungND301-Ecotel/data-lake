package com.quangnt0000.be_modul.config;

import io.netty.channel.ChannelOption;
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

@Configuration
public class WebClientConfig {

    @Value("${datalake.base-url:http://1.53.45.49:1313}")
    private String dataLakeBaseUrl;

    @Bean
    @Qualifier("vinacominWebClient")
    public WebClient webClient() {
        String baseUrl = "http://dev-apidatabi.vinacomin.vn/";
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
}
