package com.quangnt0000.be_modul.modal.DataWH;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)

public class WareMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String cellAddress; //địa chỉ cell
    private String fieldName;
    private String fieldValue; //string-number
    private String fieldType;   //row - cell - input
    private Boolean isKeyColumn;
    private Boolean isScopFilter;


    @ManyToOne
    @JoinColumn(name = "wareTemplateId")
    private WareTemplate wareTemplate;

    //base
    @Builder.Default
    private Boolean deleted = false;
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
