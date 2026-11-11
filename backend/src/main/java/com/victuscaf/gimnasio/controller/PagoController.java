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
import com.victuscaf.gimnasio.dto.FacturaEpsDetalleDTO;
import com.victuscaf.gimnasio.dto.GastoDTO;
import com.victuscaf.gimnasio.dto.PagoDTO;
import com.victuscaf.gimnasio.dto.PagoFacturaEpsDTO;
import com.victuscaf.gimnasio.models.FacturaEps;
import com.victuscaf.gimnasio.models.FlujoDeCaja;
import com.victuscaf.gimnasio.models.GastoOperativo;
import com.victuscaf.gimnasio.models.Pago;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import com.victuscaf.gimnasio.models.Tarifa;
import com.victuscaf.gimnasio.service.PagoService;
import com.victuscaf.security.RolHeaderFilter;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Registro de pagos y operaciones de caja.
 *
 * <p>Sin estos endpoints el sistema no puede cobrar: {@code AccesoService}
 * rechaza el ingreso de un cliente mensual sin un pago de membresía en los
 * últimos 30 días, y no habia forma de registrar ese pago.
 *
 * <p>Solo secretaria y administrador registran pagos. Generar el flujo de caja
 * es exclusivo del administrador.
 */
@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SECRETARIA') or hasRole('ADMINISTRADOR')")
public class PagoController {

    private final PagoService pagoService;

    // ─── Pagos ───────────────────────────────────────────────────────

    /** Mensualidad de un particular mensual. Renueva el contrato un mes. */
    @PostMapping("/mensualidad/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Pago>> registrarMensualidad(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody PagoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Pago de mensualidad registrado",
                pagoService.registrarPagoMensualidad(numeroDocumento, dto.metodoPago(), dto.valor())));
    }

    /** Acceso de un cliente diario. */
    @PostMapping("/diario/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Pago>> registrarDiario(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody PagoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Pago diario registrado",
                pagoService.registrarPagoDiario(numeroDocumento, dto.metodoPago(), dto.valor())));
    }

    /** Copago de un beneficiario EPS. */
    @PostMapping("/copago-eps/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Pago>> registrarCopagoEps(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody PagoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Copago EPS registrado",
                pagoService.registrarCopagoEPS(numeroDocumento, dto.metodoPago(), dto.valor())));
    }

    /** Servicio de entrenador plus de un cliente mensual. */
    @PostMapping("/plus/{numeroDocumento}")
    public ResponseEntity<ApiResponse<Pago>> registrarPlus(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody PagoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Pago del servicio plus registrado",
                pagoService.registrarPagoPlus(numeroDocumento, dto.metodoPago(), dto.valor())));
    }

    // ─── Gastos operativos ───────────────────────────────────────────
    // PA-0005/6/7: los gastos operativos los registra el administrador, no la secretaría.

    @PostMapping("/nomina/{numeroDocumento}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<GastoOperativo>> registrarNomina(
            @PathVariable Long numeroDocumento,
            @Valid @RequestBody GastoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Pago de nómina registrado",
                pagoService.registrarPagoNomina(numeroDocumento, dto.valor())));
    }

    @PostMapping("/arriendo")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<GastoOperativo>> registrarArriendo(@Valid @RequestBody GastoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Pago de arriendo registrado",
                pagoService.registrarPagoArriendo(dto.valor(), dto.descripcion())));
    }

    @PostMapping("/mantenimiento/{idEquipo}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<GastoOperativo>> registrarMantenimiento(
            @PathVariable Long idEquipo,
            @Valid @RequestBody GastoDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Gasto de mantenimiento registrado",
                pagoService.registrarPagoMantenimiento(idEquipo, dto.valor(), dto.descripcion())));
    }

    // ─── Flujo de caja y facturación ──────────────────────────────────

    /** Consolida los pagos y gastos de una fecha en un FlujoDeCaja. */
    @PostMapping("/flujo-caja")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<FlujoDeCaja>> generarFlujoCaja(
            @RequestParam(required = false) LocalDate fecha) {
        LocalDate dia = fecha == null ? LocalDate.now() : fecha;
        return ResponseEntity.ok(ApiResponse.success("Flujo de caja generado",
                pagoService.generarFlujoCajaDiario(dia)));
    }

    /** Genera la factura mensual EPS (PA-0009). Período {@code YYYY-MM}. */
    @PostMapping("/facturas-eps")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<FacturaEps>> generarFacturaEps(@RequestParam String periodo) {
        return ResponseEntity.ok(ApiResponse.success("Factura EPS generada",
                pagoService.generarFacturaEPS(periodo)));
    }

    /** Facturas EPS ya generadas, más recientes primero. */
    @GetMapping("/facturas-eps")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<FacturaEps>>> listarFacturasEps() {
        return ResponseEntity.ok(ApiResponse.success("Facturas EPS",
                pagoService.listarFacturasEPS()));
    }

    /** Detalle de una factura EPS con sus pagos (PA-0010). */
    @GetMapping("/facturas-eps/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<FacturaEpsDetalleDTO>> detalleFacturaEps(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Detalle de la factura EPS",
                pagoService.consultarFacturaEPS(id)));
    }

    /** Marca la factura como radicada ante la EPS. */
    @PutMapping("/facturas-eps/{id}/radicar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<FacturaEps>> radicarFacturaEps(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Factura EPS radicada",
                pagoService.radicarFacturaEPS(id, documentoActual())));
    }

    /** Registra el pago recibido de la EPS (PA-0013). */
    @PutMapping("/facturas-eps/{id}/pagar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<FacturaEps>> pagarFacturaEps(
            @PathVariable Long id,
            @Valid @RequestBody PagoFacturaEpsDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Pago de factura EPS registrado",
                pagoService.registrarPagoFacturaEPS(id, dto.metodoPago(), dto.fechaPago(),
                        dto.valor(), documentoActual())));
    }

    @PutMapping("/tarifas/{tipo}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Tarifa>> actualizarTarifa(
            @PathVariable TipoDeCliente tipo,
            @RequestParam double valorMensual,
            @RequestParam double valorDiario,
            @RequestParam double valorPlus,
            @RequestParam(required = false) Long idAdmin) {
        return ResponseEntity.ok(ApiResponse.success("Tarifa actualizada",
                pagoService.actualizarTarifa(tipo, valorMensual, valorDiario, valorPlus, idAdmin)));
    }

    /** Pagos registrados de un cliente, para historial. */
    @GetMapping("/cliente/{numeroDocumento}")
    public ResponseEntity<ApiResponse<List<Pago>>> pagosDeCliente(@PathVariable Long numeroDocumento) {
        return ResponseEntity.ok(ApiResponse.success("Pagos del cliente",
                pagoService.consultarPagosDeCliente(numeroDocumento)));
    }

    /**
     * Tarifas vigentes en solo lectura (admin y secretaria).
     * Permite mostrar el valor esperado antes de cobrar, en vez de obligar a
     * adivinarlo y recibir un rechazo del backend.
     */
    @GetMapping("/tarifas")
    public ResponseEntity<ApiResponse<List<Tarifa>>> listarTarifas() {
        return ResponseEntity.ok(ApiResponse.success("Tarifas vigentes",
                pagoService.listarTarifas()));
    }

    /** Gastos operativos de una fecha (nomina, arriendo, mantenimiento). */
    @GetMapping("/gastos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<GastoOperativo>>> gastosDelDia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        LocalDate dia = fecha == null ? LocalDate.now() : fecha;
        return ResponseEntity.ok(ApiResponse.success("Gastos operativos del dia",
                pagoService.consultarGastosPorFecha(dia)));
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