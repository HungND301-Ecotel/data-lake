package com.quangnt0000.be_modul.mapper;

import com.quangnt0000.be_modul.dto.Target.TargetRequest;
import com.quangnt0000.be_modul.dto.Target.TargetResponse;
import com.quangnt0000.be_modul.modal.DataLake.Target;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TargetMapper {
    Target toEntity(TargetRequest request);
    @Mapping(source = "department.id", target = "departmentId")
    @Mapping(source = "department.name", target = "departmentName")
    TargetResponse toResponse(Target target);

    List<Target> toEntityList(List<TargetRequest> requests);
    List<TargetResponse> toResponseList(List<Target> targets);

    void updateEntityFromRequest(TargetRequest request, @MappingTarget Target target);
}
