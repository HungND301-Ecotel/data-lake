package com.quangnt0000.be_modul.config;

import com.quangnt0000.be_modul.security.TokenRevocationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    @Value("${jwt.secret}")
    private String secretKey;

    private final CorsConfigurationSource corsConfigurationSource;
    private final TokenRevocationFilter tokenRevocationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static final String[] PUBLIC_ENDPOINTS = {
            "/user/login",
            "/iam/auth/login",
            "/iam/auth/mfa/verify",
            "/iam/auth/refresh",
            "/iam/auth/token",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",

    };
    private static final String[] PUBLIC_ENDPOINTS_GET = {

    };
    private static final String[] PUBLIC_ENDPOINTS_POST = {
            "/user/login",
            "/iam/auth/login",
            "/iam/auth/mfa/verify",
            "/iam/auth/refresh",
            "/iam/auth/token"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, PUBLIC_ENDPOINTS_GET).permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS_POST).permitAll()
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                )

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                )
                // Chữ ký hợp lệ chưa đủ: token phát trước lần thu hồi gần nhất
                // phải bị từ chối ngay (UC01.05).
                .addFilterAfter(tokenRevocationFilter, BasicAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        byte[] decodedKey = Base64.getDecoder().decode(secretKey);
        SecretKey key = new SecretKeySpec(decodedKey, "HmacSHA512");

        return NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    /**
     * Sinh authority từ ba nguồn để vừa giữ tương thích vừa hỗ trợ phân quyền
     * theo quyền hạt nhỏ:
     * <ul>
     *   <li>{@code role} (chuỗi cũ) và {@code roles} → {@code ROLE_*};</li>
     *   <li>{@code perms} → authority nguyên bản, dùng cho
     *       {@code hasAuthority('data.upload')}.</li>
     * </ul>
     */
    @Bean
    public Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(SecurityConfig::extractAuthorities);
        return converter;
    }

    private static Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        Object legacyRole = jwt.getClaim("role");
        if (legacyRole instanceof String value && !value.isBlank()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + value.toUpperCase()));
        }

        for (String role : claimAsList(jwt, "roles")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
        }
        for (String permission : claimAsList(jwt, "perms")) {
            authorities.add(new SimpleGrantedAuthority(permission));
        }
        return authorities;
    }

    private static List<String> claimAsList(Jwt jwt, String name) {
        Object claim = jwt.getClaim(name);
        if (claim instanceof Collection<?> collection) {
            return collection.stream().filter(java.util.Objects::nonNull)
                    .map(Object::toString).toList();
        }
        if (claim instanceof String value && !value.isBlank()) {
            return List.of(value.split("[,\\s]+"));
        }
        return List.of();
    }
}
