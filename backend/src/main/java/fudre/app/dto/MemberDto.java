package fudre.app.dto;

import fudre.app.entity.WineStyle;
import java.time.LocalDateTime;
import java.util.List;

public class MemberDto {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String deliveryAddress;
    private WineStyle wineStyle;
    private String wineTypes;
    private Boolean openToNew;
    private String occasions;
    private LocalDateTime createdAt;
    private List<MemberGrapeRatingDto> grapeRatings;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public WineStyle getWineStyle() { return wineStyle; }
    public void setWineStyle(WineStyle wineStyle) { this.wineStyle = wineStyle; }
    public String getWineTypes() { return wineTypes; }
    public void setWineTypes(String wineTypes) { this.wineTypes = wineTypes; }
    public Boolean getOpenToNew() { return openToNew; }
    public void setOpenToNew(Boolean openToNew) { this.openToNew = openToNew; }
    public String getOccasions() { return occasions; }
    public void setOccasions(String occasions) { this.occasions = occasions; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<MemberGrapeRatingDto> getGrapeRatings() { return grapeRatings; }
    public void setGrapeRatings(List<MemberGrapeRatingDto> grapeRatings) { this.grapeRatings = grapeRatings; }
}
