package com.quangnt0000.be_modul.controller.DataWH;

import com.quangnt0000.be_modul.service.DataWH.WareBatchActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ware-batch-action")
@RequiredArgsConstructor
public class WareBatchActionController {
    private final WareBatchActionService wareBatchActionService;


}
