package fudre.app.repository;

import fudre.app.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByMemberId(Long memberId);
    Optional<Shipment> findByTiendanubeOrderId(String tiendanubeOrderId);
    boolean existsByTiendanubeOrderId(String tiendanubeOrderId);
}
