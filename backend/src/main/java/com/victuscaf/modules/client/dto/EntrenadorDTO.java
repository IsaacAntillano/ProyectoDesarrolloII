package com.victuscaf.modules.client.dto;

import jakarta.validation.constraints.*;


public record EntrenadorDTO(
        @NotNull @Positive Long numeroDeDocumento,
        @NotBlank String nombreCompleto,
        @NotBlank @Email String correoElectronico,
        @NotBlank String contrasena,
        @NotBlank String especialidad,
        @Positive double salario
) {}