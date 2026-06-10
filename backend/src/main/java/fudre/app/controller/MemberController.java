package fudre.app.controller;

import fudre.app.dto.MemberDto;
import fudre.app.dto.RecommendationDto;
import fudre.app.dto.SurveyDto;
import fudre.app.dto.WineRatingDto;
import fudre.app.service.MemberService;
import fudre.app.service.RecommendationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;
    private final RecommendationService recommendationService;

    public MemberController(MemberService memberService, RecommendationService recommendationService) {
        this.memberService = memberService;
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public List<MemberDto> getAll() {
        return memberService.getAll();
    }

    @GetMapping("/{id}")
    public MemberDto getById(@PathVariable Long id) {
        return memberService.getById(id);
    }

    @PostMapping
    public ResponseEntity<MemberDto> create(@RequestBody MemberDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.create(dto));
    }

    @PutMapping("/{id}")
    public MemberDto update(@PathVariable Long id, @RequestBody MemberDto dto) {
        return memberService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        memberService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{memberId}/wine-ratings")
    public ResponseEntity<WineRatingDto> submitRating(@PathVariable Long memberId,
                                                       @RequestBody WineRatingDto dto) {
        return ResponseEntity.ok(memberService.submitWineRating(memberId, dto));
    }

    @GetMapping("/{memberId}/wine-ratings")
    public List<WineRatingDto> getWineRatings(@PathVariable Long memberId) {
        return memberService.getWineRatings(memberId);
    }

    @GetMapping("/{memberId}/recommendations")
    public RecommendationDto getRecommendations(@PathVariable Long memberId) {
        return recommendationService.getRecommendations(memberId);
    }

    @PutMapping("/{memberId}/survey")
    public MemberDto saveSurvey(@PathVariable Long memberId, @RequestBody SurveyDto dto) {
        return memberService.saveSurvey(memberId, dto);
    }
}
