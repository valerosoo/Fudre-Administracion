package fudre.app.repository;

import fudre.app.entity.Plan;
import fudre.app.entity.WinePool;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WinePoolRepository extends JpaRepository<WinePool, Long> {
    List<WinePool> findByPlanAndIsActiveTrue(Plan plan);
}
