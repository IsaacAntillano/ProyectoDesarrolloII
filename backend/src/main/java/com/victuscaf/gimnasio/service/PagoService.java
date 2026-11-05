package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.models.*;
import com.victuscaf.gimnasio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final UsuarioRepository usuarioRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;
    private final ParticularDiarioRepository particularDiarioRepository;
    private final ParticularMensualRepository particularMensualRepository;
    private final PagoRepository pagoRepository;
    private final TarifaRepository tarifaRepository;
    private final FlujoDeCajaRepository flujoDeCajaRepository;
    private final GastoOperativoRepository gastoOperativoRepository;
    private final FacturaEpsRepository facturaEpsRepository;
    private final BitacoraAccionRepository bitacoraRepository;
    private final EquipoRepository equipoRepository;          // necesario para mantenimiento
    private final EntrenadorRepository entrenadorRepository;  // necesario para nómina
    private final AsistenciaRepository asistenciaRepository;  // necesario para la factura EPS

    /** Sesiones estándar inclusas en la mensualidad EPS, para prorratear por sesión. */
    private static final double SESIONES_MENSUALES_ESTIMADAS = 20.0;

    /** Tarifas vigentes, para mostrar el valor esperado antes de cobrar. */
    public List<Tarifa> listarTarifas() {
        return tarifaRepository.findAll();
    }

    // ========== REGISTRO DE PAGOS ==========

    @Transactional
    public Pago registrarPagoMensualidad(Long numeroDocumento, MetodoDePago metodo, double valor) {
        ParticularMensual cliente = particularMensualRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Tarifa tarifa = tarifaRepository.findByTipoDeCliente(TipoDeCliente.PARTICULAR_MENSUAL)
                .orElseThrow(() -> new RuntimeException("Tarifa no configurada"));
        if (Math.abs(valor - tarifa.getValorMensual()) > 0.01) {
            throw new RuntimeException("El valor debe ser igual a la mensualidad vigente: " + tarifa.getValorMensual());
        }
        Pago pago = crearPago(cliente, valor, metodo, TipoDePago.MEMBRESIA, EstadoPago.EXITOSO);

        // Reactivar membresía si estaba vencida/bloqueada
        if (cliente.getEstadoMembresia() != EstadoMembresia.ACTIVO) {
            cliente.setEstadoMembresia(EstadoMembresia.ACTIVO);
        }
        // Renovar contrato (extender fecha de vencimiento un mes)
        Contrato contrato = cliente.getContrato();
        contrato.setFechaVencimiento(contrato.getFechaVencimiento().plusMonths(1));
        particularMensualRepository.save(cliente);
        return pago;
    }

    @Transactional
    public Pago registrarPagoDiario(Long numeroDocumento, MetodoDePago metodo, double valor) {
        ParticularDiario cliente = particularDiarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Tarifa tarifa = tarifaRepository.findByTipoDeCliente(TipoDeCliente.PARTICULAR_DIARIO)
                .orElseThrow(() -> new RuntimeException("Tarifa no configurada"));
        if (Math.abs(valor - tarifa.getValorDiario()) > 0.01) {
            throw new RuntimeException("Valor incorrecto. Debe pagar: " + tarifa.getValorDiario());
        }
        Pago pago = crearPago(cliente, valor, metodo, TipoDePago.DIARIO, EstadoPago.EXITOSO);

        // Actualizar acceso diario: nueva fecha y hora, expiración en 2 horas
        cliente.setFechaDeIngreso(LocalDate.now());
        cliente.setHoraIngreso(LocalTime.now());
        cliente.setHoraExpiracion(LocalTime.now().plusHours(2));
        particularDiarioRepository.save(cliente);
        return pago;
    }

    @Transactional
    public Pago registrarCopagoEPS(Long numeroDocumento, MetodoDePago metodo, double valor) {
        BeneficiarioEps cliente = beneficiarioEpsRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Beneficiario no encontrado"));

        // Validar que el contrato no esté ya finalizado ni cancelado
        if (cliente.getEstadoContrato() == EstadoContratoEps.FINALIZADO
                || cliente.getEstadoContrato() == EstadoContratoEps.CANCELADO_ANCTICIPADAMENTE) {
            throw new RuntimeException("Contrato finalizado o cancelado. No se puede registrar copago.");
        }

        Tarifa tarifa = tarifaRepository.findByTipoDeCliente(TipoDeCliente.BENEFICIARIO_EPS)
                .orElseThrow(() -> new RuntimeException("Tarifa para EPS no configurada"));

        double copagoEsperado = tarifa.getValorMensual() * 0.03;  // 3%
        if (Math.abs(valor - copagoEsperado) > 0.01) {
            throw new RuntimeException("Valor de copago incorrecto. Debe ser: " + copagoEsperado);
        }

        Pago pago = crearPago(cliente, valor, metodo, TipoDePago.COPAGO, EstadoPago.EXITOSO);

        // Si estaba bloqueado por falta de copago, se desbloquea
        if (cliente.getEstadoContrato() == EstadoContratoEps.BLOQUEADO) {
            cliente.setEstadoContrato(EstadoContratoEps.ACTIVO);
            beneficiarioEpsRepository.save(cliente);
        }

        return pago;
    }

    /** Pago del servicio de entrenador plus, validado contra la tarifa configurada. */
    @Transactional
    public Pago registrarPagoPlus(Long numeroDocumento, MetodoDePago metodo, double valor) {
        ParticularMensual cliente = particularMensualRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Tarifa tarifa = tarifaRepository.findByTipoDeCliente(TipoDeCliente.PARTICULAR_MENSUAL)
                .orElseThrow(() -> new RuntimeException("Tarifa no configurada"));
        if (Math.abs(valor - tarifa.getValorPlus()) > 0.01) {
            throw new RuntimeException("El valor debe ser igual al servicio plus vigente: " + tarifa.getValorPlus());
        }
        return crearPago(cliente, valor, metodo, TipoDePago.PLUS, EstadoPago.EXITOSO);
    }

    private Pago crearPago(Usuario usuario, double valor, MetodoDePago metodo, TipoDePago tipo, EstadoPago estado) {        Pago pago = new Pago();
        pago.setUsuario(usuario);
        pago.setValor(valor);
        pago.setMetodoPago(metodo);
        pago.setTipoPago(tipo);
        pago.setEstadoPago(estado);
        pago.setFechaPago(LocalDate.now());
        return pagoRepository.save(pago);
    }

    // ========== GASTOS OPERATIVOS ==========

    @Transactional
    public GastoOperativo registrarPagoNomina(Long numeroDocumento, double valor) {
        Entrenador entrenador = entrenadorRepository.findByNumeroDeDocumento(numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));
        GastoOperativo gasto = new GastoOperativo();
        gasto.setFecha(LocalDate.now());
        gasto.setDescripcion("Pago de nómina a " + entrenador.getNombreCompleto());
        gasto.setValor(valor);
        gasto.setTipoGasto(TipoGasto.NOMINA);
        // (opcional) gasto.setFlujoDeCaja(null); se asignará en el cierre diario
        return gastoOperativoRepository.save(gasto);
    }

    @Transactional
    public GastoOperativo registrarPagoArriendo(double valor, String descripcion) {
        GastoOperativo gasto = new GastoOperativo();
        gasto.setFecha(LocalDate.now());
        gasto.setDescripcion(descripcion);
        gasto.setValor(valor);
        gasto.setTipoGasto(TipoGasto.ARRIENDO);
        return gastoOperativoRepository.save(gasto);
    }

    @Transactional
    public GastoOperativo registrarPagoMantenimiento(Long idEquipo, double valor, String descripcion) {
        Equipo equipo = equipoRepository.findById(idEquipo)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));
        GastoOperativo gasto = new GastoOperativo();
        gasto.setFecha(LocalDate.now());
        gasto.setDescripcion(descripcion + " - Equipo: " + equipo.getNombre());
        gasto.setValor(valor);
        gasto.setTipoGasto(TipoGasto.MANTENIMIENTO);
        return gastoOperativoRepository.save(gasto);
    }

    // ========== FLUJO DE CAJA ==========

    @Transactional
    public FlujoDeCaja generarFlujoCajaDiario(LocalDate fecha) {
        if (flujoDeCajaRepository.findByFecha(fecha).isPresent()) {
            throw new RuntimeException("El flujo de caja para esta fecha ya fue generado.");
        }

        List<Pago> pagos = pagoRepository.findByFechaPago(fecha);
        List<GastoOperativo> gastos = gastoOperativoRepository.findByFecha(fecha);

        double totalIngresos = pagos.stream().mapToDouble(Pago::getValor).sum();
        double totalIngresosParticular = pagos.stream()
                .filter(p -> p.getTipoPago() == TipoDePago.MEMBRESIA)
                .mapToDouble(Pago::getValor).sum();
        double totalIngresosDiario = pagos.stream()
                .filter(p -> p.getTipoPago() == TipoDePago.DIARIO)
                .mapToDouble(Pago::getValor).sum();
        double totalIngresosCopago = pagos.stream()
                .filter(p -> p.getTipoPago() == TipoDePago.COPAGO)
                .mapToDouble(Pago::getValor).sum();
        double totalIngresosPlus = pagos.stream()
                .filter(p -> p.getTipoPago() == TipoDePago.PLUS)
                .mapToDouble(Pago::getValor).sum();

        double egresosMantenimiento = gastos.stream()
                .filter(g -> g.getTipoGasto() == TipoGasto.MANTENIMIENTO)
                .mapToDouble(GastoOperativo::getValor).sum();
        double egresosNomina = gastos.stream()
                .filter(g -> g.getTipoGasto() == TipoGasto.NOMINA)
                .mapToDouble(GastoOperativo::getValor).sum();
        double egresosArriendo = gastos.stream()
                .filter(g -> g.getTipoGasto() == TipoGasto.ARRIENDO)
                .mapToDouble(GastoOperativo::getValor).sum();
        double totalEgresos = egresosMantenimiento + egresosNomina + egresosArriendo;

        FlujoDeCaja flujo = new FlujoDeCaja();
        flujo.setFecha(fecha);
        flujo.setTotalIngresoParticular(totalIngresosParticular);
        flujo.setTotalIngresoParticularDiario(totalIngresosDiario);
        flujo.setTotalIngresoCopagoEps(totalIngresosCopago);
        flujo.setTotalIngresoPlus(totalIngresosPlus);
        flujo.setTotalEgresosMantenimiento(egresosMantenimiento);
        flujo.setTotalEgresosNomina(egresosNomina);
        flujo.setTotalEgresosArriendo(egresosArriendo);
        flujo.setUtilidadNeta(totalIngresos - totalEgresos);
        flujo.setGastos(gastos);

        // Asignar el flujo de caja a cada gasto (bidireccional)
        gastos.forEach(g -> g.setFlujoDeCaja(flujo));
        gastoOperativoRepository.saveAll(gastos);

        return flujoDeCajaRepository.save(flujo);
    }

    // ========== FACTURACIÓN EPS ==========

    /**
     * Factura mensual para la EPS (PA-0009).
     *
     * <p>Fórmula: {@code (sesiones EPS asistidas en el período × tarifa EPS vigente / 20 sesiones)
     * + copagos EPS exitosos del período}. Período esperado: {@code YYYY-MM}.
     *
     * <p>La factura es única por período (verificada contra {@code periodoConsolidado})
     * y, al no haber discriminación por entidad en las remisiones, se emite como consolidada
     * global ({@code entidadEps = "GLOBAL"}).
     */
    @Transactional
    public FacturaEps generarFacturaEPS(String periodo) {
        if (facturaEpsRepository.findByPeriodoConsolidado(periodo).isPresent()) {
            throw new RuntimeException("La factura para este período ya existe.");
        }

        final YearMonth ym;
        try {
            ym = YearMonth.parse(periodo);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Período inválido: usa el formato YYYY-MM, por ejemplo 2026-10");
        }
        LocalDate inicio = ym.atDay(1);
        LocalDate fin = ym.atEndOfMonth();

        // Sesiones EPS asistidas en el período (clientes con tipo de cliente BENEFICIARIO_EPS).
        List<Asistencia> asistencias = asistenciaRepository
                .findByUsuarioTipoDeClienteAndFechaIngresoBetween(TipoDeCliente.BENEFICIARIO_EPS, inicio, fin);

        Tarifa tarifaEps = tarifaRepository.findByTipoDeCliente(TipoDeCliente.BENEFICIARIO_EPS)
                .orElseThrow(() -> new RuntimeException("Tarifa para EPS no configurada"));
        double valorPorSesion = tarifaEps.getValorMensual() / SESIONES_MENSUALES_ESTIMADAS;
        double valorSesiones = asistencias.size() * valorPorSesion;

        // Copagos EPS exitosos del período.
        List<Pago> pagosDelPeriodo = pagoRepository.findByFechaPagoBetween(inicio, fin);
        double copagos = pagosDelPeriodo.stream()
                .filter(p -> p.getTipoPago() == TipoDePago.COPAGO && p.getEstadoPago() == EstadoPago.EXITOSO)
                .mapToDouble(Pago::getValor)
                .sum();

        FacturaEps factura = new FacturaEps();
        factura.setPeriodoConsolidado(periodo);
        factura.setFechaGeneracion(LocalDate.now());
        factura.setEstado(EstadoFacturaEps.PENDIENTE);
        factura.setEntidadEps("GLOBAL");
        factura.setValorTotal(Math.round((valorSesiones + copagos) * 100.0) / 100.0);
        return facturaEpsRepository.save(factura);
    }

    /** Facturas EPS ya generadas, más recientes primero. */
    public List<FacturaEps> listarFacturasEPS() {
        return facturaEpsRepository.findAll().stream()
                .sorted((a, b) -> b.getPeriodoConsolidado().compareTo(a.getPeriodoConsolidado()))
                .toList();
    }

    // ========== TARIFAS ==========

    @Transactional
    public Tarifa actualizarTarifa(TipoDeCliente tipo, double nuevoValorMensual,
                                   double nuevoValorDiario, double nuevoValorPlus, Long idAdmin) {
        Tarifa tarifa = tarifaRepository.findByTipoDeCliente(tipo)
                .orElse(new Tarifa());
        tarifa.setTipoDeCliente(tipo);
        tarifa.setValorMensual(nuevoValorMensual);
        tarifa.setValorDiario(nuevoValorDiario);
        tarifa.setValorPlus(nuevoValorPlus);
        tarifa.setFechaUltimaModificacion(LocalDate.now());
        tarifa.setIdAdminModificador(idAdmin);
        // Podrías añadir registro en bitácora aquí
        return tarifaRepository.save(tarifa);
    }

    // ========== CONSULTA ==========

    /** Historial de pagos de un cliente, sea del tipo que sea. */
    @Transactional(readOnly = true)
    public List<Pago> consultarPagosDeCliente(Long numeroDocumento) {
        return usuarioRepository.findByNumeroDeDocumento(numeroDocumento)
                .map(pagoRepository::findByUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }

    /** Pagos de una fecha, para revisar antes de generar el flujo de caja. */
    @Transactional(readOnly = true)
    public List<Pago> consultarPagosPorFecha(LocalDate fecha) {
        return pagoRepository.findByFechaPago(fecha);
    }

    /** Gastos operativos de una fecha (nomina, arriendo, mantenimiento). */
    @Transactional(readOnly = true)
    public List<GastoOperativo> consultarGastosPorFecha(LocalDate fecha) {
        return gastoOperativoRepository.findByFecha(fecha);
    }
}