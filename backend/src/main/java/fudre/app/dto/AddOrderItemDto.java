package fudre.app.dto;

public class AddOrderItemDto {
    private Long priceListItemId;
    private Integer quantity;
    public Long getPriceListItemId() { return priceListItemId; }
    public void setPriceListItemId(Long priceListItemId) { this.priceListItemId = priceListItemId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
