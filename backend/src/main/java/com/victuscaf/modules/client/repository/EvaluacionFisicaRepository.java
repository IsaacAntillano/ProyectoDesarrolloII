package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.EvaluacionFisica;
import com.victuscaf.modules.client.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluacionFisicaRepository extends JpaRepository<EvaluacionFisica, Long> {

    List<EvaluacionFisica> findByUsuarioOrderByFechaEvaluacionAsc(Usuario usuario);

    List<EvaluacionFisica> findByUsuario(Usuario usuario);
}