package com.victuscaf.gimnasio.dto;

import com.victuscaf.gimnasio.models.TipoDeMembresia;
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