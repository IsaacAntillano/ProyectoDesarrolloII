package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;

/** Motivo con el que el cliente pide la baja de su propio registro. */
public record SolicitudBajaRequestDTO(
        @NotBlank String motivo
) {
}
