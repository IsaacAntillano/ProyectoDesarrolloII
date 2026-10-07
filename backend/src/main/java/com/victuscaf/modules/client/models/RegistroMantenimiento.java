package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;

@Entity
@Data
@EqualsAndHashCode
@ToString
public class RegistroMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMantenimiento;
    private LocalDate fechaMantenimiento;
    private String descripcion;
    private double costo;
    private String tecnicoResponsable;

    @ManyToOne
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;
}
