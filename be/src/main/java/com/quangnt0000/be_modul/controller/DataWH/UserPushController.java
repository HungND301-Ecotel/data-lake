package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.UserPush.UserPushRequest;
import com.quangnt0000.be_modul.dto.UserPush.UserPushResponse;
import com.quangnt0000.be_modul.service.DataWH.UserPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-push")
@RequiredArgsConstructor
public class UserPushController {

    private final UserPushService userPushService;

    @PostMapping
    public ResponseEntity<UserPushResponse> create(@RequestBody UserPushRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userPushService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<UserPushResponse>> getAll() {
        return ResponseEntity.ok(userPushService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserPushResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(userPushService.getById(id));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserPushResponse> getByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userPushService.getByUsername(username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserPushResponse> update(
            @PathVariable String id,
            @RequestBody UserPushRequest request) {
        return ResponseEntity.ok(userPushService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userPushService.delete(id);
        return ResponseEntity.noContent().build();
    }
}