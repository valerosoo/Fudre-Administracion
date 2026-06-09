package fudre.app.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderImportDto {

    private DistributorInfo distributor;
    private List<ItemInfo> items;

    public DistributorInfo getDistributor() { return distributor; }
    public void setDistributor(DistributorInfo distributor) { this.distributor = distributor; }
    public List<ItemInfo> getItems() { return items; }
    public void setItems(List<ItemInfo> items) { this.items = items; }

    public static class DistributorInfo {
        private String name;
        private String phone;
        private String email;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class ItemInfo {
        private String name;
        private String grape;
        private Integer vintageYear;
        private BigDecimal purchasePrice;
        private Integer quantity;
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
    }
}
