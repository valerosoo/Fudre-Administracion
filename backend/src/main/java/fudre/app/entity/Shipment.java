package fudre.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_id", nullable = false)
    private Membership membership;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "shipped_at", nullable = false)
    private LocalDate shippedAt;

    @Column(name = "shipping_cost", precision = 10, scale = 2)
    private BigDecimal shippingCost;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "tiendanube_order_id", unique = true)
    private String tiendanubeOrderId;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL)
    private List<ShipmentItem> items;

    public Long getId() { return id; }
    public Membership getMembership() { return membership; }
    public void setMembership(Membership membership) { this.membership = membership; }
    public Member getMember() { return member; }
    public void setMember(Member member) { this.member = member; }
    public LocalDate getShippedAt() { return shippedAt; }
    public void setShippedAt(LocalDate shippedAt) { this.shippedAt = shippedAt; }
    public BigDecimal getShippingCost() { return shippingCost; }
    public void setShippingCost(BigDecimal shippingCost) { this.shippingCost = shippingCost; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getTiendanubeOrderId() { return tiendanubeOrderId; }
    public void setTiendanubeOrderId(String tiendanubeOrderId) { this.tiendanubeOrderId = tiendanubeOrderId; }
    public List<ShipmentItem> getItems() { return items; }
    public void setItems(List<ShipmentItem> items) { this.items = items; }
}
