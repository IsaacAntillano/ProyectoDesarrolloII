package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;

/** Mensaje del entrenador a un cliente. */
public record MensajeDTO(
        @NotBlank String contenido
) {}