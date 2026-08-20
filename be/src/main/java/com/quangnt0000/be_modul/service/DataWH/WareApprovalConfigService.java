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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "WareTemplate không tồn tại với ID: " + wareTemplateId));

        if (wareTemplate.getDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WareTemplate đã bị xóa");
        }

        validateApprovalConfigsOrThrow(wareTemplateId, request);

        List<WareTemplateApprovalConfig> existingConfigs = approvalConfigRepository
                .findByWareTemplateIdOrderByApprovalOrder(wareTemplateId);
        
        if (!existingConfigs.isEmpty()) {
            approvalConfigRepository.deleteAll(existingConfigs);
            approvalConfigRepository.flush();
            log.debug("Deleted {} existing configs", existingConfigs.size());
        }

        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            Employee approver = employeeRepository.findByIdAndDeletedFalse(item.getApproverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Employee không tồn tại hoặc đã bị xóa: " + item.getApproverId()));

            WareTemplateApprovalConfig newConfig = WareTemplateApprovalConfig.builder()
                    .wareTemplate(wareTemplate)
                    .approver(approver)
                    .approvalOrder(item.getApprovalOrder())
                    .autoApprove(item.getAutoApprove() != null ? item.getAutoApprove() : false)
                    .isActive(true)
                    .build();

            approvalConfigRepository.save(newConfig);

            log.debug("Created config for approver: {}, order: {}",
                    item.getApproverId(), item.getApprovalOrder());
        }

        // Lấy danh sách configs ACTIVE để trả về cho FE
        List<WareTemplateApprovalConfig> activeConfigs = approvalConfigRepository
                .findActiveConfigsByWareTemplateId(wareTemplateId);

        List<WareApprovalConfigDTO> configDTOs = activeConfigs.stream()
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
     * Validate toàn bộ approval configs theo các rules nghiệp vụ
     */
    private void validateApprovalConfigsOrThrow(Integer wareTemplateId, WareApprovalConfigUpdateRequest request) {
        
        if (request.getConfigs() == null || request.getConfigs().isEmpty()) {
            // Cho phép request rỗng → tất cả configs sẽ bị set isActive = false
            log.debug("Empty config list, all existing configs will be deactivated");
            return;
        }

        // Rule 1: approvalOrder phải UNIQUE trong các approver ACTIVE
        Set<Integer> approvalOrders = new HashSet<>();
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            if (!approvalOrders.add(item.getApprovalOrder())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "ApprovalOrder bị trùng: " + item.getApprovalOrder() + 
                        ". Mỗi approvalOrder phải là duy nhất trong các approver ACTIVE.");
            }
        }

        // Rule 2: approverId không được trùng trong các approver ACTIVE
        Set<String> approverIds = new HashSet<>();
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            if (!approverIds.add(item.getApproverId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "ApproverId " + item.getApproverId() + 
                        " bị trùng. Một người chỉ được phê duyệt 1 lần trong một WareTemplate.");
            }
        }

        // Rule 3: approvalOrder BẮT BUỘC != null khi isActive = true (FE chỉ gửi active)
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            if (item.getApprovalOrder() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "ApprovalOrder không được null cho approver ACTIVE: " + item.getApproverId());
            }
            if (item.getApprovalOrder() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "ApprovalOrder phải >= 1 cho approver: " + item.getApproverId());
            }
        }

        // Rule 4: Tất cả approvers phải tồn tại và chưa bị xóa
        for (WareApprovalConfigItemRequest item : request.getConfigs()) {
            Optional<Employee> employee = employeeRepository.findByIdAndDeletedFalse(item.getApproverId());
            if (employee.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Employee không tồn tại hoặc đã bị xóa: " + item.getApproverId());
            }
        }

        log.debug("Validation passed for {} approval configs", request.getConfigs().size());
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
                .autoApprove(entity.getAutoApprove())
                .isActive(entity.getIsActive())
                .build();
    }
}
