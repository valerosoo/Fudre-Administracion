package fudre.app.dto;

public class MemberGrapeRatingDto {
    private Long id;
    private String grape;
    private Integer rating;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGrape() { return grape; }
    public void setGrape(String grape) { this.grape = grape; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
}
