package fudre.app.dto;

import java.math.BigDecimal;

public class ShipmentItemDto {

    private Long id;
    private Long wineId;
    private String wineName;
    private String wineGrape;
    private Integer quantity;
    private BigDecimal unitPrice;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getWineId() { return wineId; }
    public void setWineId(Long wineId) { this.wineId = wineId; }
    public String getWineName() { return wineName; }
    public void setWineName(String wineName) { this.wineName = wineName; }
    public String getWineGrape() { return wineGrape; }
    public void setWineGrape(String wineGrape) { this.wineGrape = wineGrape; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
}
