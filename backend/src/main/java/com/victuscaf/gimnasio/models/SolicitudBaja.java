package com.victuscaf.gimnasio.models;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Solicitud de desactivación voluntaria de un cliente particular mensual
 * (CLT-0005).
 *
 * <p>El cliente la crea desde su portal; un administrador la aprueba (ejecuta
 * la baja y libera el entrenador) o la rechaza con una observación.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudBaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private ParticularMensual cliente;

    private LocalDate fechaSolicitud;
    private LocalTime horaSolicitud;
    private String motivo;

    @Enumerated(EnumType.STRING)
    private EstadoSolicitudBaja estado;

    private String observacionAdmin;
    private LocalDate fechaRespuesta;
}
