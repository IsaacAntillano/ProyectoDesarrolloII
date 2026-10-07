package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;

public record HorarioDTO(
        @NotNull LocalDate fechaDisponible,
        @NotNull LocalTime horaInicio,
        @NotNull LocalTime horaFin
) {}