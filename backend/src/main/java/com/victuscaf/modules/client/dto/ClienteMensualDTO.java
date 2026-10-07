package com.victuscaf.modules.client.dto;

import com.victuscaf.modules.client.models.TipoDeMembresia;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteMensualDTO {
    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDeDocumento;

    @NotNull(message = "El número de documento es obligatorio")
    @Positive(message = "El número de documento debe ser positivo")
    private Long numeroDeDocumento;

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate fechaDeNacimiento;

    @NotNull(message = "El teléfono es obligatorio")
    @Positive(message = "El teléfono debe ser positivo")
    private Long telefono;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico debe ser válido")
    private String correoElectronico;

    @NotBlank(message = "La contraseña es obligatoria")
    private String contrasena;

    @NotNull(message = "El tipo de membresía es obligatorio")
    private TipoDeMembresia tipoMembresia;
}