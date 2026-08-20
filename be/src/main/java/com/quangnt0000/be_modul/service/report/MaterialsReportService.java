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
import com.quangnt0000.be_modul.dto.report.CoalReportGroupDTO;
import com.quangnt0000.be_modul.dto.report.CoalReportRowDTO;
import com.quangnt0000.be_modul.repository.report.MaterialsReportRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MaterialsReportService {
        private final MaterialsReportRepository repository;

        public List<CoalReportGroupDTO> buildFullReport(Integer year, Integer month) {
                List<CoalReportDataDTO> rawData = repository.getReportData(year, month);

                Map<String, List<CoalReportDataDTO>> grouped = rawData.stream()
                                .collect(Collectors.groupingBy(CoalReportDataDTO::getProductCode));

                // Tồn đầu kỳ = tồn cuối kỳ tháng trước
                Map<String, BigDecimal> openingStockMap = repository.getOpeningStockForAllProducts(year, month);

                List<CoalReportRowDTO> result = new ArrayList<>();

                for (Map.Entry<String, List<CoalReportDataDTO>> entry : grouped.entrySet()) {
                        String productCode = entry.getKey();
                        List<CoalReportDataDTO> rows = entry.getValue();

                        CoalReportRowDTO row = new CoalReportRowDTO();
                        row.setProductCode(productCode);
                        row.setProductName(rows.get(0).getProductName());
                        row.setUnit(rows.get(0).getUnit());
                        row.setReportGroup(rows.get(0).getReportGroup());
                        row.setReportGroupName(rows.get(0).getReportGroupName());
                        row.setOpeningStock(openingStockMap.getOrDefault(productCode, BigDecimal.ZERO));

                        // Map từng report_column vào đúng field, cộng dồn nếu 1 sản phẩm có
                        // nhiều dòng cùng report_column (ví dụ N04 + N04A cùng map 1 cột)
                        for (CoalReportDataDTO r : rows) {
                                BigDecimal qty = r.getQty();
                                switch (r.getReportColumn()) {
                                        // === NHẬP ===
                                        case "import_from_raw" ->
                                                row.setImportFromRaw(row.getImportFromRaw().add(qty));
                                        case "import_from_finished_sale" ->
                                                row.setImportFromFinishedSale(row.getImportFromFinishedSale().add(qty));
                                        case "import_from_nonCoal" ->
                                                row.setImportFromNonCoal(row.getImportFromNonCoal().add(qty));
                                        case "import_from_contract" ->
                                                row.setImportFromContract(row.getImportFromContract().add(qty));
                                        case "import_from_recovery" ->
                                                row.setImportFromRecovery(row.getImportFromRecovery().add(qty));
                                        case "import_internal_processed" ->
                                                row.setImportInternalProcessed(
                                                                row.getImportInternalProcessed().add(qty));
                                        case "import_internal_blended" ->
                                                row.setImportInternalBlended(row.getImportInternalBlended().add(qty));
                                        case "import_internal_transfer" ->
                                                row.setImportInternalTransfer(row.getImportInternalTransfer().add(qty));
                                        case "import_purchase_in_tkv" ->
                                                row.setImportPurchaseInTkv(row.getImportPurchaseInTkv().add(qty));
                                        case "import_purchase_domestic" ->
                                                row.setImportPurchaseDomestic(row.getImportPurchaseDomestic().add(qty));
                                        case "import_purchase_import" ->
                                                row.setImportPurchaseImport(row.getImportPurchaseImport().add(qty));
                                        // === XUẤT ===
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
                                        case "adjustment" -> {
                                                if ("NHAP".equals(r.getGroup())) {
                                                        row.setAdjustment(row.getAdjustment().add(qty));
                                                } else if ("XUAT".equals(r.getGroup())) {
                                                        row.setAdjustment(row.getAdjustment().subtract(qty));
                                                } else {
                                                        // nhom null/không xác định - log để rà soát, không cộng nhầm
                                                        // chiều
                                                }
                                        }
                                        default -> {
                                                // report_column lạ, chưa khai báo trong mapping -> bỏ qua,
                                                // nên log lại để rà soát nếu xảy ra
                                        }
                                }
                        }

                        // Tính tổng nhập (F), tổng xuất (R), tồn cuối kỳ (Y)
                        BigDecimal totalImport = row.getImportFromRaw()
                                        .add(row.getImportFromFinishedSale())
                                        .add(row.getImportFromNonCoal())
                                        .add(row.getImportFromContract())
                                        .add(row.getImportFromRecovery())
                                        .add(row.getImportInternalProcessed())
                                        .add(row.getImportInternalBlended())
                                        .add(row.getImportInternalTransfer())
                                        .add(row.getImportPurchaseInTkv())
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

                return buildGroupsByNhomVthh(result);
        }

        private List<CoalReportGroupDTO> buildGroupsByNhomVthh(List<CoalReportRowDTO> leafRows) {
                Map<String, List<CoalReportRowDTO>> byGroup = leafRows.stream()
                                .collect(Collectors.groupingBy(
                                                r -> r.getReportGroup() != null ? r.getReportGroup() : "KHONG_XAC_DINH"));

                List<CoalReportGroupDTO> groups = new ArrayList<>();

                for (Map.Entry<String, List<CoalReportRowDTO>> e : byGroup.entrySet()) {
                        List<CoalReportRowDTO> products = e.getValue();
                        products.sort((a, b) -> a.getProductCode().compareTo(b.getProductCode()));

                        CoalReportGroupDTO group = new CoalReportGroupDTO();
                        group.setGroupCode(e.getKey());
                        group.setGroupName(products.get(0).getReportGroupName());
                        group.setProducts(products);

                        BigDecimal opening = BigDecimal.ZERO;
                        BigDecimal totalImport = BigDecimal.ZERO;
                        BigDecimal totalExport = BigDecimal.ZERO;
                        BigDecimal adjustment = BigDecimal.ZERO;
                        BigDecimal closing = BigDecimal.ZERO;

                        for (CoalReportRowDTO p : products) {
                                opening = opening.add(p.getOpeningStock());
                                totalImport = totalImport.add(p.getTotalImport());
                                totalExport = totalExport.add(p.getTotalExport());
                                adjustment = adjustment.add(p.getAdjustment());
                                closing = closing.add(p.getClosingStock());
                        }

                        group.setOpeningStock(opening);
                        group.setTotalImport(totalImport);
                        group.setTotalExport(totalExport);
                        group.setAdjustment(adjustment);
                        group.setClosingStock(closing);

                        groups.add(group);
                }

                groups.sort((a, b) -> a.getGroupCode().compareTo(b.getGroupCode()));
                return groups;
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
                                                row.getSoldToSubsidiary().merge(partnerCode, r.getQty(),
                                                                BigDecimal::add);
                                                row.getSubsidiaryNames().putIfAbsent(partnerCode, r.getPartnerName());
                                        } else if ("01".equals(partnerGroupCode)) {
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