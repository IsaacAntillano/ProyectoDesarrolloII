package com.victuscaf.modules.client.service;

import com.victuscaf.modules.client.models.BitacoraAccion;
import com.victuscaf.modules.client.models.BeneficiarioEps;
import com.victuscaf.modules.client.models.Contrato;
import com.victuscaf.modules.client.models.Equipo;
import com.victuscaf.modules.client.models.FlujoDeCaja;
import com.victuscaf.modules.client.models.Tarifa;
import com.victuscaf.modules.client.models.TipoDeCliente;
import com.victuscaf.modules.client.repository.BeneficiarioEpsRepository;
import com.victuscaf.modules.client.repository.BitacoraAccionRepository;
import com.victuscaf.modules.client.repository.ContratoRepository;
import com.victuscaf.modules.client.repository.EquipoRepository;
import com.victuscaf.modules.client.repository.FlujoDeCajaRepository;
import com.victuscaf.modules.client.repository.TarifaRepository;
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