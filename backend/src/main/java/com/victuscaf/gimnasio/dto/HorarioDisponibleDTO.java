package com.victuscaf.gimnasio.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/** Cupo libre de un entrenador, para reservarlo desde el portal del cliente. */
public record HorarioDisponibleDTO(
        Long idHorario,
        LocalDate fechaDisponible,
        LocalTime horaInicio,
        LocalTime horaFin,
        String entrenador
) {}
