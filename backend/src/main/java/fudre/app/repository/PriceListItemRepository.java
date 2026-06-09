package fudre.app.repository;

import fudre.app.entity.PriceListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PriceListItemRepository extends JpaRepository<PriceListItem, Long> {
    Optional<PriceListItem> findByDistributorIdAndNameAndVintageYear(Long distributorId, String name, Integer vintageYear);
}
