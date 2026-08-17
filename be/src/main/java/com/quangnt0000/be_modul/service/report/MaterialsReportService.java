package com.quangnt0000.be_modul.service.report;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.quangnt0000.be_modul.dto.report.CoalConsumptionDataDTO;
import com.quangnt0000.be_modul.dto.report.CoalConsumptionRowDTO;
import com.quangnt0000.be_modul.dto.report.CoalReportDataDTO;
import com.quangnt0000.be_modul.dto.report.CoalReportRowDTO;
import com.quangnt0000.be_modul.repository.report.MaterialsReportRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MaterialsReportService {
        private final MaterialsReportRepository repository;

        public List<CoalReportRowDTO> buildFullReport(String unitCode, Integer year, Integer month) {
                List<CoalReportDataDTO> rawData = repository.getReportData(unitCode, year, month);

                Map<String, List<CoalReportDataDTO>> grouped = rawData.stream()
                                .collect(Collectors.groupingBy(CoalReportDataDTO::getProductCode));

                List<CoalReportRowDTO> result = new ArrayList<>();

                for (Map.Entry<String, List<CoalReportDataDTO>> entry : grouped.entrySet()) {
                        String productCode = entry.getKey();
                        List<CoalReportDataDTO> rows = entry.getValue();

                        CoalReportRowDTO row = new CoalReportRowDTO();
                        row.setProductCode(productCode);
                        row.setProductName(rows.get(0).getProductName());
                        row.setUnit(rows.get(0).getUnit());

                        // Tồn đầu kỳ
                        // row.setOpeningStock(getOpeningStock(unitCode, year, month, productCode));

                        // Map từng report_column vào đúng field, cộng dồn nếu 1 sản phẩm có
                        // nhiều dòng cùng report_column (ví dụ N04 + N04A cùng map 1 cột)
                        for (CoalReportDataDTO r : rows) {
                                BigDecimal qty = r.getQty();
                                switch (r.getReportColumn()) {
                                        case "import_from_raw" -> // nhập từ nguyên khai
                                                row.setImportFromRaw(row.getImportFromRaw().add(qty));
                                        case "import_from_recovery" ->
                                                row.setImportFromRecovery(row.getImportFromRecovery().add(qty));
                                        case "import_internal_processed" ->
                                                row.setImportInternalProcessed(
                                                                row.getImportInternalProcessed().add(qty));
                                        case "import_internal_blended" ->
                                                row.setImportInternalBlended(row.getImportInternalBlended().add(qty));
                                        case "import_internal_transfer" ->
                                                row.setImportInternalTransfer(row.getImportInternalTransfer().add(qty));
                                        case "export_sale_internal_tkv" ->
                                                row.setExportSaleInternalTkv(row.getExportSaleInternalTkv().add(qty));
                                        case "export_sale_external" ->
                                                row.setExportSaleExternal(row.getExportSaleExternal().add(qty));
                                        case "export_internal_blend" ->
                                                row.setExportInternalBlend(row.getExportInternalBlend().add(qty));
                                        case "export_internal_process" ->
                                                row.setExportInternalProcess(row.getExportInternalProcess().add(qty));
                                        case "export_internal_transfer" ->
                                                row.setExportInternalTransfer(row.getExportInternalTransfer().add(qty));
                                        case "adjustment" ->
                                                row.setAdjustment(row.getAdjustment().add(qty));
                                        default -> {
                                                // report_column lạ, chưa khai báo trong mapping -> bỏ qua,
                                                // nên log lại để rà soát nếu xảy ra
                                        }
                                }
                        }

                        // Các cột chưa xác nhận nguồn phát sinh thực tế (TODO nghiệp vụ)
                        row.setImportFromFinishedSale(BigDecimal.ZERO); // H
                        row.setImportFromNonCoal(BigDecimal.ZERO); // I
                        row.setImportFromContract(BigDecimal.ZERO); // J
                        row.setImportPurchaseDomestic(BigDecimal.ZERO); // O
                        row.setImportPurchaseImport(BigDecimal.ZERO); // P/Q

                        // Tính tổng nhập (F), tổng xuất (R), tồn cuối kỳ (Y)
                        BigDecimal totalImport = row.getImportFromRaw()
                                        .add(row.getImportFromFinishedSale())
                                        .add(row.getImportFromNonCoal())
                                        .add(row.getImportFromContract())
                                        .add(row.getImportFromRecovery())
                                        .add(row.getImportInternalProcessed())
                                        .add(row.getImportInternalBlended())
                                        .add(row.getImportInternalTransfer())
                                        .add(row.getImportPurchaseDomestic())
                                        .add(row.getImportPurchaseImport());

                        BigDecimal totalExport = row.getExportSaleInternalTkv()
                                        .add(row.getExportSaleExternal())
                                        .add(row.getExportInternalBlend())
                                        .add(row.getExportInternalProcess())
                                        .add(row.getExportInternalTransfer());

                        row.setTotalImport(totalImport);
                        row.setTotalExport(totalExport);
                        row.setClosingStock(
                                        row.getOpeningStock()
                                                        .add(totalImport)
                                                        .subtract(totalExport)
                                                        .add(row.getAdjustment()));

                        result.add(row);
                }

                // Sắp xếp theo mã sản phẩm cho dễ đối chiếu với file Excel gốc
                result.sort((a, b) -> a.getProductCode().compareTo(b.getProductCode()));

                return result;
        }

        public List<CoalConsumptionRowDTO> buildConsumptionReport(Integer year, Integer month) {
                List<CoalConsumptionDataDTO> rawData = repository.getConsumptionData(year, month);

                Map<String, List<CoalConsumptionDataDTO>> grouped = rawData.stream()
                                .collect(Collectors.groupingBy(CoalConsumptionDataDTO::getProductCode));

                List<CoalConsumptionRowDTO> result = new ArrayList<>();

                for (Map.Entry<String, List<CoalConsumptionDataDTO>> entry : grouped.entrySet()) {
                        List<CoalConsumptionDataDTO> rows = entry.getValue();
                        CoalConsumptionRowDTO row = new CoalConsumptionRowDTO();
                        row.setProductCode(entry.getKey());
                        row.setProductName(rows.get(0).getProductName());
                        row.setUnit(rows.get(0).getUnit());

                        for (CoalConsumptionDataDTO r : rows) {
                                if ("Y06".equals(r.getImportExportMethodCode())) { // xuất dùng nôi bộ
                                        row.setInternalUse(row.getInternalUse().add(r.getQty()));
                                } else { // Y01 - Bán cho đối tác
                                        String partnerCode = r.getPartnerCode() != null ? r.getPartnerCode()
                                                        : "UNKNOWN";
                                        String partnerGroupCode = r.getPartnerGroupCode();

                                        if ("03".equals(partnerGroupCode)) {
                                                // Bán cho công ty mẹ - phân theo đơn vị
                                                row.getSoldToParent().merge(partnerCode, r.getQty(), BigDecimal::add);
                                                row.getParentNames().putIfAbsent(partnerCode, r.getPartnerName());
                                        } else if ("02".equals(partnerGroupCode)) {
                                                // Bán công ty con trong tập đoàn
                                                row.getSoldToSubsidiary().merge(partnerCode, r.getQty(), BigDecimal::add);
                                                row.getSubsidiaryNames().putIfAbsent(partnerCode, r.getPartnerName());
                                        } else if("01".equals(partnerGroupCode)) {
                                                // Bán ngoài tập đoàn
                                                row.getSoldToExternal().merge(partnerCode, r.getQty(), BigDecimal::add);
                                                row.getExternalNames().putIfAbsent(partnerCode, r.getPartnerName());
                                        }
                                }
                        }

                        // Tính tổng
                        row.setTotalSoldToParent(row.getSoldToParent().values().stream()
                                        .reduce(BigDecimal.ZERO, BigDecimal::add));
                        row.setTotalSoldToSubsidiary(row.getSoldToSubsidiary().values().stream()
                                        .reduce(BigDecimal.ZERO, BigDecimal::add));
                        row.setTotalSoldToExternal(row.getSoldToExternal().values().stream()
                                        .reduce(BigDecimal.ZERO, BigDecimal::add));
                        row.setTotalConsumption(
                                        row.getTotalSoldToParent()
                                                        .add(row.getTotalSoldToSubsidiary())
                                                        .add(row.getTotalSoldToExternal())
                                                        .add(row.getInternalUse()));

                        result.add(row);
                }

                result.sort((a, b) -> a.getProductCode().compareTo(b.getProductCode()));
                return result;
        }
}