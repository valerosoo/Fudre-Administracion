package fudre.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_list_items")
public class PriceListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "distributor_id", nullable = false)
    private Distributor distributor;

    @Column(nullable = false)
    private String name;

    private String grape;

    @Column(name = "vintage_year")
    private Integer vintageYear;

    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Distributor getDistributor() { return distributor; }
    public void setDistributor(Distributor distributor) { this.distributor = distributor; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGrape() { return grape; }
    public void setGrape(String grape) { this.grape = grape; }
    public Integer getVintageYear() { return vintageYear; }
    public void setVintageYear(Integer vintageYear) { this.vintageYear = vintageYear; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
