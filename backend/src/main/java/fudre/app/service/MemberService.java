package fudre.app.service;

import fudre.app.dto.MemberDto;
import fudre.app.entity.Member;
import fudre.app.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public List<MemberDto> getAll() {
        return memberRepository.findAll().stream().map(this::toDto).toList();
    }

    public MemberDto getById(Long id) {
        return memberRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + id));
    }

    public MemberDto create(MemberDto dto) {
        if (memberRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un miembro con el email: " + dto.getEmail());
        }
        return toDto(memberRepository.save(toEntity(dto)));
    }

    public MemberDto update(Long id, MemberDto dto) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + id));
        if (dto.getName() != null) member.setName(dto.getName());
        if (dto.getEmail() != null) member.setEmail(dto.getEmail());
        if (dto.getPhone() != null) member.setPhone(dto.getPhone());
        if (dto.getDeliveryAddress() != null) member.setDeliveryAddress(dto.getDeliveryAddress());
        if (dto.getWineStyle() != null) member.setWineStyle(dto.getWineStyle());
        if (dto.getWineTypes() != null) member.setWineTypes(dto.getWineTypes());
        if (dto.getOpenToNew() != null) member.setOpenToNew(dto.getOpenToNew());
        if (dto.getOccasions() != null) member.setOccasions(dto.getOccasions());
        return toDto(memberRepository.save(member));
    }

    public void delete(Long id) {
        if (!memberRepository.existsById(id)) {
            throw new NoSuchElementException("Miembro no encontrado: " + id);
        }
        memberRepository.deleteById(id);
    }

    private MemberDto toDto(Member m) {
        MemberDto dto = new MemberDto();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setEmail(m.getEmail());
        dto.setPhone(m.getPhone());
        dto.setDeliveryAddress(m.getDeliveryAddress());
        dto.setWineStyle(m.getWineStyle());
        dto.setWineTypes(m.getWineTypes());
        dto.setOpenToNew(m.getOpenToNew());
        dto.setOccasions(m.getOccasions());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }

    private Member toEntity(MemberDto dto) {
        Member member = new Member();
        member.setName(dto.getName() != null ? dto.getName() : "Sin Nombre");
        member.setEmail(dto.getEmail());
        member.setPhone(dto.getPhone());
        member.setDeliveryAddress(dto.getDeliveryAddress());
        member.setWineStyle(dto.getWineStyle());
        member.setWineTypes(dto.getWineTypes());
        member.setOpenToNew(dto.getOpenToNew());
        member.setOccasions(dto.getOccasions());
        return member;
    }
}
