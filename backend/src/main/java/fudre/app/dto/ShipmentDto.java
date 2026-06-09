package fudre.app.dto;

import fudre.app.entity.ShipmentStatus;
import fudre.app.entity.ShipmentType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ShipmentDto {

    private Long id;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private Long membershipId;
    private LocalDate shippedAt;
    private BigDecimal shippingCost;
    private String notes;
    private String tiendanubeOrderId;
    private ShipmentType type;
    private ShipmentStatus status;
    private List<ShipmentItemDto> items;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }
    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }
    public Long getMembershipId() { return membershipId; }
    public void setMembershipId(Long membershipId) { this.membershipId = membershipId; }
    public LocalDate getShippedAt() { return shippedAt; }
    public void setShippedAt(LocalDate shippedAt) { this.shippedAt = shippedAt; }
    public BigDecimal getShippingCost() { return shippingCost; }
    public void setShippingCost(BigDecimal shippingCost) { this.shippingCost = shippingCost; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getTiendanubeOrderId() { return tiendanubeOrderId; }
    public void setTiendanubeOrderId(String id) { this.tiendanubeOrderId = id; }
    public ShipmentType getType() { return type; }
    public void setType(ShipmentType type) { this.type = type; }
    public ShipmentStatus getStatus() { return status; }
    public void setStatus(ShipmentStatus status) { this.status = status; }
    public List<ShipmentItemDto> getItems() { return items; }
    public void setItems(List<ShipmentItemDto> items) { this.items = items; }
}
