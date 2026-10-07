package com.victuscaf.modules.client.repository;

import com.victuscaf.modules.client.models.Notificacion;
import com.victuscaf.modules.client.models.UsuarioSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByUsuarioSistemaAndLeidaFalse(UsuarioSistema usuarioSistema);
}