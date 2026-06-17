package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.Target.TargetRequest;
import com.quangnt0000.be_modul.dto.Target.TargetResponse;
import com.quangnt0000.be_modul.mapper.TargetMapper;
import com.quangnt0000.be_modul.modal.DataLake.Department;
import com.quangnt0000.be_modul.modal.DataLake.Target;
import com.quangnt0000.be_modul.repository.DataLake.DepartmentRepository;
import com.quangnt0000.be_modul.repository.DataLake.TargetRepository;
import com.quangnt0000.be_modul.service.Common.CommonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TargetService {
    private final TargetRepository targetRepository;
    private final DepartmentRepository departmentRepository;
    private final TargetMapper targetMapper;
    private final CommonService commonService;

    // CREATE
    public TargetResponse createTarget(TargetRequest targetRequest) {
        Department department = getDepartmentById(targetRequest.getDepartmentId());

        Target target = targetMapper.toEntity(targetRequest);
        target.setDepartment(department);
        return targetMapper.toResponse( targetRepository.save(target));
    }

    // CREATE BULK
    public List<TargetResponse> createTargets(List<TargetRequest> targetRequests){
        Map<String, Department> departmentMap = commonService.fetchEntityMap(
                targetRequests,
                TargetRequest::getDepartmentId,
                departmentRepository::findAllByIdInAndDeletedFalse,
                Department::getId
        );

        List<Target> targets = targetMapper.toEntityList(targetRequests);

        targets = targets.stream()
                .peek(target -> target.setDepartment(departmentMap.get(target.getDepartment().getId())))
                .toList();

        return targetMapper.toResponseList(targetRepository.saveAll(targets));
    }

    // UPDATE
    public TargetResponse update(TargetRequest request){
        Target target = getTargetById(request.getId());
        Department department = getDepartmentById(request.getDepartmentId());

        targetMapper.updateEntityFromRequest(request, target);
        target.setDepartment(department);

        return targetMapper.toResponse(targetRepository.save(target));
    }

    // UPDATE BULK
    public List<TargetResponse> updateTargets(List<TargetRequest> targetRequests){
        Map<String, Target> targetMap = commonService.fetchEntityMap(
                targetRequests,
                TargetRequest::getId,
                targetRepository::findAllByIdInAndDeletedFalse,
                Target::getId
        );

        Map<String, Department> departmentMap = commonService.fetchEntityMap(
                targetRequests,
                TargetRequest::getDepartmentId,
                departmentRepository::findAllByIdInAndDeletedFalse,
                Department::getId
        );

        List<Target> targets = targetRequests.stream()
                .map(request -> {
                    Target target = targetMap.get(request.getId());
                    Department department = departmentMap.get(request.getDepartmentId());

                    targetMapper.updateEntityFromRequest(request, target);
                    target.setDepartment(department);

                    return target;
                }).toList();

        return targetMapper.toResponseList(targetRepository.saveAll(targets));
    }

    // DELETE
    public void deleteTarget(String id) {
        Target target = getTargetById(id);
        target.setDeleted(true);
        targetRepository.save(target);
    }

    // DELETE BULK
    public void deleteTargets(List<String> ids) {
        List<Target> targets = targetRepository.findAllById(ids);
        targets.forEach(target -> target.setDeleted(true));
        targetRepository.saveAll(targets);
    }

    // GET ALL
    public List<TargetResponse> getAllTargets() {
        List<Target> targets = targetRepository.findAllByDeletedFalse();
        return targetMapper.toResponseList(targets);
    }

    // GET BY DEPARTMENT ID
    public List<TargetResponse> getTargetsByDepartmentId(String departmentId) {
        List<Target> targets = targetRepository.findByDepartmentIdAndDeletedFalse(departmentId);
        return targetMapper.toResponseList(targets);
    }

    // HELPER METHODS
     public Department getDepartmentById(String id) {
        return departmentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
    }

    public Target getTargetById(String id) {
        return targetRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Target not found with id: " + id));
    }
}
