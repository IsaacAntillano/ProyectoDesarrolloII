package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RutinaDTO(
        @NotBlank String nombre,
        @NotBlank String descripcion,
        @NotNull LocalDate fechaVencimiento
) {}