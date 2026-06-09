package fudre.app.repository;

import fudre.app.entity.Wine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WineRepository extends JpaRepository<Wine, Long> {
    List<Wine> findByIsClubEligibleTrue();
    Optional<Wine> findByTiendanubeProductId(String tiendanubeProductId);
    Optional<Wine> findByNameIgnoreCase(String name);
}
