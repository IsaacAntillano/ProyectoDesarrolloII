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
 * Relacion entre un cliente y el entrenador que lo acompania.
 *
 * <p>Reemplaza el contador suelto de {@link Entrenador#getCantidadClientesActivos()}:
 * permite saber quien atiende a cada cliente, liberar el cupo al cancelar y
 * distinguir el entrenador del primer mes del servicio plus.
 *
 * <p>Un cliente solo puede tener una asignacion activa a la vez; el servicio
 * cierra la anterior antes de crear una nueva.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionEntrenador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private Usuario cliente;

    @ManyToOne(optional = false)
    @JoinColumn(name = "entrenador_id")
    private Entrenador entrenador;

    private LocalDate fechaAsignacion;
    private LocalDate fechaFin; // null = sin fecha de corte (servicio plus vigente)

    private boolean activa;

    @Enumerated(EnumType.STRING)
    private OrigenAsignacion origen;
}
