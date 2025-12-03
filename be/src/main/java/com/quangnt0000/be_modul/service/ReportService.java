package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.dto.*;
import com.quangnt0000.be_modul.modal.*;
import com.quangnt0000.be_modul.modal.Data.*;
import com.quangnt0000.be_modul.repository.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ModelMapper modelMapper;
    private final ReportRepository reportRepository;
    private final ReportItemRepository reportItemRepository;
    private final DataRepository dataRepository;
    private final TableRepository tableRepository;
    private final TextRepository textRepository;
    private final TableItemRepository tableItemRepository;
    private final SubRepository subRepository;
    private final FieldRepository fieldRepository;
    private final FilterRepository filterRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public ResponseEntity<?> createReport(ReportDTO request) {
        ReportEntity report = modelMapper.map(request, ReportEntity.class);
        for (ReportItemEntity reportItem : report.getItems()) {
            if (reportItem.getId().startsWith("new-")) {
                reportItem.setId(null);
            }
        }
        report = reportRepository.save(report);
        if (report.getItems() == null) {
            return ResponseEntity.ok(report.getId());
        }
        for(ReportItemDTO reportItemDTO : request.getItems()){
            ReportItemEntity reportItem = modelMapper.map(reportItemDTO, ReportItemEntity.class);
            reportItem.setReport(report);
            if (reportItem.getId().startsWith("new-")) {
                reportItem.setId(null);
            }
            reportItemRepository.save(reportItem);
            if(reportItem.getType().equals("table")){
                ObjectMapper objectMapper = new ObjectMapper();
                TableDTO tableDTO = objectMapper.convertValue(
                        reportItemDTO.getObject(),
                        new TypeReference<TableDTO>() {}
                );
                TableEntity table = modelMapper.map(tableDTO, TableEntity.class);
                if (table.getId().startsWith("new-")) {
                    table.setId(null);
                }
                table.setReportItemId(reportItem.getId());
                table = tableRepository.save(table);
                for (TableItemEntity tableItemEntity : table.getColumns()){
                    tableItemEntity.setTable(table);
                    tableItemRepository.save(tableItemEntity);
                }
            }
            if(reportItem.getType().equals("data")){
                ObjectMapper objectMapper = new ObjectMapper();
                DataDTO data = objectMapper.convertValue(
                        reportItemDTO.getObject(),
                        new TypeReference<DataDTO>() {}
                );
                DataEntity dataReport = modelMapper.map(data, DataEntity.class);
                if (dataReport.getId().startsWith("new-")) {
                    dataReport.setId(null);
                }
                dataReport.setReportItemId(reportItem.getId());
                dataRepository.save(dataReport);
                List<SubDTO> subDTOs = data.getSubs();
                for(SubDTO subDTO : subDTOs){
                    SubEntity subEntity = modelMapper.map(subDTO, SubEntity.class);
                    subEntity.setData(dataReport);
                    subRepository.save(subEntity);
                }
                List<FieldDTO> fieldDTOs = data.getFields();
                for (FieldDTO fieldDTO : fieldDTOs){
                    FieldEntity fieldEntity = modelMapper.map(fieldDTO, FieldEntity.class);
                    fieldEntity.setData(dataReport);
                    fieldRepository.save(fieldEntity);
                }
                List<FilterDTO> filterDTOs = data.getFilters();
                for (FilterDTO filterDTO : filterDTOs){
                    FilterEntity filterEntity = modelMapper.map(filterDTO, FilterEntity.class);
                    filterEntity.setData(dataReport);
                    filterRepository.save(filterEntity);
                }
                List<OrderDTO> orderDTOs = data.getOrders();
                for (OrderDTO orderDTO : orderDTOs){
                    OrderEntity orderEntity = modelMapper.map(orderDTO, OrderEntity.class);
                    orderEntity.setData(dataReport);
                    orderRepository.save(orderEntity);
                }
            }
            if(reportItem.getType().equals("text")){
                ObjectMapper objectMapper = new ObjectMapper();
                TextDTO textDTO = objectMapper.convertValue(
                        reportItemDTO.getObject(),
                        new TypeReference<TextDTO>() {}
                );
                TextEntity text = modelMapper.map(textDTO, TextEntity.class);
                if(text.getId().startsWith("new-")) {
                    text.setId(null);
                }
                text.setReportItemId(reportItem.getId());
                textRepository.save(text);
            }
        }
        return ResponseEntity.ok(report.getId());
    }

    public ResponseEntity<?> getAllReports() {
        List<ReportEntity> reports = reportRepository.findAll();
        List<ReportDTO> reportDTOs = reports.stream().map(
                reportEntity -> ReportDTO.builder()
                        .id(reportEntity.getId())
                        .name(reportEntity.getName())
                        .pageType(reportEntity.getPageType())
                        .marginBottom(reportEntity.getMarginBottom())
                        .marginLeft(reportEntity.getMarginLeft())
                        .marginRight(reportEntity.getMarginRight())
                        .marginTop(reportEntity.getMarginTop())
                        .build()
        ).toList();
        return ResponseEntity.ok(reportDTOs);
    }

    public ResponseEntity<?> getReportById(String reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        ReportDTO response = modelMapper.map(report, ReportDTO.class);
        if (report.getItems() == null) {
            return ResponseEntity.ok(response);
        }
        for(ReportItemDTO reportItemDTO : response.getItems()){
            if (reportItemDTO.getType().equals("text")){
                TextEntity text = textRepository.findByReportItemId(reportItemDTO.getId());
                TextDTO textDTO = modelMapper.map(text, TextDTO.class);
                reportItemDTO.setObject(textDTO);
            }
            if (reportItemDTO.getType().equals("data")){
                DataEntity data = dataRepository.findByReportItemId(reportItemDTO.getId());
                DataDTO dataDTO = modelMapper.map(data, DataDTO.class);
                reportItemDTO.setObject(dataDTO);
            }
            if (reportItemDTO.getType().equals("table")){
                TableEntity table = tableRepository.findByReportItemId(reportItemDTO.getId());
                TableDTO tableDTO = modelMapper.map(table, TableDTO.class);
                reportItemDTO.setObject(tableDTO);
            }
        }
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> deleteReportById(String reportId) {
        List<ReportItemEntity> reportItems = reportItemRepository.findByReport_Id(reportId);
        for (ReportItemEntity reportItem : reportItems) {
            if (reportItem.getType().equals("text")){
                textRepository.deleteByReportItemId(reportItem.getId());
            }
            if (reportItem.getType().equals("data")){
                dataRepository.deleteByReportItemId(reportItem.getId());
            }
            if (reportItem.getType().equals("table")){
                tableRepository.deleteByReportItemId(reportItem.getId());
            }
        }
        reportRepository.deleteById(reportId);
        return ResponseEntity.ok("Delete success");
    }
}
