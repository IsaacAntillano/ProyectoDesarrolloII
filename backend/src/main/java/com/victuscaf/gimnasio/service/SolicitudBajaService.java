package com.victuscaf.gimnasio.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.Contrato;
import com.victuscaf.gimnasio.models.EstadoContratoParticular;
import com.victuscaf.gimnasio.models.EstadoSolicitudBaja;
import com.victuscaf.gimnasio.models.ParticularMensual;
import com.victuscaf.gimnasio.models.SolicitudBaja;
import com.victuscaf.gimnasio.models.TipoAccion;
import com.victuscaf.gimnasio.repository.ParticularMensualRepository;
import com.victuscaf.gimnasio.repository.SolicitudBajaRepository;
import com.victuscaf.gimnasio.repository.UsuarioSistemaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Flujo de baja voluntaria de un cliente particular mensual (CLT-0005).
 *
 * <p>El cliente solicita la baja desde su portal; el administrador la aprueba
 * (desactiva el registro, cierra el contrato y libera el entrenador) o la
 * rechaza con una observación.
 */
@Service
@RequiredArgsConstructor
public class SolicitudBajaService {

    private final SolicitudBajaRepository solicitudRepository;
    private final ParticularMensualRepository particularMensualRepository;
    private final ClienteService clienteService;
    private final AsignacionEntrenadorService asignacionService;
    private final SeguridadService seguridadService;
    private final UsuarioSistemaRepository usuarioSistemaRepository;

    @Transactional
    public SolicitudBaja solicitar(Long numeroDocumento, String motivo) {
        ParticularMensual cliente = buscarCliente(numeroDocumento);
        if (!Boolean.TRUE.equals(cliente.getEstado())) {
            throw new RuntimeException("El cliente ya está inactivo");
        }
        if (solicitudRepository.existsByClienteAndEstado(cliente, EstadoSolicitudBaja.PENDIENTE)) {
            throw new RuntimeException("Ya existe una solicitud de baja pendiente para este cliente");
        }

        SolicitudBaja solicitud = new SolicitudBaja();
        solicitud.setCliente(cliente);
        solicitud.setFechaSolicitud(LocalDate.now());
        solicitud.setHoraSolicitud(LocalTime.now());
        solicitud.setMotivo(motivo);
        solicitud.setEstado(EstadoSolicitudBaja.PENDIENTE);
        return solicitudRepository.save(solicitud);
    }

    @Transactional(readOnly = true)
    public List<SolicitudBaja> listarDeCliente(Long numeroDocumento) {
        ParticularMensual cliente = buscarCliente(numeroDocumento);
        return solicitudRepository.findByClienteOrderByFechaSolicitudDescHoraSolicitudDesc(cliente);
    }

    @Transactional(readOnly = true)
    public List<SolicitudBaja> listar(EstadoSolicitudBaja estado) {
        if (estado == null) {
            return solicitudRepository.findAllByOrderByFechaSolicitudDescHoraSolicitudDesc();
        }
        return solicitudRepository.findByEstadoOrderByFechaSolicitudAscHoraSolicitudAsc(estado);
    }

    @Transactional
    public SolicitudBaja aprobar(Long idSolicitud, String observacion, Long documentoAdmin) {
        SolicitudBaja solicitud = buscarPendiente(idSolicitud);
        ParticularMensual cliente = solicitud.getCliente();

        clienteService.desactivarParticularMensual(cliente.getNumeroDeDocumento());
        asignacionService.liberar(cliente);

        // La baja voluntaria cierra el contrato en la fecha efectiva.
        Contrato contrato = cliente.getContrato();
        if (contrato != null) {
            contrato.setEstado(EstadoContratoParticular.VENCIDO);
            contrato.setFechaVencimiento(LocalDate.now());
            particularMensualRepository.save(cliente);
        }

        solicitud.setEstado(EstadoSolicitudBaja.APROBADA);
        solicitud.setObservacionAdmin(observacion);
        solicitud.setFechaRespuesta(LocalDate.now());
        registrarBitacora(documentoAdmin, "Baja aprobada del cliente "
                + cliente.getNumeroDeDocumento()
                + (observacion == null || observacion.isBlank() ? "" : " - Observación: " + observacion));
        return solicitudRepository.save(solicitud);
    }

    @Transactional
    public SolicitudBaja rechazar(Long idSolicitud, String observacion) {
        SolicitudBaja solicitud = buscarPendiente(idSolicitud);
        solicitud.setEstado(EstadoSolicitudBaja.RECHAZADA);
        solicitud.setObservacionAdmin(observacion);
        solicitud.setFechaRespuesta(LocalDate.now());
        return solicitudRepository.save(solicitud);
    }

    private SolicitudBaja buscarPendiente(Long idSolicitud) {
        SolicitudBaja solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new RuntimeException("Solicitud de baja no encontrada"));
        if (solicitud.getEstado() != EstadoSolicitudBaja.PENDIENTE) {
            throw new RuntimeException("La solicitud de baja ya fue respondida");
        }
        return solicitud;
    }

    private ParticularMensual buscarCliente(Long numeroDocumento) {
        return particularMensualRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente particular mensual no encontrado"));
    }

    private void registrarBitacora(Long documentoAdmin, String descripcion) {
        if (documentoAdmin == null) {
            return;
        }
        usuarioSistemaRepository.findByNumeroDeDocumento(documentoAdmin).ifPresent(admin ->
                seguridadService.registrarAccionEnBitacora(
                        admin.getIdUsuarioSistema(),
                        admin.getNombreCompleto(),
                        TipoAccion.DESACTIVACION,
                        descripcion));
    }
}
