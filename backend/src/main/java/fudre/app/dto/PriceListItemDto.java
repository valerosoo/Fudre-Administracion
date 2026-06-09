package fudre.app.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PriceListItemDto {
    private Long id;
    private Long distributorId;
    private String distributorName;
    private String distributorPhone;
    private String distributorEmail;
    private String name;
    private String grape;
    private Integer vintageYear;
    private BigDecimal purchasePrice;
    private String imageUrl;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
