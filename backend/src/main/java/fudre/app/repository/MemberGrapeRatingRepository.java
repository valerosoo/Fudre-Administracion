package fudre.app.repository;

import fudre.app.entity.MemberGrapeRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberGrapeRatingRepository extends JpaRepository<MemberGrapeRating, Long> {
    List<MemberGrapeRating> findByMemberId(Long memberId);
    void deleteByMemberId(Long memberId);
}
