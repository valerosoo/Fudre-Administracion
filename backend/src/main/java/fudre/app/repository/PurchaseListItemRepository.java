package fudre.app.repository;

import fudre.app.entity.PurchaseListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PurchaseListItemRepository extends JpaRepository<PurchaseListItem, Long> {
    Optional<PurchaseListItem> findByPriceListItemId(Long priceListItemId);
}
