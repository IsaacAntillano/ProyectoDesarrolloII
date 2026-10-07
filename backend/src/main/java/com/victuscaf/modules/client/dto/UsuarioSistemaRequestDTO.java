package com.victuscaf.modules.client.dto;

import com.victuscaf.modules.client.models.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UsuarioSistemaRequestDTO {
    @NotBlank
    private String tipoDeDocumento;
    @NotNull
    @Positive
    private Long numeroDeDocumento;
    @NotBlank
    private String nombreCompleto;
    @NotNull
    @Positive
    private Long telefono;
    @NotBlank
    @Email
    private String correoElectronico;
    @NotNull
    private Rol rol;
    private String contrasena;
}
