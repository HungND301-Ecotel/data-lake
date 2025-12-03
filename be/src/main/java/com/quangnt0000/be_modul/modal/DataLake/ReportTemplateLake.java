package com.quangnt0000.be_modul.modal.DataLake;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
public class ReportTemplateLake {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
}
