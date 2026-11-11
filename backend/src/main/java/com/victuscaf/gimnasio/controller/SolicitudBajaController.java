package com.victuscaf.gimnasio.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.victuscaf.gimnasio.dto.ApiResponse;
import com.victuscaf.gimnasio.dto.RespuestaSolicitudBajaDTO;
import com.victuscaf.gimnasio.models.EstadoSolicitudBaja;
import com.victuscaf.gimnasio.models.SolicitudBaja;
import com.victuscaf.gimnasio.service.SolicitudBajaService;
import com.victuscaf.security.RolHeaderFilter;

import lombok.RequiredArgsConstructor;

/**
 * Bandeja administrativa de solicitudes de baja voluntaria (CLT-0005).
 */
@RestController
@RequestMapping("/api/admin/solicitudes-baja")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class SolicitudBajaController {

    private final SolicitudBajaService solicitudBajaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SolicitudBaja>>> listar(
            @RequestParam(required = false) EstadoSolicitudBaja estado) {
        return ResponseEntity.ok(ApiResponse.success("Solicitudes de baja",
                solicitudBajaService.listar(estado)));
    }

    @PutMapping("/{id}/aprobar")
    public ResponseEntity<ApiResponse<SolicitudBaja>> aprobar(
            @PathVariable Long id,
            @RequestBody(required = false) RespuestaSolicitudBajaDTO dto) {
        String observacion = dto == null ? null : dto.observacion();
        return ResponseEntity.ok(ApiResponse.success("Solicitud de baja aprobada",
                solicitudBajaService.aprobar(id, observacion, documentoActual())));
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<ApiResponse<SolicitudBaja>> rechazar(
            @PathVariable Long id,
            @RequestBody(required = false) RespuestaSolicitudBajaDTO dto) {
        String observacion = dto == null ? null : dto.observacion();
        return ResponseEntity.ok(ApiResponse.success("Solicitud de baja rechazada",
                solicitudBajaService.rechazar(id, observacion)));
    }

    private Long documentoActual() {
        String documento = RolHeaderFilter.documentoActual();
        if (documento == null) {
            return null;
        }
        try {
            return Long.parseLong(documento);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
