package com.victuscaf.gimnasio.dto;

import com.victuscaf.gimnasio.models.EstadoEquipo;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record EquipoDTO(
        @NotBlank String nombre,
        String descripcion,
        @NotNull LocalDate fechaAdquisicion,
        @NotNull EstadoEquipo estadoEquipo,
        @NotNull LocalDate proximoMantenimiento
) {}