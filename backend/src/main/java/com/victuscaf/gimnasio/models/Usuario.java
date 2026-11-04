package com.victuscaf.gimnasio.models;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class  Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String tipoDeDocumento;
    @Column(unique = true, nullable = false)
    private Long numeroDeDocumento;
    private String nombreCompleto;
    private LocalDate fechaDeNacimiento;
    private Long telefono;
    // La contrasena nunca debe salir en una respuesta JSON.
    @JsonIgnore
    private String contrasena;
    private String correoElectronico;
    private Boolean estado;
    @Enumerated(EnumType.STRING)
    private TipoDeCliente tipoDeCliente;

}
