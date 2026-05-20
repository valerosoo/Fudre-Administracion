package fudre.app.service;

import fudre.app.dto.MembershipDto;
import fudre.app.entity.Member;
import fudre.app.entity.Membership;
import fudre.app.entity.MembershipStatus;
import fudre.app.repository.MemberRepository;
import fudre.app.repository.MembershipRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final MemberRepository memberRepository;

    public MembershipService(MembershipRepository membershipRepository, MemberRepository memberRepository) {
        this.membershipRepository = membershipRepository;
        this.memberRepository = memberRepository;
    }

    public List<MembershipDto> getAll() {
        return membershipRepository.findAll().stream().map(this::toDto).toList();
    }

    public MembershipDto getById(Long id) {
        return membershipRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new NoSuchElementException("Membresía no encontrada: " + id));
    }

    public List<MembershipDto> getByMember(Long memberId) {
        return membershipRepository.findByMemberId(memberId).stream().map(this::toDto).toList();
    }

    public MembershipDto create(MembershipDto dto) {
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + dto.getMemberId()));
        Membership membership = new Membership();
        membership.setMember(member);
        membership.setPlan(dto.getPlan());
        membership.setStatus(dto.getStatus() != null ? dto.getStatus() : MembershipStatus.ACTIVE);
        membership.setStartDate(dto.getStartDate());
        membership.setEndDate(dto.getEndDate());
        return toDto(membershipRepository.save(membership));
    }

    public MembershipDto update(Long id, MembershipDto dto) {
        Membership membership = membershipRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Membresía no encontrada: " + id));
        membership.setPlan(dto.getPlan());
        membership.setStatus(dto.getStatus());
        membership.setStartDate(dto.getStartDate());
        membership.setEndDate(dto.getEndDate());
        return toDto(membershipRepository.save(membership));
    }

    public void delete(Long id) {
        if (!membershipRepository.existsById(id)) {
            throw new NoSuchElementException("Membresía no encontrada: " + id);
        }
        membershipRepository.deleteById(id);
    }

    private MembershipDto toDto(Membership m) {
        MembershipDto dto = new MembershipDto();
        dto.setId(m.getId());
        dto.setMemberId(m.getMember().getId());
        dto.setMemberName(m.getMember().getName());
        dto.setMemberEmail(m.getMember().getEmail());
        dto.setPlan(m.getPlan());
        dto.setStatus(m.getStatus());
        dto.setStartDate(m.getStartDate());
        dto.setEndDate(m.getEndDate());
        return dto;
    }
}
