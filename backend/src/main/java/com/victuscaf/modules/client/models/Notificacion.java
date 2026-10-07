package com.victuscaf.modules.client.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaGeneracion;
    private String contenido;
    private boolean leida;
    private String tipo;

    @ManyToOne
    @JoinColumn(name = "usuario_sistema_id")
    private UsuarioSistema usuarioSistema;
}