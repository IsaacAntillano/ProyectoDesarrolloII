package com.victuscaf.gimnasio.models;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
public abstract  class UsuarioSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuarioSistema;
    private String tipoDeDocumento;
    @Column(unique = true, nullable = false)
    private Long numeroDeDocumento;
    private String nombreCompleto;
    private Long telefono;
    private String correoElectronico;
    // La contrasena nunca debe salir en una respuesta JSON.
    @JsonIgnore
    private String contrasena;
    private Boolean estado;
    private Rol rol;
}
