package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record MantenimientoDTO(
        @NotNull LocalDate fechaMantenimiento,
        @NotBlank String descripcionTrabajo,
        @Positive double costo,
        @NotBlank String tecnicoResponsable,
        LocalDate proximoMantenimiento   // opcional, si se actualiza el equipo
) {}