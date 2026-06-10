package fudre.app.service;

import fudre.app.dto.MemberDto;
import fudre.app.dto.MemberGrapeRatingDto;
import fudre.app.dto.SurveyDto;
import fudre.app.dto.WineRatingDto;
import fudre.app.entity.Member;
import fudre.app.entity.MemberGrapeRating;
import fudre.app.entity.Wine;
import fudre.app.entity.WineRating;
import fudre.app.repository.MemberGrapeRatingRepository;
import fudre.app.repository.MemberRepository;
import fudre.app.repository.WineRepository;
import fudre.app.repository.WineRatingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberGrapeRatingRepository grapeRatingRepository;
    private final WineRepository wineRepository;
    private final WineRatingRepository wineRatingRepository;
    private final EmailService emailService;

    public MemberService(MemberRepository memberRepository,
                         MemberGrapeRatingRepository grapeRatingRepository,
                         WineRepository wineRepository,
                         WineRatingRepository wineRatingRepository,
                         EmailService emailService) {
        this.memberRepository = memberRepository;
        this.grapeRatingRepository = grapeRatingRepository;
        this.wineRepository = wineRepository;
        this.wineRatingRepository = wineRatingRepository;
        this.emailService = emailService;
    }

    public List<MemberDto> getAll() {
        return memberRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MemberDto getById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + id));
        MemberDto dto = toDto(member);
        if (member.getGrapeRatings() != null) {
            dto.setGrapeRatings(member.getGrapeRatings().stream().map(this::toGrapeRatingDto).toList());
        } else {
            dto.setGrapeRatings(Collections.emptyList());
        }
        return dto;
    }

    public MemberDto create(MemberDto dto) {
        if (memberRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un miembro con el email: " + dto.getEmail());
        }
        return toDto(memberRepository.save(toEntity(dto)));
    }

    public MemberDto createOrSkip(MemberDto dto) {
        return memberRepository.findByEmail(dto.getEmail())
                .map(this::toDto)
                .orElseGet(() -> toDto(memberRepository.save(toEntity(dto))));
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

    @Transactional
    public WineRatingDto submitWineRating(Long memberId, WineRatingDto dto) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + memberId));
        Wine wine = wineRepository.findById(dto.getWineId())
                .orElseThrow(() -> new NoSuchElementException("Vino no encontrado: " + dto.getWineId()));

        WineRating rating = wineRatingRepository.findByMemberIdAndWineId(memberId, dto.getWineId())
                .orElseGet(WineRating::new);

        rating.setMember(member);
        rating.setWine(wine);
        rating.setRating(dto.getRating());
        rating.setNotes(dto.getNotes());

        return toWineRatingDto(wineRatingRepository.save(rating));
    }

    public List<WineRatingDto> getWineRatings(Long memberId) {
        return wineRatingRepository.findByMemberId(memberId).stream()
                .map(this::toWineRatingDto).toList();
    }

    @Transactional
    public MemberDto saveSurvey(Long memberId, SurveyDto dto) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + memberId));

        if (dto.getPhone() != null) member.setPhone(dto.getPhone());
        if (dto.getDeliveryAddress() != null) member.setDeliveryAddress(dto.getDeliveryAddress());
        if (dto.getWineStyle() != null) member.setWineStyle(dto.getWineStyle());
        if (dto.getWineTypes() != null) member.setWineTypes(dto.getWineTypes());
        if (dto.getOpenToNew() != null) member.setOpenToNew(dto.getOpenToNew());
        if (dto.getOccasions() != null) member.setOccasions(dto.getOccasions());
        if (dto.getKnowledge() != null) member.setKnowledge(dto.getKnowledge());
        if (dto.getFrequency() != null) member.setFrequency(dto.getFrequency());
        if (dto.getBudget() != null) member.setBudget(dto.getBudget());
        member.setSurveyCompletedAt(LocalDateTime.now());
        memberRepository.save(member);

        if (dto.getGrapeRatings() != null && !dto.getGrapeRatings().isEmpty()) {
            grapeRatingRepository.deleteByMemberId(memberId);
            List<MemberGrapeRating> ratings = new ArrayList<>();
            dto.getGrapeRatings().forEach((grape, rating) -> {
                if (rating != null && rating >= 1 && rating <= 5) {
                    MemberGrapeRating gr = new MemberGrapeRating();
                    gr.setMember(member);
                    gr.setGrape(grape);
                    gr.setRating(rating);
                    ratings.add(gr);
                }
            });
            grapeRatingRepository.saveAll(ratings);
        }

        emailService.sendSurveyWelcome(member);
        return getById(memberId);
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
        dto.setKnowledge(m.getKnowledge());
        dto.setFrequency(m.getFrequency());
        dto.setBudget(m.getBudget());
        dto.setSurveyCompletedAt(m.getSurveyCompletedAt());
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
        member.setKnowledge(dto.getKnowledge());
        member.setFrequency(dto.getFrequency());
        member.setBudget(dto.getBudget());
        return member;
    }

    private MemberGrapeRatingDto toGrapeRatingDto(MemberGrapeRating gr) {
        MemberGrapeRatingDto dto = new MemberGrapeRatingDto();
        dto.setId(gr.getId());
        dto.setGrape(gr.getGrape());
        dto.setRating(gr.getRating());
        return dto;
    }

    private WineRatingDto toWineRatingDto(WineRating wr) {
        WineRatingDto dto = new WineRatingDto();
        dto.setId(wr.getId());
        dto.setMemberId(wr.getMember().getId());
        dto.setWineId(wr.getWine().getId());
        dto.setWineName(wr.getWine().getName());
        dto.setRating(wr.getRating());
        dto.setNotes(wr.getNotes());
        dto.setRatedAt(wr.getRatedAt());
        return dto;
    }
}
