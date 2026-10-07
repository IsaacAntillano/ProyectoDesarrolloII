package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;

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
    private String contrasena;
    private Boolean estado;
    private Rol rol;
}
