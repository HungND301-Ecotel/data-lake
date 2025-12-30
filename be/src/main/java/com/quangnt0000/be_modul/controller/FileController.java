package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.dto.FileResponse;
import com.quangnt0000.be_modul.dto.ReportDTO;
import com.quangnt0000.be_modul.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping("/upload")
    public FileResponse uploadFile(@ModelAttribute MultipartFile file){
        return s3Service.uploadFile("storage", file);
    }

}
