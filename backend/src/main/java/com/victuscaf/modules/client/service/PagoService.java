package com.victuscaf.modules.client.service;

import com.victuscaf.modules.client.models.*;
import com.victuscaf.modules.client.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
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

        // Validar que el contrato no esté ya finalizado
        if (cliente.getEstadoContrato() == EstadoContratoEps.FINALIZADO) {
            throw new RuntimeException("Contrato ya finalizado. No se puede registrar copago.");
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

    private Pago crearPago(Usuario usuario, double valor, MetodoDePago metodo, TipoDePago tipo, EstadoPago estado) {
        Pago pago = new Pago();
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

    @Transactional
    public FacturaEps generarFacturaEPS(String periodo) {
        if (facturaEpsRepository.findByPeriodoConsolidado(periodo).isPresent()) {
            throw new RuntimeException("La factura para este período ya existe.");
        }

        // Aquí deberías calcular el valor total basado en las asistencias de EPS en ese período.
        // Por ahora es placeholder.
        FacturaEps factura = new FacturaEps();
        factura.setPeriodoConsolidado(periodo);
        factura.setFechaGeneracion(LocalDate.now());
        factura.setEstado(EstadoFacturaEps.PENDIENTE);
        factura.setValorTotal(0.0); // TODO: calcular
        return facturaEpsRepository.save(factura);
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
}