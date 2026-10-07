package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Rutina;
import com.victuscaf.gimnasio.models.Usuario;
import com.victuscaf.gimnasio.models.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RutinaRepository extends JpaRepository<Rutina, Long> {

    List<Rutina> findByUsuario(Usuario usuario);

    List<Rutina> findByEntrenador(Entrenador entrenador);

    List<Rutina> findByUsuarioAndActivaTrue(Usuario usuario);
}