package fudre.app.dto;

import fudre.app.entity.WineCategory;
import java.math.BigDecimal;

public class WineDto {

    private Long id;
    private String name;
    private String grape;
    private Integer vintageYear;
    private Integer stockGondola;
    private Integer stockCuartito;
    private Integer stockTotal;
    private BigDecimal referencePrice;
    private WineCategory category;
    private Boolean isClubEligible;
    private String tiendanubeProductId;
    private String uploadStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public Integer getStockTotal() { return stockTotal; }
    public void setStockTotal(Integer stockTotal) { this.stockTotal = stockTotal; }
    public BigDecimal getReferencePrice() { return referencePrice; }
    public void setReferencePrice(BigDecimal referencePrice) { this.referencePrice = referencePrice; }
    public WineCategory getCategory() { return category; }
    public void setCategory(WineCategory category) { this.category = category; }
    public Boolean getIsClubEligible() { return isClubEligible; }
    public void setIsClubEligible(Boolean isClubEligible) { this.isClubEligible = isClubEligible; }
    public String getTiendanubeProductId() { return tiendanubeProductId; }
    public void setTiendanubeProductId(String tiendanubeProductId) { this.tiendanubeProductId = tiendanubeProductId; }
    public String getUploadStatus() { return uploadStatus; }
    public void setUploadStatus(String uploadStatus) { this.uploadStatus = uploadStatus; }
}
