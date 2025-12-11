package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {
    private final S3Service s3Service;
    @GetMapping()
    public ResponseEntity<Resource> getFileKey(@RequestParam String fileKey){
        return s3Service.getFile(fileKey);
    }

    @GetMapping("/v2")
    public ResponseEntity<Resource> getFileV2(@RequestParam String fileKey){
        return s3Service.getFileV2(fileKey);
    }

    @GetMapping("/v3")
    public ResponseEntity<Resource> getFileV3(@RequestParam String fileKey){
        return s3Service.getFileV3(fileKey);
    }


}
