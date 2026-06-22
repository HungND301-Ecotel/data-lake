package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.TargetReport.DepartmentTargetResponse;
import com.quangnt0000.be_modul.dto.TargetReport.TargetReportRequest;
import com.quangnt0000.be_modul.dto.TargetReport.TargetReportResponse;
import com.quangnt0000.be_modul.mapper.TargetReportMapper;
import com.quangnt0000.be_modul.modal.DataLake.Department;
import com.quangnt0000.be_modul.modal.DataLake.Target;
import com.quangnt0000.be_modul.modal.DataLake.TargetReport;
import com.quangnt0000.be_modul.repository.DataLake.DepartmentRepository;
import com.quangnt0000.be_modul.repository.DataLake.TargetReportRepository;
import com.quangnt0000.be_modul.repository.DataLake.TargetRepository;
import com.quangnt0000.be_modul.service.Common.CommonService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TargetReportService {

    private final CommonService commonService;
    private final TargetReportRepository targetReportRepository;
    private final TargetReportMapper targetReportMapper;
    private final TargetRepository targetRepository;
    private final DepartmentRepository departmentRepository;

    // CREATE BULK
    public List<TargetReportResponse> createBulk(List<TargetReportRequest> requests) {
        Map<String, Target> targetMap = commonService.fetchEntityMap(
                requests,
                TargetReportRequest::getTargetId,
                targetRepository::findAllByIdInAndDeletedFalse,
                Target::getId
        );

        List<TargetReport> targetReports = requests.stream()
                .map(request -> {
                    TargetReport targetReport = targetReportMapper.toEntity(request);
                    targetReport.setTarget(targetMap.get(request.getTargetId()));
                    return targetReport;
                }).toList();

        return targetReportMapper.toResponseList(targetReportRepository.saveAll(targetReports));
    }

    // UPDATE BULK
    public List<TargetReportResponse> updateBulk(List<TargetReportRequest> requests) {
        Map<String, Target> targetMap = commonService.fetchEntityMap(
                requests,
                TargetReportRequest::getTargetId,
                targetRepository::findAllByIdInAndDeletedFalse,
                Target::getId
        );

        Map<String, TargetReport> targetReportMap = commonService.fetchEntityMap(
                requests,
                TargetReportRequest::getId,
                targetReportRepository::findAllByIdInAndDeletedFalse,
                TargetReport::getId
        );

        List<TargetReport> targetReports = requests.stream()
                .map(request -> {
                    TargetReport targetReport = targetReportMap.get(request.getId());
                    targetReportMapper.updateEntityFromRequest(request, targetReport);
                    targetReport.setTarget(targetMap.get(request.getTargetId()));
                    return targetReport;
                }).toList();

        return targetReportMapper.toResponseList(targetReportRepository.saveAll(targetReports));
    }

    // DELETE BULK
    public void deleteBulk(List<String> ids) {
        List<TargetReport> targetReports = targetReportRepository.findAllById(ids);
        targetReports.forEach(targetReport -> targetReport.setDeleted(true));
        targetReportRepository.saveAll(targetReports);
    }

    // GET ALL
    public List<DepartmentTargetResponse> getDepartmentTargets(String departmentId, LocalDate date) {
        List<Department> departments = departmentRepository.findByDeletedFalse();
        Map<String, Department> deptById = departments.stream()
                .collect(Collectors.toMap(Department::getId, Function.identity()));
        Map<String, List<Department>> deptChildrenMap = buildDeptChildrenMap(departments);

        List<Department> targetDepartments;
        Set<String> scopeIds;

        if (departmentId != null) {
            Department department = deptById.get(departmentId);
            if (department == null) {
                throw new EntityNotFoundException("Không tìm thấy department: " + departmentId);
            }
            targetDepartments = List.of(department);
            scopeIds = collectDescendantIds(departmentId, deptChildrenMap);
        } else {
            targetDepartments = departments.stream()
                    .filter(d -> d.getParentId() == null || !deptById.containsKey(d.getParentId()))
                    .toList();
            scopeIds = departments.stream().map(Department::getId).collect(Collectors.toSet());
        }

        ReportContext context = buildReportContext(date, scopeIds);

        return targetDepartments.stream()
                .map(dept -> buildDepartmentResponse(dept, date, deptChildrenMap, context))
                .toList();
    }

    // CREATE
    public TargetReportResponse create(TargetReportRequest request) {
        Target target = targetRepository.findByIdAndDeletedFalse(request.getTargetId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy target: " + request.getTargetId()));

        TargetReport targetReport = targetReportMapper.toEntity(request);
        targetReport.setTarget(target);

        return targetReportMapper.toResponse(targetReportRepository.save(targetReport));
    }

    // UPDATE
    public TargetReportResponse update(TargetReportRequest request) {
        TargetReport targetReport = targetReportRepository.findByIdAndDeletedFalse(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy target report: " + request.getId()));

        Target target = targetRepository.findByIdAndDeletedFalse(request.getTargetId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy target: " + request.getTargetId()));

        targetReportMapper.updateEntityFromRequest(request, targetReport);
        targetReport.setTarget(target);

        return targetReportMapper.toResponse(targetReportRepository.save(targetReport));
    }

    // DELETE
    public void delete(String id) {
        TargetReport targetReport = targetReportRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy target report: " + id));
        targetReport.setDeleted(true);
        targetReportRepository.save(targetReport);
    }

    // GET (filter optional theo department, date) - trả về list phẳng (target tree), tự sinh dữ liệu mặc định nếu chưa có report
    public List<TargetReportResponse> getTargetReports(String departmentId, LocalDate date) {
        Set<String> scopeIds;

        if (departmentId != null) {
            List<Department> departments = departmentRepository.findByDeletedFalse();
            Map<String, List<Department>> deptChildrenMap = buildDeptChildrenMap(departments);
            scopeIds = collectDescendantIds(departmentId, deptChildrenMap);
        } else {
            scopeIds = departmentRepository.findByDeletedFalse().stream()
                    .map(Department::getId)
                    .collect(Collectors.toSet());
        }

        ReportContext context = buildReportContext(date, scopeIds);

        List<Target> targets = context.targetsByDept().values().stream()
                .flatMap(List::stream)
                .toList();

        return buildTargetTree(targets, date, context);
    }

    // GET TARGET REPORT IN MONTH
    public List<LocalDate> getPastDatesWithReportInMonth(YearMonth month, String departmentId) {
        return targetReportRepository.findDistinctPastDatesInMonth(
                month.atDay(1),
                month.atEndOfMonth(),
                LocalDate.now(),
                departmentId
        );
    }

    // ====== helpers chung ======

    private Map<String, List<Department>> buildDeptChildrenMap(List<Department> departments) {
        return departments.stream()
                .filter(d -> d.getParentId() != null)
                .collect(Collectors.groupingBy(Department::getParentId));
    }

    private Set<String> collectDescendantIds(String rootId, Map<String, List<Department>> deptChildrenMap) {
        Set<String> ids = new HashSet<>();
        Deque<String> stack = new ArrayDeque<>();
        stack.push(rootId);
        while (!stack.isEmpty()) {
            String id = stack.pop();
            if (ids.add(id)) {
                deptChildrenMap.getOrDefault(id, List.of())
                        .forEach(child -> stack.push(child.getId()));
            }
        }
        return ids;
    }

    private record ReportContext(
            Map<String, List<Target>> targetsByDept,
            Map<String, TargetReport> exactReportByTargetId,
            Map<String, TargetReport> lastPastReportByTargetId) {
    }

    private ReportContext buildReportContext(LocalDate date, Set<String> departmentIdScope) {
        YearMonth month = YearMonth.from(date);

        List<Target> targets = targetRepository.findByDeletedFalseAndMonthAndDepartment_IdIn(month, departmentIdScope);
        Map<String, List<Target>> targetsByDept = targets.stream()
                .filter(t -> t.getDepartment() != null)
                .collect(Collectors.groupingBy(t -> t.getDepartment().getId()));

        List<String> targetIds = targets.stream().map(Target::getId).toList();
        List<TargetReport> monthReports = targetIds.isEmpty()
                ? List.of()
                : targetReportRepository.findByDeletedFalseAndTarget_IdInAndDateBetween(
                targetIds, month.atDay(1), month.atEndOfMonth());

        Map<String, List<TargetReport>> reportsByTarget = monthReports.stream()
                .filter(r -> r.getTarget() != null)
                .collect(Collectors.groupingBy(r -> r.getTarget().getId()));

        Map<String, TargetReport> exactReportByTargetId = new HashMap<>();
        Map<String, TargetReport> lastPastReportByTargetId = new HashMap<>();

        reportsByTarget.forEach((targetId, list) -> {
            list.stream()
                    .filter(r -> date.equals(r.getDate()))
                    .findFirst()
                    .ifPresent(r -> exactReportByTargetId.put(targetId, r));

            list.stream()
                    .filter(r -> r.getDate() != null && r.getDate().isBefore(date))
                    .max(Comparator.comparing(TargetReport::getDate))
                    .ifPresent(r -> lastPastReportByTargetId.put(targetId, r));
        });

        return new ReportContext(targetsByDept, exactReportByTargetId, lastPastReportByTargetId);
    }

    // ====== build cây department/target ======

    private DepartmentTargetResponse buildDepartmentResponse(
            Department department, LocalDate date,
            Map<String, List<Department>> deptChildrenMap, ReportContext context) {

        List<Department> children = deptChildrenMap.getOrDefault(department.getId(), List.of());

        DepartmentTargetResponse response = new DepartmentTargetResponse();
        response.setDepartmentId(department.getId());
        response.setDepartmentName(department.getName());
        response.setDate(date);

        if (children.isEmpty()) {
            List<Target> deptTargets = context.targetsByDept().getOrDefault(department.getId(), List.of());
            response.setTargetReportResponseList(buildTargetTree(deptTargets, date, context));
        } else {
            List<DepartmentTargetResponse> childResponses = children.stream()
                    .map(child -> buildDepartmentResponse(child, date, deptChildrenMap, context))
                    .toList();
            response.setChildren(childResponses);
        }

        return response;
    }

    private List<TargetReportResponse> buildTargetTree(List<Target> targets, LocalDate date, ReportContext context) {
        Map<String, Target> targetById = targets.stream()
                .collect(Collectors.toMap(Target::getId, Function.identity()));

        Map<String, List<Target>> childrenMap = targets.stream()
                .filter(t -> t.getParentId() != null)
                .collect(Collectors.groupingBy(Target::getParentId));

        List<Target> rootTargets = targets.stream()
                .filter(t -> t.getParentId() == null || !targetById.containsKey(t.getParentId()))
                .toList();

        return rootTargets.stream()
                .map(t -> buildTargetResponse(t, date, childrenMap, context))
                .toList();
    }

    private TargetReportResponse buildTargetResponse(
            Target target, LocalDate date,
            Map<String, List<Target>> childrenMap, ReportContext context) {

        List<Target> children = childrenMap.getOrDefault(target.getId(), List.of());

        if (!children.isEmpty()) {
            TargetReportResponse response = targetReportMapper.toResponseBase(target);
            List<TargetReportResponse> childResponses = children.stream()
                    .map(c -> buildTargetResponse(c, date, childrenMap, context))
                    .toList();
            response.setChildren(childResponses);
            return response;
        }

        TargetReport exact = context.exactReportByTargetId().get(target.getId());
        if (exact != null) {
            return targetReportMapper.toResponse(exact);
        }

        TargetReport newReport = new TargetReport();
        newReport.setTarget(target);
        newReport.setDate(date);
        TargetReport saved = targetReportRepository.save(newReport);

        TargetReportResponse savedResponse = targetReportMapper.toResponse(saved);
        applyDefaultValues(savedResponse, target, date, context.lastPastReportByTargetId().get(target.getId()));
        return savedResponse;
    }

    private void applyDefaultValues(TargetReportResponse response, Target target, LocalDate date, TargetReport lastPastReport) {
        YearMonth month = target.getMonth();
        int totalDays = month.lengthOfMonth();
        int shiftDone = Math.max(0, Math.min(totalDays, date.getDayOfMonth() - 1));
        int shiftRemain = totalDays - shiftDone;

        BigDecimal targetValue = target.getValue() != null ? target.getValue() : BigDecimal.ZERO;

        BigDecimal targetPerDay = totalDays == 0
                ? BigDecimal.ZERO
                : targetValue.divide(BigDecimal.valueOf(totalDays), 0, RoundingMode.HALF_UP);

        BigDecimal monthLyCumulative;
        if (date.getDayOfMonth() == 1 || lastPastReport == null) {
            monthLyCumulative = BigDecimal.ZERO;
        } else {
            BigDecimal pastCumulative = lastPastReport.getMonthLyCumulative() != null
                    ? lastPastReport.getMonthLyCumulative() : BigDecimal.ZERO;
            BigDecimal pastPerformDone = lastPastReport.getPerformDone() != null
                    ? lastPastReport.getPerformDone() : BigDecimal.ZERO;
            monthLyCumulative = pastCumulative.add(pastPerformDone);
        }

        BigDecimal targetPerDayRemain = shiftRemain == 0
                ? BigDecimal.ZERO
                : targetValue.subtract(monthLyCumulative)
                .divide(BigDecimal.valueOf(shiftRemain), 0, RoundingMode.HALF_UP);

        BigDecimal donePercent = targetValue.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : monthLyCumulative.divide(targetValue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);

        response.setTotalDays(totalDays);
        response.setShiftDone(shiftDone);
        response.setTargetPerDay(targetPerDay);
        response.setShiftPlus(1);
        response.setShiftRemain(shiftRemain);
        response.setMonthLyCumulative(monthLyCumulative);
        response.setTargetPerDayRemain(targetPerDayRemain);
        response.setDonePercent(donePercent);
    }
}
