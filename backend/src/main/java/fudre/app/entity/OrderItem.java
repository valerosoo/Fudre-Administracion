package fudre.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "price_list_item_id")
    private Long priceListItemId;

    @Column(name = "distributor_id")
    private Long distributorId;

    @Column(name = "distributor_name", nullable = false)
    private String distributorName;

    @Column(name = "distributor_phone")
    private String distributorPhone;

    @Column(name = "distributor_email")
    private String distributorEmail;

    @Column(nullable = false)
    private String name;

    private String grape;

    @Column(name = "vintage_year")
    private Integer vintageYear;

    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    private Integer quantity = 1;

    @Column(name = "item_status")
    private String itemStatus = "ORDERED";

    public Long getId() { return id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public Long getPriceListItemId() { return priceListItemId; }
    public void setPriceListItemId(Long priceListItemId) { this.priceListItemId = priceListItemId; }
    public Long getDistributorId() { return distributorId; }
    public void setDistributorId(Long distributorId) { this.distributorId = distributorId; }
    public String getDistributorName() { return distributorName; }
    public void setDistributorName(String distributorName) { this.distributorName = distributorName; }
    public String getDistributorPhone() { return distributorPhone; }
    public void setDistributorPhone(String distributorPhone) { this.distributorPhone = distributorPhone; }
    public String getDistributorEmail() { return distributorEmail; }
    public void setDistributorEmail(String distributorEmail) { this.distributorEmail = distributorEmail; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGrape() { return grape; }
    public void setGrape(String grape) { this.grape = grape; }
    public Integer getVintageYear() { return vintageYear; }
    public void setVintageYear(Integer vintageYear) { this.vintageYear = vintageYear; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getItemStatus() { return itemStatus; }
    public void setItemStatus(String itemStatus) { this.itemStatus = itemStatus; }
}
