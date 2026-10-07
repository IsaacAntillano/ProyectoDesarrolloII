package com.victuscaf.modules.client.models;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class ParticularDiario extends Usuario{
    private LocalDate fechaDeIngreso;
    private LocalTime horaIngreso;
    private LocalTime horaExpiracion;
}
