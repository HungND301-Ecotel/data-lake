package com.quangnt0000.be_modul.mapper;

import com.quangnt0000.be_modul.dto.TargetReport.TargetReportRequest;
import com.quangnt0000.be_modul.dto.TargetReport.TargetReportResponse;
import com.quangnt0000.be_modul.modal.DataLake.Target;
import com.quangnt0000.be_modul.modal.DataLake.TargetReport;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TargetReportMapper {
    TargetReport toEntity(TargetReportRequest request);
    @Mapping(source = "target.id", target = "targetId")
    @Mapping(source = "target.name", target = "targetName")
    @Mapping(source = "target.code", target = "code")
    @Mapping(source = "target.unit", target = "unit")
    @Mapping(source = "target.value", target = "value")
    TargetReportResponse toResponse(TargetReport entity);
    List<TargetReport> toEntityList(List<TargetReportRequest> requests);
    List<TargetReportResponse> toResponseList(List<TargetReport> entities);

    void updateEntityFromRequest(TargetReportRequest request, @MappingTarget TargetReport entity);

    // Dùng khi target chưa có report cho ngày đang xét, hoặc target là node cha (chỉ có children)
    @Mapping(target = "id", ignore = true) // tránh map nhầm Target.id -> Response.id
    @Mapping(source = "id", target = "targetId")
    @Mapping(source = "name", target = "targetName")
    TargetReportResponse toResponseBase(Target target);
}
