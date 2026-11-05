package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Documento del entrenador a asignar a un cliente (cambio manual del administrador). */
public record AsignarEntrenadorDTO(
        @NotNull @Positive Long documentoEntrenador
) {}