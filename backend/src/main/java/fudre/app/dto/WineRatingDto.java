package fudre.app.dto;

import java.time.LocalDateTime;

public class WineRatingDto {
    private Long id;
    private Long memberId;
    private Long wineId;
    private String wineName;
    private Integer rating;
    private String notes;
    private LocalDateTime ratedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public Long getWineId() { return wineId; }
    public void setWineId(Long wineId) { this.wineId = wineId; }
    public String getWineName() { return wineName; }
    public void setWineName(String wineName) { this.wineName = wineName; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getRatedAt() { return ratedAt; }
    public void setRatedAt(LocalDateTime ratedAt) { this.ratedAt = ratedAt; }
}
