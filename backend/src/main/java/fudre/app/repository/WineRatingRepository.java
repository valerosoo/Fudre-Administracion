package fudre.app.repository;

import fudre.app.entity.WineRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WineRatingRepository extends JpaRepository<WineRating, Long> {
    List<WineRating> findByMemberId(Long memberId);
    Optional<WineRating> findByMemberIdAndWineId(Long memberId, Long wineId);

    @Query("SELECT wr FROM WineRating wr JOIN wr.wine w " +
           "WHERE wr.member.id = :memberId AND w.grape = :grape")
    List<WineRating> findByMemberIdAndWineGrape(@Param("memberId") Long memberId,
                                                @Param("grape") String grape);
}
