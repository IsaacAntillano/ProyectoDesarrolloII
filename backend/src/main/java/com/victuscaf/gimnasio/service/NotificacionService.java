package com.victuscaf.gimnasio.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.BeneficiarioEps;
import com.victuscaf.gimnasio.models.Notificacion;
import com.victuscaf.gimnasio.repository.BeneficiarioEpsRepository;
import com.victuscaf.gimnasio.repository.NotificacionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Genera y administra las notificaciones internas (alertas administrativas).
 *
 * <p>A diferencia de la version anterior, que solo imprimitia por consola,
 * cada notificacion se persiste en la tabla `notificacion` y se puede consultar
 * y marcar como leida.
 */
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;

    private static final String TIPO_COPAGO_PENDIENTE = "COPAGO_PENDIENTE";

    /** Persiste una alerta de copago pendiente para un beneficiario EPS. */
    @Transactional
    public Notificacion generarReporteCopagoPendiente(BeneficiarioEps eps) {
        String entidad = eps.getRemision() != null ? eps.getRemision().getEntidadEps() : "EPS no especificada";
        Notificacion notificacion = new Notificacion();
        notificacion.setFechaGeneracion(LocalDate.now());
        notificacion.setTipo(TIPO_COPAGO_PENDIENTE);
        notificacion.setContenido("Reporte de copago pendiente para EPS " + entidad
                + " - Paciente: " + eps.getNombreCompleto());
        notificacion.setLeida(false);
        return notificacionRepository.save(notificacion);
    }

    /** Alerta de copago a partir del documento del beneficirio. */
    @Transactional
    public Notificacion notificarCopagoPorDocumento(Long numeroDocumento) {
        BeneficiarioEps eps = beneficiarioEpsRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Beneficiario EPS no encontrado"));
        return generarReporteCopagoPendiente(eps);
    }

    @Transactional(readOnly = true)
    public List<Notificacion> listarTodas() {
        return notificacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Notificacion> listarNoLeidas() {
        return notificacionRepository.findAll().stream()
                .filter(n -> !n.isLeida())
                .toList();
    }

    @Transactional
    public Notificacion marcarLeida(Long id) {
        Notificacion n = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificacion no encontrada"));
        n.setLeida(true);
        return notificacionRepository.save(n);
    }
}