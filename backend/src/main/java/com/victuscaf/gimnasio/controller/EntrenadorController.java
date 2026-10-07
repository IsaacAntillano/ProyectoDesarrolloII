package com.victuscaf.gimnasio.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.victuscaf.gimnasio.dto.ApiResponse;
import com.victuscaf.gimnasio.dto.HorarioDTO;
import com.victuscaf.gimnasio.dto.MedidasDTO;
import com.victuscaf.gimnasio.dto.MetaEPSDTO;
import com.victuscaf.gimnasio.dto.MetaParticularDTO;
import com.victuscaf.gimnasio.dto.MensajeDTO;
import com.victuscaf.gimnasio.dto.RutinaDTO;
import com.victuscaf.gimnasio.models.EvaluacionFisica;
import com.victuscaf.gimnasio.models.HorarioEntrenador;
import com.victuscaf.gimnasio.models.MetaFisica;
import com.victuscaf.gimnasio.models.Rutina;
import com.victuscaf.security.RolHeaderFilter;
import com.victuscaf.gimnasio.service.EntrenadorService;
import com.victuscaf.gimnasio.service.EvaluacionService;
import com.victuscaf.gimnasio.service.UsuarioSistemaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Panel del entrenador: horarios, rutinas, evaluacion fisica y metas.
 *
 * <p>El entrenador se identifica por el header {@code X-Documento} (lo inyecta
 * la vista desde {@code localStorage['user']}), no por un parametro de ruta:
 * asi una llamada no puede hacerse en nombre de otro entrenador.
 */
@RestController
@RequestMapping("/api/entrenador")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ENTRENADOR') or hasRole('ADMINISTRADOR')")
public class EntrenadorController {

    private final EntrenadorService entrenadorService;
    private final EvaluacionService evaluacionService;
    private final UsuarioSistemaService usuarioSistemaService;

    // ─── Identidad ───────────────────────────────────────────────────

    /** Datos del entrenador que esta llamando, leidos del header. */
    @GetMapping("/perfil")
    public ResponseEntity<ApiResponse<Object>> miPerfil() {
        return ResponseEntity.ok(ApiResponse.success("Perfil del entrenador",
                usuarioSistemaService.buscarPorDocumento(documentoActual())));
    }

    // ─── Horarios ────────────────────────────────────────────────────

    @PostMapping("/horarios")
    public ResponseEntity<ApiResponse<HorarioEntrenador>> crearHorario(@Valid @RequestBody HorarioDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Horario creado",
                entrenadorService.crearHorario(documentoActual(), dto)));
    }

    @GetMapping("/horarios")
    public ResponseEntity<ApiResponse<List<HorarioEntrenador>>> misHorarios() {
        return ResponseEntity.ok(ApiResponse.success("Horarios del entrenador",
                entrenadorService.listarHorariosDelEntrenador(documentoActual())));
    }

    /** Asigna un horario a un cliente con membresia Plus. */
    @PostMapping("/horarios/{idHorario}/asignar/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Void>> asignarHorario(
            @PathVariable Long idHorario,
            @PathVariable Long numeroDocumento) {
        entrenadorService.asignarHorarioAClientePlus(idHorario, numeroDocumento);
        return ResponseEntity.ok(ApiResponse.success("Horario asignado al cliente", null));
    }

    // ─── Rutinas ─────────────────────────────────────────────────────

    @GetMapping("/rutinas")
    public ResponseEntity<ApiResponse<List<Rutina>>> listarRutinas() {
        return ResponseEntity.ok(ApiResponse.success("Rutinas del entrenador",
                entrenadorService.listarRutinas(documentoActual())));
    }

    @PostMapping("/rutinas/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Rutina>> crearRutina(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody RutinaDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Rutina creada",
                entrenadorService.crearRutina(documentoActual(), numeroDocumento, dto)));
    }

    // ─── Mensajes ────────────────────────────────────────────────────

    @PostMapping("/mensajes/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Void>> enviarMensaje(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MensajeDTO dto) {
        entrenadorService.enviarMensaje(documentoActual(), numeroDocumento, dto.contenido());
        return ResponseEntity.ok(ApiResponse.success("Mensaje enviado al cliente", null));
    }

    // ─── Evaluacion fisica ───────────────────────────────────────────

    @PostMapping("/evaluaciones/inicial/{numeroDocumento}")
    public ResponseEntity<ApiResponse<EvaluacionFisica>> evaluacionInicial(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MedidasDTO medidas) {
        return ResponseEntity.ok(ApiResponse.success("Evaluacion inicial registrada",
                evaluacionService.crearEvaluacionInicial(numeroDocumento, documentoActual(), medidas)));
    }

    @PostMapping("/evaluaciones/periodica/{numeroDocumento}")
    public ResponseEntity<ApiResponse<EvaluacionFisica>> evaluacionPeriodica(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MedidasDTO medidas) {
        return ResponseEntity.ok(ApiResponse.success("Evaluacion periodica registrada",
                evaluacionService.registrarEvaluacionPeriodica(numeroDocumento, documentoActual(), medidas)));
    }

    /** Historial de evaluaciones del cliente, para el seguimiento del entrenador. */
    @GetMapping("/clientes/{numeroDocumento}/evaluaciones")
    public ResponseEntity<ApiResponse<List<EvaluacionFisica>>> historialCliente(
            @PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Historial de evaluaciones",
                evaluacionService.consultarHistorial(numeroDocumento)));
    }

    // ─── Metas ───────────────────────────────────────────────────────

    @PostMapping("/metas/particular/{numeroDocumento}")
    public ResponseEntity<ApiResponse<MetaFisica>> metaParticular(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MetaParticularDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Meta registrada",
                evaluacionService.crearMetaParticular(numeroDocumento, dto)));
    }

    @PostMapping("/metas/eps/{numeroDocumento}")
    public ResponseEntity<ApiResponse<MetaFisica>> metaEps(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MetaEPSDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Meta registrada",
                evaluacionService.crearMetaEPS(numeroDocumento, dto)));
    }

    /**
     * Documento del entrenador autenticado, leido del principal que arma
     * {@link RolHeaderFilter} a partir de {@code X-Documento}.
     */
    private Long documentoActual() {
        String documento = RolHeaderFilter.documentoActual();
        if (documento == null) {
            throw new RuntimeException(
                    "Falta el header X-Documento: la vista debe enviar el documento del entrenador");
        }
        try {
            return Long.parseLong(documento);
        } catch (NumberFormatException e) {
            throw new RuntimeException("El documento enviado no es un numero valido: " + documento);
        }
    }
}