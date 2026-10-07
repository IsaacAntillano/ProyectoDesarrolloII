package com.victuscaf.gimnasio.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.victuscaf.gimnasio.dto.ApiResponse;
import com.victuscaf.gimnasio.dto.ProgresoDTO;
import com.victuscaf.gimnasio.models.Asistencia;
import com.victuscaf.gimnasio.models.EvaluacionFisica;
import com.victuscaf.gimnasio.models.MetaFisica;
import com.victuscaf.gimnasio.models.Rutina;
import com.victuscaf.security.RolHeaderFilter;
import com.victuscaf.gimnasio.service.AsistenciaService;
import com.victuscaf.gimnasio.service.ClienteService;
import com.victuscaf.gimnasio.service.EvaluacionService;
import com.victuscaf.gimnasio.service.RutinaService;

import lombok.RequiredArgsConstructor;

/**
 * Panel del cliente: su membresia, rutina, progreso e historial de ingresos.
 *
 * <p>El cliente se identifica por {@code X-Documento}. Solo puede consultar sus
 * propios datos: el documento sale del header, no de la ruta, asi que no hay
 * forma de ver el progreso de otra persona.
 *
 * <p>El rol ADMINISTRADOR tambien entra, por si necesita consultar el estado de
 * un cliente sin pasar por otro endpoint.
 */
@RestController
@RequestMapping("/api/cliente")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE') or hasRole('ADMINISTRADOR')")
public class ClientePanelController {

    private final ClienteService clienteService;
    private final EvaluacionService evaluacionService;
    private final RutinaService rutinaService;
    private final AsistenciaService asistenciaService;

    /** Datos basicos del cliente autenticado, con estado de membresia. */
    @GetMapping("/perfil")
    public ResponseEntity<ApiResponse<Object>> miPerfil() {
        return ResponseEntity.ok(ApiResponse.success("Perfil del cliente",
                clienteService.consultarClientePorDocumento(documentoActual())));
    }

    /** Progreso fisico: peso perdido, IMC y porcentaje de grasa. */
    @GetMapping("/progreso")
    public ResponseEntity<ApiResponse<ProgresoDTO>> miProgreso() {
        return ResponseEntity.ok(ApiResponse.success("Progreso fisico",
                evaluacionService.consultarProgreso(documentoActual())));
    }

    /** Historial de evaluaciones fisicas del cliente. */
    @GetMapping("/evaluaciones")
    public ResponseEntity<ApiResponse<List<EvaluacionFisica>>> misEvaluaciones() {
        return ResponseEntity.ok(ApiResponse.success("Historial de evaluaciones",
                evaluacionService.consultarHistorial(documentoActual())));
    }

    /** Rutinas activas que el entrenador le asigno. */
    @GetMapping("/rutinas")
    public ResponseEntity<ApiResponse<List<Rutina>>> misRutinas() {
        return ResponseEntity.ok(ApiResponse.success("Rutinas activas",
                rutinaService.listarRutinasActivas(documentoActual())));
    }

    /** Historial de ingresos al gimnasio. */
    @GetMapping("/asistencias")
    public ResponseEntity<ApiResponse<List<Asistencia>>> misAsistencias() {
        return ResponseEntity.ok(ApiResponse.success("Historial de asistencias",
                asistenciaService.listarPorUsuario(documentoActual())));
    }

    private Long documentoActual() {
        String documento = RolHeaderFilter.documentoActual();
        if (documento == null) {
            throw new RuntimeException(
                    "Falta el header X-Documento: la vista debe enviar el documento del cliente");
        }
        try {
            return Long.parseLong(documento);
        } catch (NumberFormatException e) {
            throw new RuntimeException("El documento enviado no es un numero valido: " + documento);
        }
    }
}