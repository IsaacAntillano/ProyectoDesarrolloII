package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class HorarioEntrenador {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaDisponible;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private boolean disponible;
    private Long idClienteAsignado;

    @ManyToOne
    @JoinColumn(name = "entrenador_id")
    private Entrenador entrenador;
}