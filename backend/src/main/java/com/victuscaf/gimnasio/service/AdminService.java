package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.models.BitacoraAccion;
import com.victuscaf.gimnasio.models.BeneficiarioEps;
import com.victuscaf.gimnasio.models.Contrato;
import com.victuscaf.gimnasio.models.Equipo;
import com.victuscaf.gimnasio.models.FlujoDeCaja;
import com.victuscaf.gimnasio.models.Tarifa;
import com.victuscaf.gimnasio.models.TipoDeCliente;
import com.victuscaf.gimnasio.repository.BeneficiarioEpsRepository;
import com.victuscaf.gimnasio.repository.BitacoraAccionRepository;
import com.victuscaf.gimnasio.repository.ContratoRepository;
import com.victuscaf.gimnasio.repository.EquipoRepository;
import com.victuscaf.gimnasio.repository.FlujoDeCajaRepository;
import com.victuscaf.gimnasio.repository.TarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TarifaRepository tarifaRepository;
    private final EquipoRepository equipoRepository;
    private final ContratoRepository contratoRepository;
    private final FlujoDeCajaRepository flujoDeCajaRepository;
    private final BitacoraAccionRepository bitacoraRepository;
    private final BeneficiarioEpsRepository beneficiarioEpsRepository;

    public List<Contrato> consultarContratosVencidos() {
        return contratoRepository.findByFechaVencimientoBefore(LocalDate.now());
    }

    public List<BeneficiarioEps> consultarBeneficiariosEPS() {
        return beneficiarioEpsRepository.findAll();
    }

    public FlujoDeCaja consultarFlujoCaja(LocalDate fecha) {
        return flujoDeCajaRepository.findByFecha(fecha)
                .orElseThrow(() -> new RuntimeException("No hay flujo de caja para esa fecha"));
    }

    public List<BitacoraAccion> consultarBitacora(LocalDate desde, LocalDate hasta) {
        return bitacoraRepository.findByFechaBetweenOrderByFechaDescHoraDesc(desde, hasta);
    }

    // ─── Tarifas ─────────────────────────────────────────────────────

    public List<Tarifa> listarTarifas() {
        return tarifaRepository.findAll();
    }

    @Transactional
    public Tarifa actualizarTarifa(TipoDeCliente tipo, double valorMensual, double valorDiario, double valorPlus, Long idAdminModificador) {
        Tarifa tarifa = tarifaRepository.findByTipoDeCliente(tipo)
                .orElseGet(() -> {
                    Tarifa nueva = new Tarifa();
                    nueva.setTipoDeCliente(tipo);
                    return nueva;
                });
        tarifa.setValorMensual(valorMensual);
        tarifa.setValorDiario(valorDiario);
        tarifa.setValorPlus(valorPlus);
        tarifa.setIdAdminModificador(idAdminModificador);
        tarifa.setFechaUltimaModificacion(LocalDate.now());
        return tarifaRepository.save(tarifa);
    }

    // ─── Equipos ─────────────────────────────────────────────────────

    public List<Equipo> listarEquipos() {
        return equipoRepository.findAll();
    }
}