package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.dto.SyncConnectionConfig.SyncConnectionConfigRequest;
import com.quangnt0000.be_modul.dto.SyncConnectionConfig.SyncConnectionConfigResponse;
import com.quangnt0000.be_modul.exception.ApplicationException;
import com.quangnt0000.be_modul.modal.Data.SyncConnectionConfig;
import com.quangnt0000.be_modul.repository.SyncConnectionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncConnectionConfigService {

    private final SyncConnectionConfigRepository configRepository;
    private final ModelMapper modelMapper;

    public List<SyncConnectionConfigResponse> getAll() {
        List<SyncConnectionConfig> syncConnectionConfigs = configRepository.findAll().stream()
                .filter(config -> config.getIsDeleted() == null || config.getIsDeleted() != 1)
                .toList();
        return modelMapper.map(syncConnectionConfigs, new TypeToken<List<SyncConnectionConfigResponse>>() {
        }.getType());
    }


    public SyncConnectionConfigResponse create(SyncConnectionConfigRequest request) {
        boolean existed = configRepository.existsActiveConnection(
                request.getHost(),
                request.getPort(),
                request.getDatabaseName()
        );

        if (existed) {
            throw new ApplicationException("Connection đã tồn tại");
        }

        SyncConnectionConfig syncConnectionConfig = modelMapper.map(request, SyncConnectionConfig.class);
        syncConnectionConfig.setIsDeleted(0);
        configRepository.save(syncConnectionConfig);
        return modelMapper.map(syncConnectionConfig, SyncConnectionConfigResponse.class);

    }

    public SyncConnectionConfigResponse update(SyncConnectionConfigRequest request, String id) {

      SyncConnectionConfig syncConnectionConfig = configRepository.findById(id)
              .orElseThrow(()-> new ApplicationException("Không tồn tại Connection"));

        boolean existed = configRepository.existsActiveConnectionExcludingId(
                request.getHost(),
                request.getPort(),
                request.getDatabaseName(),
                id
        );

        if (existed) {
            throw new ApplicationException("Connection đã tồn tại");
        }

        modelMapper.map(request, syncConnectionConfig);
        syncConnectionConfig = configRepository.save(syncConnectionConfig);
        return modelMapper.map(
                syncConnectionConfig,
                SyncConnectionConfigResponse.class
        );
    }

    public SyncConnectionConfigResponse deleteById(String id) {

        SyncConnectionConfig syncConnectionConfig = configRepository.findById(id)
                .orElseThrow(()-> new ApplicationException("Không tồn tại Connection"));

        configRepository.delete(syncConnectionConfig);
        return modelMapper.map(syncConnectionConfig, SyncConnectionConfigResponse.class);
    }
}
