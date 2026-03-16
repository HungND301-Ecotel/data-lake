package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/group")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;

    @DeleteMapping("/{group-id}")
    public ResponseEntity<?> delete(@PathVariable ("group-id") String groupId) {
        return groupService.delete(groupId);
    }
}
