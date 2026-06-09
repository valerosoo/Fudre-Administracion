package fudre.app.repository;

import fudre.app.entity.Shipment;
import fudre.app.entity.ShipmentStatus;
import fudre.app.entity.ShipmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByMemberId(Long memberId);
    Optional<Shipment> findByTiendanubeOrderId(String tiendanubeOrderId);
    boolean existsByTiendanubeOrderId(String tiendanubeOrderId);

    List<Shipment> findByType(ShipmentType type);
    List<Shipment> findByTypeAndStatus(ShipmentType type, ShipmentStatus status);

    @Query("SELECT COUNT(DISTINCT si.wine.id) FROM ShipmentItem si " +
           "WHERE si.shipment.member.id = :memberId AND si.shipment.status = 'CONFIRMED'")
    long countDistinctConfirmedWinesForMember(@Param("memberId") Long memberId);

    @Query("SELECT DISTINCT si.wine.id FROM ShipmentItem si " +
           "WHERE si.shipment.member.id = :memberId AND si.shipment.status = 'CONFIRMED'")
    Set<Long> findConfirmedWineIdsByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(s) > 0 FROM Shipment s " +
           "WHERE s.member.id = :memberId " +
           "AND s.type = :type " +
           "AND s.status = :status " +
           "AND YEAR(s.shippedAt) = :year AND MONTH(s.shippedAt) = :month")
    boolean existsProposalForMemberInMonth(@Param("memberId") Long memberId,
                                           @Param("year") int year,
                                           @Param("month") int month,
                                           @Param("type") ShipmentType type,
                                           @Param("status") ShipmentStatus status);
}
