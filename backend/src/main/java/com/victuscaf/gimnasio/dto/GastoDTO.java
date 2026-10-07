package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

/** Gasto operativo: nómina, arriendo o mantenimiento. */
public record GastoDTO(
        @PositiveOrZero double valor,
        @NotBlank String descripcion
) {}