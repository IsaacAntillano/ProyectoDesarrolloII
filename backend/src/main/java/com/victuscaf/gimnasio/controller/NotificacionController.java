package com.victuscaf.gimnasio.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.victuscaf.gimnasio.dto.ApiResponse;
import com.victuscaf.gimnasio.models.Notificacion;
import com.victuscaf.gimnasio.service.NotificacionService;

import lombok.RequiredArgsConstructor;

/**
 * Notificaciones administrativas del gimnasio (alertas de copago pendiente).
 *
 * <p>Antes existia un service pero ningun endpoint lo exponia, ni se
 * persistian las notificaciones. Ahora se pueden consultar y marcar como
 * leidas.
 */
@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('SECRETARIA')")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notificacion>>> listar() {
        return ResponseEntity.ok(ApiResponse.success("Notificaciones", notificacionService.listarTodas()));
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<ApiResponse<List<Notificacion>>> noLeidas() {
        return ResponseEntity.ok(ApiResponse.success("Sin leer", notificacionService.listarNoLeidas()));
    }

    /** Genera y persiste una alerta de copago pendiente para el beneficiario. */
    @PostMapping("/copago-pendiente/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Notificacion>> copagoPendiente(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Notificacion generada",
                notificacionService.notificarCopagoPorDocumento(numeroDocumento)));
    }

    @PutMapping("/{id}/leida")
    public ResponseEntity<ApiResponse<Notificacion>> marcarLeida(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Notificacion marcada como leida",
                notificacionService.marcarLeida(id)));
    }
}