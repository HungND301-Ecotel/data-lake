package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.User.LoginResponse;
import com.quangnt0000.be_modul.dto.User.UserLogin;
import com.quangnt0000.be_modul.dto.User.UserRequest;
import com.quangnt0000.be_modul.dto.User.UserResponse;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class UserService {
    @Value("${jwt.secret}")
    private String secretKey;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    public ResponseEntity<?> addUser(UserRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .employee(employee)
                .build();
        user = userRepository.save(user);
        return ResponseEntity.ok(user.getId());
    }

    public ResponseEntity<?> updateUser(UserRequest request) {
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername(request.getUsername());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());
        user = userRepository.save(user);
        return ResponseEntity.ok(user.getId());
    }

    public ResponseEntity<?> login(UserLogin request) {
        User user = userRepository.findByUsernameAndStatusTrue(request.getUsername());
        if(passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            long expiration = 1000 * 60 * 60 * 24;
            SecretKey key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secretKey));
            String token = Jwts.builder()
                    .setSubject(user.getId())
                    .claim("role", user.getRole())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + expiration))
                    .signWith(key, SignatureAlgorithm.HS512)
                    .compact();
            String refreshToken = Jwts.builder()
                    .setSubject(user.getId())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + expiration))
                    .signWith(key, SignatureAlgorithm.HS512)
                    .compact();
            LoginResponse loginResponse = LoginResponse.builder()
                    .token(token)
                    .role(user.getRole())
                    .refreshToken(refreshToken)
                    .build();
            return ResponseEntity.ok(loginResponse);
        }

        return ResponseEntity.ok("Invalid username or password");
    }

    public ResponseEntity<?> getUserByEmployeeId(String employeeId) {
        User user = userRepository.findByEmployee_Id(employeeId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
        return ResponseEntity.ok(userResponse);
    }
}
