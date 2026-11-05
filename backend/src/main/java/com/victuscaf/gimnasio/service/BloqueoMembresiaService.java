package com.victuscaf.gimnasio.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.victuscaf.gimnasio.models.BeneficiarioEps;
import com.victuscaf.gimnasio.models.EstadoContratoEps;
import com.victuscaf.gimnasio.models.EstadoMembresia;
import com.victuscaf.gimnasio.models.EstadoPago;
import com.victuscaf.gimnasio.models.ParticularMensual;
import com.victuscaf.gimnasio.models.Pago;
import com.victuscaf.gimnasio.models.TipoDePago;
import com.victuscaf.gimnasio.models.Contrato;
import com.victuscaf.gimnasio.repository.BeneficiarioEpsRepository;
import com.victuscaf.gimnasio.repository.ParticularMensualRepository;
import com.victuscaf.gimnasio.repository.PagoRepository;

/**
 * Bloqueo automático de accesos (CA-0002).
 *
 * <p>Se ejecuta cada hora:
 * <ul>
 *   <li>Particular mensual con contrato vencido -> {@code VENCIDO}.</li>
 *   <li>Beneficiario EPS sin copago exitoso en los últimos 30 días -> {@code BLOQUEADO}.</li>
 * </ul>
 *
 * <p>El pago aplica la reactivación: un pago de membresía vuelve a {@code ACTIVO}
 * y extiende el contrato; un copago saca al EPS de {@code BLOQUEADO}.
 */
@Service
public class BloqueoMembresiaService {

    /** Ventana de gracia para el copago EPS: 30 días desde el último copago exitoso. */
    private static final int DIAS_GRACIA_COPAGO = 30;

    private final ParticularMensualRepository particularMensualRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;
    private final PagoRepository pagoRepository;

    public BloqueoMembresiaService(ParticularMensualRepository particularMensualRepository,
                                   BeneficiarioEpsRepository beneficiarioEpsRepository,
                                   PagoRepository pagoRepository) {
        this.particularMensualRepository = particularMensualRepository;
        this.beneficiarioEpsRepository = beneficiarioEpsRepository;
        this.pagoRepository = pagoRepository;
    }

    /** Marca como vencidos los contratos mensuales cuya fecha de vencimiento ya pasó. */
    @Scheduled(fixedRate = 3_600_000, initialDelay = 60_000)
    @Transactional
    public void bloquearMensualesVencidos() {
        LocalDate hoy = LocalDate.now();
        List<ParticularMensual> activos = particularMensualRepository.findByEstadoMembresia(EstadoMembresia.ACTIVO);
        for (ParticularMensual cliente : activos) {
            Contrato contrato = cliente.getContrato();
            if (contrato != null && contrato.getFechaVencimiento().isBefore(hoy)) {
                cliente.setEstadoMembresia(EstadoMembresia.VENCIDO);
                particularMensualRepository.save(cliente);
            }
        }
    }

    /** Marca como bloqueados los EPS sin copago exitoso en los últimos 30 días. */
    @Scheduled(fixedRate = 3_600_000, initialDelay = 120_000)
    @Transactional
    public void bloquearEpsSinCopago() {
        LocalDate limite = LocalDate.now().minusDays(DIAS_GRACIA_COPAGO);
        List<BeneficiarioEps> activos = beneficiarioEpsRepository.findByEstadoContrato(EstadoContratoEps.ACTIVO);
        for (BeneficiarioEps eps : activos) {
            boolean copagoVigente = pagoRepository
                    .findByUsuarioAndTipoPago(eps, TipoDePago.COPAGO).stream()
                    .anyMatch(p -> p.getEstadoPago() == EstadoPago.EXITOSO
                            && !p.getFechaPago().isBefore(limite));
            if (!copagoVigente) {
                eps.setEstadoContrato(EstadoContratoEps.BLOQUEADO);
                beneficiarioEpsRepository.save(eps);
            }
        }
    }
}