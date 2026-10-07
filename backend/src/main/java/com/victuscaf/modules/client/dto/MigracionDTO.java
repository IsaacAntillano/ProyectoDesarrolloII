package com.victuscaf.modules.client.dto;

import com.victuscaf.modules.client.models.TipoDeMembresia;
import jakarta.validation.constraints.*;

public record MigracionDTO(
        @NotBlank @Email String correoElectronico,
        @NotBlank String contrasena,
        @NotNull TipoDeMembresia tipoMembresia
) {}