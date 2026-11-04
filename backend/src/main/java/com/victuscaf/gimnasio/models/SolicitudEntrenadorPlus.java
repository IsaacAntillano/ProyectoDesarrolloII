package com.victuscaf.gimnasio.models;

import java.time.LocalDate;

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
 * Solicitud del servicio de entrenador plus hecha desde el portal del cliente.
 *
 * <p>Solo se permite despues del primer mes de contrato y cuando el cliente no
 * tiene una asignacion activa. La aprueba o rechaza un administrador; al
 * aprobarla se crea la {@link AsignacionEntrenador} correspondiente.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudEntrenadorPlus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private ParticularMensual cliente;

    private LocalDate fechaSolicitud;

    @Enumerated(EnumType.STRING)
    private EstadoSolicitudPlus estado;

    private String observacion;

    @ManyToOne
    @JoinColumn(name = "entrenador_id")
    private Entrenador entrenadorAsignado;

    private LocalDate fechaRespuesta;
}
