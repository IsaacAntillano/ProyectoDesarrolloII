package com.victuscaf.gimnasio.service;

import com.victuscaf.gimnasio.dto.*;
import com.victuscaf.gimnasio.repository.*;
import com.victuscaf.gimnasio.models.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final EquipoRepository equipoRepository;
    private final RegistroMantenimientoRepository mantenimientoRepository;

    @Transactional
    public Equipo crearEquipo(EquipoDTO dto) {
        Equipo equipo = new Equipo();
        equipo.setNombre(dto.nombre());
        equipo.setDescripcion(dto.descripcion());
        equipo.setFechaAdquisicion(dto.fechaAdquisicion());
        equipo.setEstadoEquipo(dto.estadoEquipo());
        equipo.setProximoMantenimiento(dto.proximoMantenimiento());
        return equipoRepository.save(equipo);
    }

    @Transactional
    public RegistroMantenimiento registrarMantenimiento(Long idEquipo, MantenimientoDTO dto) {
        Equipo equipo = equipoRepository.findById(idEquipo)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));
        RegistroMantenimiento rm = new RegistroMantenimiento();
        rm.setEquipo(equipo);
        rm.setFechaMantenimiento(dto.fechaMantenimiento());
        rm.setDescripcion(dto.descripcionTrabajo());
        rm.setCosto(dto.costo());
        rm.setTecnicoResponsable(dto.tecnicoResponsable());
        // Actualizar próximo mantenimiento si se indica
        if (dto.proximoMantenimiento() != null) {
            equipo.setProximoMantenimiento(dto.proximoMantenimiento());
            equipoRepository.save(equipo);
        }
        return mantenimientoRepository.save(rm);
    }

    public List<Equipo> equiposPorMantenimientoProximo() {
        return equipoRepository.findByProximoMantenimientoBefore(LocalDate.now().plusDays(5));
    }
}