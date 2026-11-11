package com.victuscaf.gimnasio.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.victuscaf.gimnasio.dto.ApiResponse;
import com.victuscaf.gimnasio.dto.AprobarSolicitudPlusDTO;
import com.victuscaf.gimnasio.dto.EquipoDTO;
import com.victuscaf.gimnasio.dto.HorarioDisponibleDTO;
import com.victuscaf.gimnasio.dto.RespuestaSolicitudPlusDTO;
import com.victuscaf.gimnasio.dto.TarifaUpdateDTO;
import com.victuscaf.gimnasio.models.Equipo;
import com.victuscaf.gimnasio.models.EstadoSolicitudPlus;
import com.victuscaf.gimnasio.models.FlujoDeCaja;
import com.victuscaf.gimnasio.models.SolicitudEntrenadorPlus;
import com.victuscaf.gimnasio.models.Tarifa;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import com.victuscaf.gimnasio.models.UsuarioSistema;
import com.victuscaf.gimnasio.repository.UsuarioSistemaRepository;
import com.victuscaf.gimnasio.service.AdminService;
import com.victuscaf.gimnasio.service.EntrenadorService;
import com.victuscaf.gimnasio.service.InventarioService;
import com.victuscaf.gimnasio.service.SolicitudPlusService;
import com.victuscaf.security.RolHeaderFilter;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints administrativos: tarifas, inventario de equipos y flujo de caja.
 *
 * <p>El rol ADMINISTRADOR llega exclusivamente por el token JWT; ver el aviso de seguridad en el README.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminController {

    private final AdminService adminService;
    private final InventarioService inventarioService;
    private final SolicitudPlusService solicitudPlusService;
    private final EntrenadorService entrenadorService;
    private final UsuarioSistemaRepository usuarioSistemaRepository;

    // ─── Tarifas ─────────────────────────────────────────────────────

    @GetMapping("/tarifas")
    public ResponseEntity<ApiResponse<List<Tarifa>>> listarTarifas() {
        return ResponseEntity.ok(
                ApiResponse.success("Lista de tarifas", adminService.listarTarifas()));
    }

    @PutMapping("/tarifas/{tipo}")
    public ResponseEntity<ApiResponse<Tarifa>> actualizarTarifa(
            @PathVariable TipoDeCliente tipo,
            @Valid @RequestBody TarifaUpdateDTO dto) {
        // El tipo de la ruta manda: el body no puede cambiar de tipo de cliente.
        // El administrador que modifica sale del token, no del body: el campo
        // del DTO lo podria falsificar el cliente.
        Tarifa tarifa = adminService.actualizarTarifa(
                tipo, dto.valorMensual(), dto.valorDiario(), dto.valorPlus(), adminActualId());
        return ResponseEntity.ok(ApiResponse.success("Tarifa actualizada", tarifa));
    }

    /** Id de base del administrador autenticado, segun el documento del token. */
    private Long adminActualId() {
        Long documento = documentoActual();
        if (documento == null) {
            return null;
        }
        return usuarioSistemaRepository.findByNumeroDeDocumento(documento)
                .map(UsuarioSistema::getIdUsuarioSistema)
                .orElse(null);
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

    // ─── Equipos ─────────────────────────────────────────────────────

    @GetMapping("/equipos")
    public ResponseEntity<ApiResponse<List<Equipo>>> listarEquipos() {
        return ResponseEntity.ok(
                ApiResponse.success("Lista de equipos", adminService.listarEquipos()));
    }

    @GetMapping("/equipos/mantenimiento-proximo")
    public ResponseEntity<ApiResponse<List<Equipo>>> listarEquiposMantenimientoProximo() {
        return ResponseEntity.ok(
                ApiResponse.success("Equipos con mantenimiento proximo",
                        inventarioService.equiposPorMantenimientoProximo()));
    }

    @PostMapping("/equipos")
    public ResponseEntity<ApiResponse<Equipo>> crearEquipo(@Valid @RequestBody EquipoDTO dto) {
        return ResponseEntity.ok(
                ApiResponse.success("Equipo creado", inventarioService.crearEquipo(dto)));
    }

    // ─── Solicitudes de entrenador plus ─────────────────────────────

    @GetMapping("/solicitudes-plus")
    public ResponseEntity<ApiResponse<List<SolicitudEntrenadorPlus>>> listarSolicitudesPlus(
            @RequestParam(required = false) EstadoSolicitudPlus estado) {
        return ResponseEntity.ok(ApiResponse.success("Solicitudes de entrenador plus",
                solicitudPlusService.listar(estado)));
    }

    @PutMapping("/solicitudes-plus/{id}/aprobar")
    public ResponseEntity<ApiResponse<SolicitudEntrenadorPlus>> aprobarSolicitudPlus(
            @PathVariable Long id,
            @RequestBody(required = false) AprobarSolicitudPlusDTO dto) {
        Long documentoEntrenador = dto == null ? null : dto.documentoEntrenador();
        return ResponseEntity.ok(ApiResponse.success("Solicitud plus aprobada",
                solicitudPlusService.aprobar(id, documentoEntrenador)));
    }

    @PutMapping("/solicitudes-plus/{id}/rechazar")
    public ResponseEntity<ApiResponse<SolicitudEntrenadorPlus>> rechazarSolicitudPlus(
            @PathVariable Long id,
            @RequestBody(required = false) RespuestaSolicitudPlusDTO dto) {
        String observacion = dto == null ? null : dto.observacion();
        return ResponseEntity.ok(ApiResponse.success("Solicitud plus rechazada",
                solicitudPlusService.rechazar(id, observacion)));
    }

    // ─── Flujo de caja ──────────────────────────────────────────────
    @GetMapping("/flujo-caja")
    public ResponseEntity<ApiResponse<FlujoDeCaja>> consultarFlujoCaja(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(
                ApiResponse.success("Flujo de caja consultado", adminService.consultarFlujoCaja(fecha)));
    }

    // ─── Horarios de beneficiarios EPS (GE-0006) ─────────────────────

    /** Cupos libres del entrenador asignado al beneficiario EPS. */
    @GetMapping("/eps/{numeroDocumento}/horarios-disponibles")
    public ResponseEntity<ApiResponse<List<HorarioDisponibleDTO>>> horariosDisponiblesEps(
            @PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Horarios disponibles del beneficiario EPS",
                entrenadorService.listarHorariosDisponiblesParaEps(numeroDocumento)));
    }

    /** Asigna un horario del entrenador al beneficiario EPS. */
    @PutMapping("/eps/{numeroDocumento}/horarios/{idHorario}")
    public ResponseEntity<ApiResponse<Void>> asignarHorarioEps(
            @PathVariable Long numeroDocumento,
            @PathVariable Long idHorario) {
        entrenadorService.asignarHorarioAEps(idHorario, numeroDocumento);
        return ResponseEntity.ok(ApiResponse.success("Horario asignado al beneficiario EPS", null));
    }
}