package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.dto.TWH_Auth.LoginRequest;
import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.TWH_Get.GetResponse;
import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import com.quangnt0000.be_modul.service.DataWH.WareApiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/ware-api")
@RequiredArgsConstructor
public class WareApiController {
    private final WareApiService wareApiService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return wareApiService.health();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return wareApiService.login(request);
    }

    @GetMapping("/master-data")
    public Mono<ResponseEntity<GetResponse>> getMasterData(@Valid @RequestBody GetRequest request) {
        return wareApiService.getMasterData(request);
    }

    @PostMapping("/push")
    public Mono<ResponseEntity<Object>> push(@Valid @RequestBody PushRequest request) {
        return wareApiService.push(request, null, null)
                .flatMap(pushResponse ->
                        wareApiService.insertToDataLake(request)
                                .thenReturn(pushResponse)
                );
    }

    @PostMapping("/get")
    public ResponseEntity<Object> get(@Valid @RequestBody GetRequest request) {
        return wareApiService.get(request);
    }
}
