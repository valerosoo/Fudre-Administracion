package fudre.app.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDto {
    private Long id;
    private String orderDate;
    private String deliveredAt;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
    private int totalItems;
    private BigDecimal totalAmount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderDate() { return orderDate; }
    public void setOrderDate(String orderDate) { this.orderDate = orderDate; }
    public String getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(String deliveredAt) { this.deliveredAt = deliveredAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
    public int getTotalItems() { return totalItems; }
    public void setTotalItems(int totalItems) { this.totalItems = totalItems; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
