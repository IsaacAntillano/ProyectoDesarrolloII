package com.victuscaf.gimnasio.repository;

import com.victuscaf.gimnasio.models.Notificacion;
import com.victuscaf.gimnasio.models.UsuarioSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByUsuarioSistemaAndLeidaFalse(UsuarioSistema usuarioSistema);
}