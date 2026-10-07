package com.victuscaf.gimnasio.dto;

import jakarta.validation.constraints.*;

public record MetaEPSDTO(
        @NotBlank String objetivoClinico,
        String observacionMedica
) {}