package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.ApiResponse;
import com.quangnt0000.be_modul.dto.WareApprovalConfig.WareApprovalConfigDTO;
import com.quangnt0000.be_modul.dto.WareApprovalConfig.WareApprovalConfigItemRequest;
import com.quangnt0000.be_modul.dto.WareApprovalConfig.WareApprovalConfigListResponse;
import com.quangnt0000.be_modul.dto.WareApprovalConfig.WareApprovalConfigUpdateRequest;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplateApprovalConfig;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareApprovalConfigRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WareApprovalConfigService {

    private final WareApprovalConfigRepository approvalConfigRepository;
    private final WareTemplateRepository wareTemplateRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * API 1: Lấy danh sách approval configs của WareTemplate
     * GET /api/wh-template/{wareTemplateId}/approval-configs
     */
    public ResponseEntity<?> getApprovalConfigs(Integer wareTemplateId) {
        log.info("Getting approval configs for WareTemplate ID: {}", wareTemplateId);

        WareTemplate wareTemplate = wareTemplateRepository.findById(wareTemplateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "WareTemplate không tồn tại với ID: " + wareTemplateId));

        if (wareTemplate.getDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WareTemplate đã bị xóa");
        }

        List<WareTemplateApprovalConfig> configs = approvalConfigRepository
                .findByWareTemplateIdOrderByApprovalOrder(wareTemplateId);

        List<WareApprovalConfigDTO> configDTOs = configs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        WareApprovalConfigListResponse response = WareApprovalConfigListResponse.builder()
                .wareTemplateId(wareTemplateId)
                .wareTemplateName(wareTemplate.getName())
                .configs(configDTOs)
                .build();

        return ResponseEntity.ok(ApiResponse.builder()
                .status(HttpStatus.OK)
                .msg("Lấy danh sách approval configs thành công")
                .data(response)
                .build());
    }

    /**
     * API 2: Cập nhật TOÀN BỘ danh sách approval configs
     * PUT /api/wh-template/{wareTemplateId}/approval-configs
     */
    @Transactional
    public ResponseEntity<?> updateApprovalConfigs(Integer wareTemplateId, WareApprovalConfigUpdateRequest request) {
        log.info("Updating approval configs for WareTemplate ID: {}", wareTemplateId);

        WareTemplate wareTemplate = wareTemplateRepository.findById(wareTemplateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "WareTemplate không tồn tại với ID: " + wareTemplateId));

        if (wareTemplate.getDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WareTemplate đã bị xóa");
        }

        validateApprovalConfigsOrThrow(wareTemplateId, request);

        List<WareTemplateApprovalConfig> savedConfigs = new ArrayList<>();

        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            WareTemplateApprovalConfig config;

            if (item.getId() != null) {
                config = approvalConfigRepository.findById(item.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approval config không tồn tại với ID: " + item.getId()));

                if (!config.getWareTemplate().getId().equals(wareTemplateId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approval config ID " + item.getId() + " không thuộc WareTemplate này");
                }

                Employee approver = employeeRepository.findByIdAndDeletedFalse(item.getApproverId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee không tồn tại: " + item.getApproverId()));

                config.setApprover(approver);
                config.setApprovalOrder(item.getApprovalOrder());
                config.setIsActive(item.getIsActive());

            } else {
                Employee approver = employeeRepository.findByIdAndDeletedFalse(item.getApproverId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee không tồn tại: " + item.getApproverId()));

                config = WareTemplateApprovalConfig.builder()
                        .wareTemplate(wareTemplate)
                        .approver(approver)
                        .approvalOrder(item.getApprovalOrder())
                        .isActive(item.getIsActive())
                        .build();
            }

            savedConfigs.add(approvalConfigRepository.save(config));
        }

        log.info("Đã cập nhật {} approval configs cho WareTemplate ID: {}", savedConfigs.size(), wareTemplateId);

        List<WareApprovalConfigDTO> configDTOs = savedConfigs.stream()
                .map(this::convertToDTO)
                .sorted(Comparator.comparing(WareApprovalConfigDTO::getApprovalOrder))
                .collect(Collectors.toList());

        WareApprovalConfigListResponse response = WareApprovalConfigListResponse.builder()
                .wareTemplateId(wareTemplateId)
                .wareTemplateName(wareTemplate.getName())
                .configs(configDTOs)
                .build();

        return ResponseEntity.ok(ApiResponse.builder()
                .status(HttpStatus.OK)
                .msg("Cập nhật approval configs thành công")
                .data(response)
                .build());
    }

    /**
     * Validate toàn bộ approval configs theo các rules bắt buộc
     * Throw ResponseStatusException nếu có lỗi
     */
    private void validateApprovalConfigsOrThrow(Integer wareTemplateId, WareApprovalConfigUpdateRequest request) {
        
        // Rule 1: Unique approvalOrder trong request
        Set<Integer> approvalOrders = new HashSet<>();
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            if (!approvalOrders.add(item.getApprovalOrder())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "ApprovalOrder bị trùng: " + item.getApprovalOrder() + ". Mỗi approvalOrder phải là duy nhất trong WareTemplate.");
            }
        }

        // Rule 2: Unique active approverId trong request
        Set<String> activeApproverIds = new HashSet<>();
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            if (item.getIsActive()) {
                if (!activeApproverIds.add(item.getApproverId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                            "ApproverId " + item.getApproverId() + " bị trùng trong các config ACTIVE. Một người chỉ được phê duyệt 1 lần.");
                }
            }
        }

        // Rule 3: Validate tất cả approvers phải tồn tại và chưa bị xóa
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            Optional<Employee> employee = employeeRepository.findByIdAndDeletedFalse(item.getApproverId());
            if (employee.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Employee không tồn tại hoặc đã bị xóa: " + item.getApproverId());
            }
        }

        // Rule 4: Validate configs phải thuộc về WareTemplate này (khi update)
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            if (item.getId() != null) {
                Optional<WareTemplateApprovalConfig> existing = approvalConfigRepository.findById(item.getId());
                if (existing.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                            "Approval config không tồn tại: " + item.getId());
                }
                if (!existing.get().getWareTemplate().getId().equals(wareTemplateId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                            "Approval config ID " + item.getId() + " không thuộc WareTemplate " + wareTemplateId);
                }
            }
        }
    }

    /**
     * Convert Entity sang DTO
     */
    private WareApprovalConfigDTO convertToDTO(WareTemplateApprovalConfig entity) {
        return WareApprovalConfigDTO.builder()
                .id(entity.getId())
                .approverId(entity.getApprover().getId())
                .approverName(entity.getApprover().getName())
                .approvalOrder(entity.getApprovalOrder())
                .isActive(entity.getIsActive())
                .build();
    }
}
