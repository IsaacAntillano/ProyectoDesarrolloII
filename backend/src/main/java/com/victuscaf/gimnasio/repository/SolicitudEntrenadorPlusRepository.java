package com.victuscaf.gimnasio.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.victuscaf.gimnasio.models.EstadoSolicitudPlus;
import com.victuscaf.gimnasio.models.ParticularMensual;
import com.victuscaf.gimnasio.models.SolicitudEntrenadorPlus;

@Repository
public interface SolicitudEntrenadorPlusRepository extends JpaRepository<SolicitudEntrenadorPlus, Long> {

    List<SolicitudEntrenadorPlus> findByEstadoOrderByFechaSolicitudDesc(EstadoSolicitudPlus estado);

    List<SolicitudEntrenadorPlus> findAllByOrderByFechaSolicitudDesc();

    List<SolicitudEntrenadorPlus> findByClienteOrderByFechaSolicitudDesc(ParticularMensual cliente);

    boolean existsByClienteAndEstado(ParticularMensual cliente, EstadoSolicitudPlus estado);
}
