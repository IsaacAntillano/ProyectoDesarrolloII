package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record MetaParticularDTO(
        @NotBlank String descripcion,
        @Positive Double pesoObjetivo,
        @Positive Double porcentajeGrasaObjetivo,
        @Positive Double perimetroCinturaObjetivo,
        @NotNull LocalDate fechaObjetivo
) {}