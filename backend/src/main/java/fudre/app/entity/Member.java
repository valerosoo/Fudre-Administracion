package fudre.app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name = "Sin Nombre";

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "wine_style")
    private WineStyle wineStyle;

    @Column(name = "wine_types")
    private String wineTypes;

    @Column(name = "open_to_new")
    private Boolean openToNew;

    private String occasions;

    private String knowledge;
    private String frequency;
    private String budget;

    @Column(name = "survey_completed_at")
    private LocalDateTime surveyCompletedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<MemberGrapeRating> grapeRatings;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<Membership> memberships;

    public Long getId() { return id; }
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
    public String getKnowledge() { return knowledge; }
    public void setKnowledge(String knowledge) { this.knowledge = knowledge; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }
    public LocalDateTime getSurveyCompletedAt() { return surveyCompletedAt; }
    public void setSurveyCompletedAt(LocalDateTime surveyCompletedAt) { this.surveyCompletedAt = surveyCompletedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<MemberGrapeRating> getGrapeRatings() { return grapeRatings; }
    public List<Membership> getMemberships() { return memberships; }
}
