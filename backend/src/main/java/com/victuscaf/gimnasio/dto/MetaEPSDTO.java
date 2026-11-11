package com.victuscaf.gimnasio.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.*;

public record MetaEPSDTO(
        @NotBlank String objetivoClinico,
        String observacionMedica,
        LocalDate fechaObjetivo
) {}