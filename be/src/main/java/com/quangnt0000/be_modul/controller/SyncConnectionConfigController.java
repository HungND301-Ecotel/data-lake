package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.common.BaseResponse;
import com.quangnt0000.be_modul.dto.SyncConnectionConfig.SyncConnectionConfigRequest;
import com.quangnt0000.be_modul.dto.SyncConnectionConfig.SyncConnectionConfigResponse;
import com.quangnt0000.be_modul.service.SyncConnectionConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/sync_connection_configs")
public class SyncConnectionConfigController {

    private final SyncConnectionConfigService configService;

    @GetMapping
    public ResponseEntity<BaseResponse<List<SyncConnectionConfigResponse>>> getAll(){
        return ResponseEntity.status(HttpStatus.OK)
                .body(new BaseResponse<>(configService.getAll(), "Success"));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<SyncConnectionConfigResponse>> create(@RequestBody SyncConnectionConfigRequest request){
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new BaseResponse<>(configService.create(request), "Created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<SyncConnectionConfigResponse>> update(@RequestBody SyncConnectionConfigRequest request, @PathVariable String id){
        return ResponseEntity.status(HttpStatus.OK)
                .body(new BaseResponse<>(configService.update(request, id), "Updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<SyncConnectionConfigResponse>> deleteById(@PathVariable String id){
        return ResponseEntity.status(HttpStatus.OK)
                .body(new BaseResponse<>(configService.deleteById(id), "Deleted successfully"));
    }

}
