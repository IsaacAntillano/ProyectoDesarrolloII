package com.victuscaf.modules.client.controller;

import com.victuscaf.modules.client.dto.*;
import com.victuscaf.modules.client.models.*;
import com.victuscaf.modules.client.service.ClienteService;
import com.victuscaf.modules.client.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    // ==================== PARTICULAR MENSUAL ====================

    @PostMapping("/mensual")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularMensual>> registrarParticularMensual(@Valid @RequestBody ClienteMensualDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente particular mensual registrado correctamente",
                        clienteService.registrarParticularMensual(dto)));
    }

    @GetMapping("/mensual/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularMensual>> consultarParticularMensual(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Cliente encontrado",
                clienteService.consultarParticularMensualPorDocumento(numeroDocumento)));
    }

    // Endpoint temporal de depuración (sin autorización) para revisar datos relacionados
    @GetMapping("/debug/mensual/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> debugConsultarParticularMensual(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Debug cliente",
                clienteService.debugConsultarParticularMensual(numeroDocumento)));
    }

    @PutMapping("/mensual/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularMensual>> actualizarParticularMensual(@PathVariable Long numeroDocumento,
                                                                                      @Valid @RequestBody ActualizarClienteDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado correctamente",
                clienteService.actualizarParticularMensual(numeroDocumento, dto)));
    }

    @DeleteMapping("/mensual/{numeroDocumento}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Void>> desactivarParticularMensual(@PathVariable Long numeroDocumento) {
        clienteService.desactivarParticularMensual(numeroDocumento);
        return ResponseEntity.ok(ApiResponse.success("Cliente particular mensual desactivado", null));
    }

    @PutMapping("/mensual/{numeroDocumento}/reactivar")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularMensual>> reactivarParticularMensual(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Cliente particular mensual reactivado",
                clienteService.reactivarParticularMensual(numeroDocumento)));
    }

    // ==================== PARTICULAR DIARIO ====================

    @PostMapping("/diario")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularDiario>> registrarParticularDiario(@Valid @RequestBody ClienteDiarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente particular diario registrado correctamente",
                        clienteService.registrarParticularDiario(dto)));
    }

    @GetMapping("/diario/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularDiario>> consultarParticularDiario(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Cliente encontrado",
                clienteService.consultarParticularDiarioPorDocumento(numeroDocumento)));
    }

    @PutMapping("/diario/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularDiario>> actualizarParticularDiario(@PathVariable Long numeroDocumento,
                                                                                    @Valid @RequestBody ActualizarClienteDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado correctamente",
                clienteService.actualizarParticularDiario(numeroDocumento, dto)));
    }

    @DeleteMapping("/diario/{numeroDocumento}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Void>> desactivarParticularDiario(@PathVariable Long numeroDocumento) {
        clienteService.desactivarParticularDiario(numeroDocumento);
        return ResponseEntity.ok(ApiResponse.success("Cliente particular diario desactivado", null));
    }

    @PutMapping("/diario/{numeroDocumento}/reactivar")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularDiario>> reactivarParticularDiario(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Cliente particular diario reactivado",
                clienteService.reactivarParticularDiario(numeroDocumento)));
    }

    @PostMapping("/diario/migrar/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ParticularMensual>> migrarDiarioAMensual(@PathVariable Long numeroDocumento,
                                                                               @Valid @RequestBody MigracionDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Migración completada exitosamente",
                clienteService.migrarDiarioAMensual(numeroDocumento, dto)));
    }

    // ==================== BENEFICIARIO EPS ====================

    @PostMapping("/eps")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<BeneficiarioEps>> registrarBeneficiarioEPS(@Valid @RequestBody BeneficiarioEPSDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Beneficiario EPS registrado correctamente",
                        clienteService.registrarBeneficiarioEPS(dto)));
    }

    @GetMapping("/eps/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<BeneficiarioEps>> consultarBeneficiarioEPS(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Beneficiario encontrado",
                clienteService.consultarBeneficiarioEPSPorDocumento(numeroDocumento)));
    }

    @PutMapping("/eps/{numeroDocumento}")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<BeneficiarioEps>> actualizarBeneficiarioEPS(@PathVariable Long numeroDocumento,
                                                                                  @Valid @RequestBody ActualizarClienteDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Beneficiario actualizado correctamente",
                clienteService.actualizarBeneficiarioEPS(numeroDocumento, dto)));
    }

    @DeleteMapping("/eps/{numeroDocumento}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Void>> desactivarBeneficiarioEPS(@PathVariable Long numeroDocumento) {
        clienteService.desactivarBeneficiarioEPS(numeroDocumento);
        return ResponseEntity.ok(ApiResponse.success("Beneficiario EPS desactivado", null));
    }

    @PutMapping("/eps/{numeroDocumento}/reactivar")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<BeneficiarioEps>> reactivarBeneficiarioEPS(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Beneficiario EPS reactivado",
                clienteService.reactivarBeneficiarioEPS(numeroDocumento)));
    }

    // ==================== LISTADOS ====================

    @GetMapping("/mensuales/activos")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<ParticularMensual>>> listarParticularesMensualesActivos() {
        return ResponseEntity.ok(ApiResponse.success("Lista de clientes mensuales activos",
                clienteService.listarParticularesMensualesActivos()));
    }

    @GetMapping("/mensuales/todos")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<ParticularMensual>>> listarTodosParticularesMensuales() {
        return ResponseEntity.ok(ApiResponse.success("Lista completa de clientes mensuales",
                clienteService.listarTodosParticularesMensuales()));
    }

    @GetMapping("/diarios/activos")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<ParticularDiario>>> listarParticularesDiariosActivos() {
        return ResponseEntity.ok(ApiResponse.success("Lista de clientes diarios activos",
                clienteService.listarParticularesDiariosActivos()));
    }

    @GetMapping("/diarios/todos")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<ParticularDiario>>> listarTodosParticularesDiarios() {
        return ResponseEntity.ok(ApiResponse.success("Lista completa de clientes diarios",
                clienteService.listarTodosParticularesDiarios()));
    }

    @GetMapping("/eps/activos")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<BeneficiarioEps>>> listarBeneficiariosEPSActivos() {
        return ResponseEntity.ok(ApiResponse.success("Beneficiarios EPS activos",
                clienteService.consultarBeneficiariosEPSActivos()));
    }

    @GetMapping("/eps/todos")
    @PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<BeneficiarioEps>>> listarTodosBeneficiariosEPS() {
        return ResponseEntity.ok(ApiResponse.success("Lista completa de beneficiarios EPS",
                clienteService.listarTodosBeneficiariosEPS()));
    }

    @GetMapping("/contratos/vencidos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<ParticularMensual>>> listarContratosVencidos() {
        return ResponseEntity.ok(ApiResponse.success("Clientes con contrato vencido",
                clienteService.consultarContratosVencidos()));
    }
}