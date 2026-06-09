package fudre.app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_list_items")
public class PurchaseListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_list_item_id", nullable = false)
    private PriceListItem priceListItem;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public PriceListItem getPriceListItem() { return priceListItem; }
    public void setPriceListItem(PriceListItem priceListItem) { this.priceListItem = priceListItem; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public LocalDateTime getAddedAt() { return addedAt; }
}
