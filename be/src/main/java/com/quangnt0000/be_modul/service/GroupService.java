package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.repository.DataLake.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;

    public ResponseEntity<?> delete(String groupId) {
        groupRepository.deleteById(groupId);
        return ResponseEntity.ok("Deleted Group");
    }
}
