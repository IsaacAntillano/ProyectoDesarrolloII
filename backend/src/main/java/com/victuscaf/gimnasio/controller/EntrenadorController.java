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
import com.victuscaf.gimnasio.dto.ClienteAsignadoDTO;
import com.victuscaf.gimnasio.dto.HorarioDTO;
import com.victuscaf.gimnasio.dto.MedidasDTO;
import com.victuscaf.gimnasio.dto.MetaEPSDTO;
import com.victuscaf.gimnasio.dto.MetaParticularDTO;
import com.victuscaf.gimnasio.dto.MensajeDTO;
import com.victuscaf.gimnasio.dto.ReporteProgresoEpsDTO;
import com.victuscaf.gimnasio.dto.RutinaDTO;
import com.victuscaf.gimnasio.models.EvaluacionFisica;
import com.victuscaf.gimnasio.models.HorarioEntrenador;
import com.victuscaf.gimnasio.models.Mensaje;
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
 * <p>El entrenador se identifica desde el token JWT (el principal es
 * {@code "ROL:documento"}), no por un parámetro de ruta: así una llamada no
 * puede hacerse en nombre de otro entrenador.
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

    /** Clientes activos que tiene asignados el entrenador autenticado. */
    @GetMapping("/clientes")
    public ResponseEntity<ApiResponse<List<ClienteAsignadoDTO>>> misClientes() {
        return ResponseEntity.ok(ApiResponse.success("Clientes asignados",
                entrenadorService.listarClientesAsignados(documentoActual())));
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

    /** Mensajes que este entrenador le envió al cliente (GE-0009). */
    @GetMapping("/clientes/{numeroDocumento}/mensajes")
    public ResponseEntity<ApiResponse<List<Mensaje>>> mensajesDelCliente(
            @PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Mensajes enviados al cliente",
                entrenadorService.listarMensajesEnviados(documentoActual(), numeroDocumento)));
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
                evaluacionService.consultarHistorial(documentoActual(), numeroDocumento)));
    }

    /** Progreso físico del cliente (EF-0007). Solo si está asignado a este entrenador. */
    @GetMapping("/clientes/{numeroDocumento}/progreso")
    public ResponseEntity<ApiResponse<com.victuscaf.gimnasio.dto.ProgresoDTO>> progresoCliente(
            @PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Progreso físico del cliente",
                entrenadorService.consultarProgresoDeCliente(documentoActual(), numeroDocumento)));
    }

    /** Rutinas activas del cliente (GE-0008). Solo si está asignado a este entrenador. */
    @GetMapping("/clientes/{numeroDocumento}/rutinas")
    public ResponseEntity<ApiResponse<List<Rutina>>> rutinasCliente(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Rutinas activas del cliente",
                entrenadorService.listarRutinasDeCliente(documentoActual(), numeroDocumento)));
    }

    // ─── Metas ───────────────────────────────────────────────────────

    @PostMapping("/metas/particular/{numeroDocumento}")
    public ResponseEntity<ApiResponse<MetaFisica>> metaParticular(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MetaParticularDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Meta registrada",
                evaluacionService.crearMetaParticular(documentoActual(), numeroDocumento, dto)));
    }

    @PostMapping("/metas/eps/{numeroDocumento}")
    public ResponseEntity<ApiResponse<MetaFisica>> metaEps(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody MetaEPSDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Meta registrada",
                evaluacionService.crearMetaEPS(documentoActual(), numeroDocumento, dto)));
    }

    /** Meta vigente del cliente (EF-0006). */
    @GetMapping("/clientes/{numeroDocumento}/metas")
    public ResponseEntity<ApiResponse<MetaFisica>> metaCliente(
            @PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Meta vigente del cliente",
                evaluacionService.consultarMeta(documentoActual(), numeroDocumento)));
    }

    // ─── Reporte EPS (EF-0008) ───────────────────────────────────────

    /** Reporte de progreso físico de un beneficiario EPS, para imprimir o guardar como PDF. */
    @GetMapping("/clientes/{numeroDocumento}/reporte-eps")
    public ResponseEntity<ApiResponse<ReporteProgresoEpsDTO>> reporteEps(
            @PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Reporte de progreso EPS",
                entrenadorService.generarReporteEps(documentoActual(), numeroDocumento)));
    }

    /**
     * Documento del entrenador autenticado, leido del principal que arma
     * {@code JwtAuthFilter} a partir del token JWT.
     */
    private Long documentoActual() {
        String documento = RolHeaderFilter.documentoActual();
        if (documento == null) {
            throw new RuntimeException(
                    "Falta el documento del entrenador en el token JWT");
        }
        try {
            return Long.parseLong(documento);
        } catch (NumberFormatException e) {
            throw new RuntimeException("El documento enviado no es un numero valido: " + documento);
        }
    }
}