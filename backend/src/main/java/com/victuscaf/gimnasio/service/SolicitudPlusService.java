package com.victuscaf.gimnasio.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.Entrenador;
import com.victuscaf.gimnasio.models.EstadoSolicitudPlus;
import com.victuscaf.gimnasio.models.OrigenAsignacion;
import com.victuscaf.gimnasio.models.ParticularMensual;
import com.victuscaf.gimnasio.models.SolicitudEntrenadorPlus;
import com.victuscaf.gimnasio.repository.EntrenadorRepository;
import com.victuscaf.gimnasio.repository.ParticularMensualRepository;
import com.victuscaf.gimnasio.repository.SolicitudEntrenadorPlusRepository;

import lombok.RequiredArgsConstructor;

/**
 * Flujo del servicio de entrenador plus (PC-0011).
 *
 * <p>El cliente puede solicitarlo despues de cumplir el primer mes de contrato
 * y solo si no tiene un entrenador activo. El administrador aprueba o rechaza;
 * al aprobar se crea la asignacion y se activa la bandera del cliente.
 */
@Service
@RequiredArgsConstructor
public class SolicitudPlusService {

    private final SolicitudEntrenadorPlusRepository solicitudRepository;
    private final ParticularMensualRepository particularMensualRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final AsignacionEntrenadorService asignacionService;

    @Transactional
    public SolicitudEntrenadorPlus solicitar(Long numeroDocumento, String observacion) {
        ParticularMensual cliente = buscarCliente(numeroDocumento);

        if (cliente.getContrato() == null) {
            throw new RuntimeException("El cliente no tiene un contrato registrado");
        }
        LocalDate habilitadoDesde = cliente.getContrato().getFechaInicio().plusMonths(1);
        if (LocalDate.now().isBefore(habilitadoDesde)) {
            throw new RuntimeException("El servicio plus solo se puede solicitar despues del primer mes de contrato");
        }
        if (asignacionService.asignacionActiva(cliente).isPresent()) {
            throw new RuntimeException("El cliente ya tiene un entrenador activo");
        }
        if (solicitudRepository.existsByClienteAndEstado(cliente, EstadoSolicitudPlus.PENDIENTE)) {
            throw new RuntimeException("Ya existe una solicitud plus pendiente para este cliente");
        }

        SolicitudEntrenadorPlus solicitud = new SolicitudEntrenadorPlus();
        solicitud.setCliente(cliente);
        solicitud.setFechaSolicitud(LocalDate.now());
        solicitud.setEstado(EstadoSolicitudPlus.PENDIENTE);
        solicitud.setObservacion(observacion);
        return solicitudRepository.save(solicitud);
    }

    @Transactional(readOnly = true)
    public List<SolicitudEntrenadorPlus> listarDeCliente(Long numeroDocumento) {
        ParticularMensual cliente = buscarCliente(numeroDocumento);
        return solicitudRepository.findByClienteOrderByFechaSolicitudDesc(cliente);
    }

    @Transactional(readOnly = true)
    public List<SolicitudEntrenadorPlus> listar(EstadoSolicitudPlus estado) {
        if (estado == null) {
            return solicitudRepository.findAllByOrderByFechaSolicitudDesc();
        }
        return solicitudRepository.findByEstadoOrderByFechaSolicitudDesc(estado);
    }

    /**
     * Aprueba la solicitud. Si no se indica entrenador se elige el que tenga
     * menos clientes activos y cupo disponible.
     */
    @Transactional
    public SolicitudEntrenadorPlus aprobar(Long idSolicitud, Long documentoEntrenador) {
        SolicitudEntrenadorPlus solicitud = buscarPendiente(idSolicitud);
        Entrenador entrenador = documentoEntrenador == null
                ? elegirEntrenadorConCupo()
                : buscarEntrenador(documentoEntrenador);

        asignacionService.asignar(solicitud.getCliente(), entrenador, OrigenAsignacion.PLUS, null);

        ParticularMensual cliente = solicitud.getCliente();
        cliente.setTieneEntrenador(true);
        particularMensualRepository.save(cliente);

        solicitud.setEstado(EstadoSolicitudPlus.APROBADA);
        solicitud.setEntrenadorAsignado(entrenador);
        solicitud.setFechaRespuesta(LocalDate.now());
        return solicitudRepository.save(solicitud);
    }

    @Transactional
    public SolicitudEntrenadorPlus rechazar(Long idSolicitud, String observacion) {
        SolicitudEntrenadorPlus solicitud = buscarPendiente(idSolicitud);
        solicitud.setEstado(EstadoSolicitudPlus.RECHAZADA);
        solicitud.setObservacion(observacion);
        solicitud.setFechaRespuesta(LocalDate.now());
        return solicitudRepository.save(solicitud);
    }

    private SolicitudEntrenadorPlus buscarPendiente(Long idSolicitud) {
        SolicitudEntrenadorPlus solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new RuntimeException("Solicitud plus no encontrada"));
        if (solicitud.getEstado() != EstadoSolicitudPlus.PENDIENTE) {
            throw new RuntimeException("La solicitud ya fue respondida");
        }
        return solicitud;
    }

    private ParticularMensual buscarCliente(Long numeroDocumento) {
        return particularMensualRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente particular mensual no encontrado"));
    }

    private Entrenador buscarEntrenador(Long numeroDocumento) {
        Entrenador entrenador = entrenadorRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));
        if (!Boolean.TRUE.equals(entrenador.getEstado())) {
            throw new RuntimeException("El entrenador no esta activo");
        }
        if (asignacionService.contarClientesActivos(entrenador) >= AsignacionEntrenadorService.MAX_CLIENTES_POR_ENTRENADOR) {
            throw new RuntimeException("El entrenador ya tiene el maximo de clientes activos");
        }
        return entrenador;
    }

    private Entrenador elegirEntrenadorConCupo() {
        return entrenadorRepository.findByEstadoTrue().stream()
                .filter(e -> asignacionService.contarClientesActivos(e)
                        < AsignacionEntrenadorService.MAX_CLIENTES_POR_ENTRENADOR)
                .min(Comparator.comparingLong(asignacionService::contarClientesActivos))
                .orElseThrow(() -> new RuntimeException(
                        "No hay entrenadores con cupo disponible en este momento"));
    }
}
