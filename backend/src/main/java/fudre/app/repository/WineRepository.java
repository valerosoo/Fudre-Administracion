package fudre.app.repository;

import fudre.app.entity.Wine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WineRepository extends JpaRepository<Wine, Long> {
    List<Wine> findByIsClubEligibleTrue();
}
