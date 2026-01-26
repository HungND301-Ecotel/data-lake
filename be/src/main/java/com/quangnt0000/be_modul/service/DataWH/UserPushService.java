package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.UserPush.UserPushRequest;
import com.quangnt0000.be_modul.dto.UserPush.UserPushResponse;
import com.quangnt0000.be_modul.modal.DataWH.UserPush;
import com.quangnt0000.be_modul.repository.DataWH.UserPushRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPushService {

    private final UserPushRepository userPushRepository;
    private final PasswordEncoder passwordEncoder;

    public UserPushResponse create(UserPushRequest request) {
        if (userPushRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        UserPush userPush = UserPush.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .build();

        UserPush saved = userPushRepository.save(userPush);

        return UserPushResponse.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .password(saved.getPassword())
                .build();
    }

    public List<UserPushResponse> getAll() {
        return userPushRepository.findAll().stream()
                .map(user -> UserPushResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .build())
                .collect(Collectors.toList());
    }

    public UserPushResponse getById(String id) {
        UserPush userPush = userPushRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return UserPushResponse.builder()
                .id(userPush.getId())
                .username(userPush.getUsername())
                .password(userPush.getPassword())
                .build();
    }

    public UserPushResponse getByUsername(String username) {
        UserPush userPush = userPushRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return UserPushResponse.builder()
                .id(userPush.getId())
                .username(userPush.getUsername())
                .password(userPush.getPassword())
                .build();
    }

    public UserPushResponse update(String id, UserPushRequest request) {
        UserPush userPush = userPushRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Check username uniqueness if changed
        if (!userPush.getUsername().equals(request.getUsername())
                && userPushRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        userPush.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            userPush.setPassword(request.getPassword());
        }

        UserPush updated = userPushRepository.save(userPush);

        return UserPushResponse.builder()
                .id(updated.getId())
                .username(updated.getUsername())
                .password(userPush.getPassword())
                .build();
    }

    public void delete(String id) {
        if (!userPushRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userPushRepository.deleteById(id);
    }
}