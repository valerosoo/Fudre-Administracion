package fudre.app.dto;

import java.math.BigDecimal;

public class OrderItemDto {
    private Long id;
    private String distributorName;
    private String distributorPhone;
    private String distributorEmail;
    private String name;
    private String grape;
    private Integer vintageYear;
    private BigDecimal purchasePrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private String itemStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public String getItemStatus() { return itemStatus; }
    public void setItemStatus(String itemStatus) { this.itemStatus = itemStatus; }
}
