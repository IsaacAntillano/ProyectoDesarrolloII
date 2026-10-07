package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.EvaluacionFisica;
import com.victuscaf.gimnasio.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluacionFisicaRepository extends JpaRepository<EvaluacionFisica, Long> {

    List<EvaluacionFisica> findByUsuarioOrderByFechaEvaluacionAsc(Usuario usuario);

    List<EvaluacionFisica> findByUsuario(Usuario usuario);
}