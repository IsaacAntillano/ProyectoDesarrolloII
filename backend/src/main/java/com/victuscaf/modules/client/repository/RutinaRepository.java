package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.Rutina;
import com.victuscaf.modules.client.models.Usuario;
import com.victuscaf.modules.client.models.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RutinaRepository extends JpaRepository<Rutina, Long> {

    List<Rutina> findByUsuario(Usuario usuario);

    List<Rutina> findByEntrenador(Entrenador entrenador);

    List<Rutina> findByUsuarioAndActivaTrue(Usuario usuario);
}