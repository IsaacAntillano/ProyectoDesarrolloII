package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetaFisica {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descripcion;
    private Double pesoObjetivo;
    private Double porcentajeGrasaObjetivo;
    private Double perimetroCinturaObjetivo;
    private LocalDate fechaObjetivo;
    private String observacionMedica;   // solo para EPS

    @OneToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
}