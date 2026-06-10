package fudre.app.dto;

import fudre.app.entity.WineStyle;
import java.util.List;
import java.util.Map;

public class SurveyDto {
    private String phone;
    private String deliveryAddress;
    private WineStyle wineStyle;
    private String wineTypes;
    private Boolean openToNew;
    private String occasions;
    private String knowledge;
    private String frequency;
    private String budget;
    private String comments;
    // grape -> rating (1-5)
    private Map<String, Integer> grapeRatings;

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
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public Map<String, Integer> getGrapeRatings() { return grapeRatings; }
    public void setGrapeRatings(Map<String, Integer> grapeRatings) { this.grapeRatings = grapeRatings; }
}
