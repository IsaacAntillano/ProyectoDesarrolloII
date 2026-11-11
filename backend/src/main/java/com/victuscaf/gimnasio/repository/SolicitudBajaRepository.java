package com.victuscaf.gimnasio.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.victuscaf.gimnasio.models.EstadoSolicitudBaja;
import com.victuscaf.gimnasio.models.ParticularMensual;
import com.victuscaf.gimnasio.models.SolicitudBaja;

@Repository
public interface SolicitudBajaRepository extends JpaRepository<SolicitudBaja, Long> {

    List<SolicitudBaja> findByClienteOrderByFechaSolicitudDescHoraSolicitudDesc(ParticularMensual cliente);

    List<SolicitudBaja> findAllByOrderByFechaSolicitudDescHoraSolicitudDesc();

    List<SolicitudBaja> findByEstadoOrderByFechaSolicitudAscHoraSolicitudAsc(EstadoSolicitudBaja estado);

    boolean existsByClienteAndEstado(ParticularMensual cliente, EstadoSolicitudBaja estado);
}
