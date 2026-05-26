package fudre.app.repository;

import fudre.app.entity.Membership;
import fudre.app.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    List<Membership> findByMemberId(Long memberId);
    Optional<Membership> findByMemberIdAndStatus(Long memberId, MembershipStatus status);
}
