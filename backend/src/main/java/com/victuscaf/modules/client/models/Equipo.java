package com.victuscaf.modules.client.models;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;

@Entity
@Data
@EqualsAndHashCode
@ToString
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long idEquipo;

    private String nombre;
    private String descripcion;
    private LocalDate fechaAdquisicion;

    // Persiste el nombre del enum, no su posicion: agregar valores al enum no
    // corrompe los registros existentes.
    @Enumerated(EnumType.STRING)
    private EstadoEquipo estadoEquipo;
    private LocalDate proximoMantenimiento;

}
