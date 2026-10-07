package com.victuscaf.modules.client.dto;

import com.victuscaf.modules.client.models.TipoDeMembresia;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class ActualizarClienteDTO {
    private String nombreCompleto;
    private LocalDate fechaDeNacimiento;
    private Long telefono;
    private String correoElectronico;
    private String contrasena;
    private TipoDeMembresia tipoMembresia; // solo para particular mensual
}