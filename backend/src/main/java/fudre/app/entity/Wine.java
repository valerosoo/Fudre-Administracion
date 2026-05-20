package fudre.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wines")
public class Wine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String grape;

    @Column(name = "vintage_year")
    private Integer vintageYear;

    @Column(name = "stock_gondola", nullable = false)
    private Integer stockGondola = 0;

    @Column(name = "stock_cuartito", nullable = false)
    private Integer stockCuartito = 0;

    @Column(name = "reference_price", precision = 10, scale = 2)
    private BigDecimal referencePrice;

    @Enumerated(EnumType.STRING)
    @Column(insertable = false, updatable = false)
    private WineCategory category;

    @Column(name = "is_club_eligible", nullable = false)
    private Boolean isClubEligible = false;

    @Column(name = "tiendanube_product_id")
    private String tiendanubeProductId;

    @Column(name = "upload_status")
    private String uploadStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGrape() { return grape; }
    public void setGrape(String grape) { this.grape = grape; }
    public Integer getVintageYear() { return vintageYear; }
    public void setVintageYear(Integer vintageYear) { this.vintageYear = vintageYear; }
    public Integer getStockGondola() { return stockGondola; }
    public void setStockGondola(Integer stockGondola) { this.stockGondola = stockGondola; }
    public Integer getStockCuartito() { return stockCuartito; }
    public void setStockCuartito(Integer stockCuartito) { this.stockCuartito = stockCuartito; }
    public BigDecimal getReferencePrice() { return referencePrice; }
    public void setReferencePrice(BigDecimal referencePrice) { this.referencePrice = referencePrice; }
    public WineCategory getCategory() { return category; }
    public Boolean getIsClubEligible() { return isClubEligible; }
    public void setIsClubEligible(Boolean isClubEligible) { this.isClubEligible = isClubEligible; }
    public String getTiendanubeProductId() { return tiendanubeProductId; }
    public void setTiendanubeProductId(String tiendanubeProductId) { this.tiendanubeProductId = tiendanubeProductId; }
    public String getUploadStatus() { return uploadStatus; }
    public void setUploadStatus(String uploadStatus) { this.uploadStatus = uploadStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
