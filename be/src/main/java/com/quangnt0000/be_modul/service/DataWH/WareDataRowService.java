package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.WareDataRow.WareDataRowResponse;
import com.quangnt0000.be_modul.dto.WareDataRow.WareDataRowSearch;
import com.quangnt0000.be_modul.modal.DataWH.WareDataRow;
import com.quangnt0000.be_modul.repository.DataWH.WareDataRowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class WareDataRowService {
    private final WareDataRowRepository wareDataRowRepository;

    public ResponseEntity<?> get(WareDataRowSearch request) {
        List<WareDataRow> wareDataRows = wareDataRowRepository.findByWareBatch_Id(request.getWareBatchId());
        List<WareDataRowResponse> responses = wareDataRows.stream()
                .map(
                        item -> WareDataRowResponse.builder()
                                .id(item.getId())
                                .wareBatchId(item.getWareBatch().getId())
                                .data(item.getData())
                                .createdAt(item.getCreatedAt())
                                .updatedAt(item.getUpdatedAt())
                                .build()
                )
                .toList();
        return ResponseEntity.ok(responses);
    }

    public ResponseEntity<?> search(WareDataRowSearch request) {
        Sort sort = request.getSort().equals("ASC") ? Sort.by(request.getSortBy()).ascending() : Sort.by(request.getSortBy()).descending();
        Pageable pageable = PageRequest.of(request.getPage(), request.getLimit(), sort);
        Page<WareDataRow> wareDataRows = wareDataRowRepository.search(request.getKeyword(), request.getWareBatchId(), pageable);
        List<WareDataRowResponse> wareDataRowResponses = wareDataRows.getContent().stream().map(
                item -> WareDataRowResponse.builder()
                        .id(item.getId())
                        .wareBatchId(item.getWareBatch().getId())
                        .data(item.getData())
                        .createdAt(item.getCreatedAt())
                        .updatedAt(item.getUpdatedAt())
                        .build()
        ).toList();
        return ResponseEntity.ok(PageResponse.builder()
                        .page(request.getPage())
                        .limit(request.getLimit())
                        .totalElements((int) wareDataRows.getTotalElements())
                        .totalPages(wareDataRows.getTotalPages())
                        .content(wareDataRowResponses)
                .build());
    }
}
