package fudre.app.service;

import fudre.app.dto.RecommendationDto;
import fudre.app.dto.WineDto;
import fudre.app.dto.ShipmentDto;
import fudre.app.dto.ShipmentItemDto;
import fudre.app.entity.*;
import fudre.app.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final Map<Plan, Integer> WINES_PER_PLAN = Map.of(
            Plan.BROTE, 2,
            Plan.BROTE_PLUS, 3,
            Plan.ENVERO, 4,
            Plan.ENVERO_PLUS, 5
    );

    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final WinePoolRepository winePoolRepository;
    private final ShipmentRepository shipmentRepository;
    private final WineRatingRepository wineRatingRepository;

    public RecommendationService(MemberRepository memberRepository,
                                  MembershipRepository membershipRepository,
                                  WinePoolRepository winePoolRepository,
                                  ShipmentRepository shipmentRepository,
                                  WineRatingRepository wineRatingRepository) {
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.winePoolRepository = winePoolRepository;
        this.shipmentRepository = shipmentRepository;
        this.wineRatingRepository = wineRatingRepository;
    }

    @Transactional(readOnly = true)
    public RecommendationDto getRecommendations(Long memberId) {
        RecommendationDto result = new RecommendationDto();
        result.setParaVos(Collections.emptyList());
        result.setNuevasExperiencias(Collections.emptyList());

        ScoredResult scored = buildScoredCandidates(memberId);
        if (scored == null) return result;

        List<WineDto> paraVos = scored.sortedCandidates().stream().limit(2)
                .map(sw -> toWineDto(sw.wine())).collect(Collectors.toList());

        Set<String> strongGrapes = scored.surveyGrapeRatings().entrySet().stream()
                .filter(e -> e.getValue() > 3.0)
                .map(Map.Entry::getKey).collect(Collectors.toSet());

        Set<Long> paraVosIds = paraVos.stream().map(WineDto::getId).collect(Collectors.toSet());

        List<WineDto> nuevasExperiencias = scored.sortedCandidates().stream()
                .filter(sw -> !paraVosIds.contains(sw.wine().getId()))
                .filter(sw -> {
                    String g = sw.wine().getGrape() != null
                            ? sw.wine().getGrape().toLowerCase() : "";
                    return !strongGrapes.contains(g);
                })
                .limit(2)
                .map(sw -> toWineDto(sw.wine()))
                .collect(Collectors.toList());

        if (nuevasExperiencias.size() < 2) {
            Set<Long> usedIds = new HashSet<>(paraVosIds);
            nuevasExperiencias.forEach(w -> usedIds.add(w.getId()));
            List<WineDto> fallback = scored.sortedCandidates().stream()
                    .filter(sw -> !usedIds.contains(sw.wine().getId()))
                    .limit(2 - nuevasExperiencias.size())
                    .map(sw -> toWineDto(sw.wine()))
                    .collect(Collectors.toList());
            nuevasExperiencias = new ArrayList<>(nuevasExperiencias);
            nuevasExperiencias.addAll(fallback);
        }

        result.setParaVos(paraVos);
        result.setNuevasExperiencias(nuevasExperiencias);
        return result;
    }

    @Transactional
    public List<ShipmentDto> generateProposalsForMonth(int year, int month) {
        List<Membership> activeMemberships = membershipRepository.findAll().stream()
                .filter(m -> m.getStatus() == MembershipStatus.ACTIVE)
                .collect(Collectors.toList());

        List<ShipmentDto> created = new ArrayList<>();

        for (Membership membership : activeMemberships) {
            Long memberId = membership.getMember().getId();

            if (shipmentRepository.existsProposalForMemberInMonth(memberId, year, month,
                    ShipmentType.MEMBERSHIP, ShipmentStatus.PROPOSED)) {
                continue;
            }

            ScoredResult scored = buildScoredCandidates(memberId);
            if (scored == null || scored.sortedCandidates().isEmpty()) continue;

            int winesNeeded = WINES_PER_PLAN.getOrDefault(membership.getPlan(), 2);
            List<Wine> topWines = scored.sortedCandidates().stream()
                    .limit(winesNeeded)
                    .map(ScoredWine::wine)
                    .collect(Collectors.toList());

            Shipment shipment = new Shipment();
            shipment.setMember(membership.getMember());
            shipment.setMembership(membership);
            shipment.setShippedAt(LocalDate.of(year, month, 1));
            shipment.setType(ShipmentType.MEMBERSHIP);
            shipment.setStatus(ShipmentStatus.PROPOSED);
            shipment.setNotes("Propuesta generada automáticamente para " + month + "/" + year);

            Shipment saved = shipmentRepository.save(shipment);

            List<ShipmentItem> items = topWines.stream().map(wine -> {
                ShipmentItem item = new ShipmentItem();
                item.setShipment(saved);
                item.setWine(wine);
                item.setQuantity(1);
                item.setUnitPrice(wine.getReferencePrice());
                return item;
            }).collect(Collectors.toList());

            saved.setItems(items);
            created.add(toShipmentDto(shipmentRepository.save(saved)));
        }

        return created;
    }

    // Builds the sorted scored candidate list for a member. Returns null if insufficient data.
    private ScoredResult buildScoredCandidates(Long memberId) {
        Member member = memberRepository.findById(memberId).orElse(null);
        if (member == null) return null;

        Optional<Membership> activeMembership = membershipRepository.findByMemberIdAndStatus(
                memberId, MembershipStatus.ACTIVE);
        if (activeMembership.isEmpty()) return null;

        Plan plan = activeMembership.get().getPlan();
        List<WinePool> pool = winePoolRepository.findByPlanAndIsActiveTrue(plan);
        if (pool.isEmpty()) return null;

        Set<Long> receivedWineIds = shipmentRepository.findConfirmedWineIdsByMemberId(memberId);
        long receivedCount = shipmentRepository.countDistinctConfirmedWinesForMember(memberId);

        Map<String, Double> surveyGrapeRatings = new HashMap<>();
        if (member.getGrapeRatings() != null) {
            for (MemberGrapeRating gr : member.getGrapeRatings()) {
                surveyGrapeRatings.put(gr.getGrape().toLowerCase(), gr.getRating().doubleValue());
            }
        }

        List<Wine> candidates = pool.stream()
                .map(WinePool::getWine)
                .filter(w -> Boolean.TRUE.equals(w.getIsClubEligible()))
                .filter(w -> !receivedWineIds.contains(w.getId()))
                .collect(Collectors.toList());

        List<ScoredWine> sortedCandidates = candidates.stream().map(wine -> {
            String grapeKey = wine.getGrape() != null ? wine.getGrape().toLowerCase() : "";
            double surveyScore = surveyGrapeRatings.getOrDefault(grapeKey, 3.0);
            double score;
            if (receivedCount < 10) {
                score = surveyScore;
            } else {
                List<WineRating> grapeRatings = wineRatingRepository
                        .findByMemberIdAndWineGrape(memberId, wine.getGrape());
                if (!grapeRatings.isEmpty()) {
                    double avg = grapeRatings.stream()
                            .mapToInt(WineRating::getRating).average().orElse(surveyScore);
                    score = 0.4 * surveyScore + 0.6 * avg;
                } else {
                    score = surveyScore;
                }
            }
            return new ScoredWine(wine, score);
        }).sorted(Comparator.comparingDouble(ScoredWine::score).reversed())
                .collect(Collectors.toList());

        return new ScoredResult(sortedCandidates, surveyGrapeRatings);
    }

    private WineDto toWineDto(Wine w) {
        WineDto dto = new WineDto();
        dto.setId(w.getId());
        dto.setName(w.getName());
        dto.setGrape(w.getGrape());
        dto.setVintageYear(w.getVintageYear());
        dto.setReferencePrice(w.getReferencePrice());
        dto.setCategory(w.getCategory());
        dto.setIsClubEligible(w.getIsClubEligible());
        dto.setImageUrl(w.getImageUrl());
        dto.setStockGondola(w.getStockGondola());
        dto.setStockCuartito(w.getStockCuartito());
        dto.setStockTotal(w.getStockGondola() + w.getStockCuartito());
        return dto;
    }

    private ShipmentDto toShipmentDto(Shipment s) {
        ShipmentDto dto = new ShipmentDto();
        dto.setId(s.getId());
        dto.setMemberId(s.getMember().getId());
        dto.setMemberName(s.getMember().getName());
        dto.setMemberEmail(s.getMember().getEmail());
        dto.setMembershipId(s.getMembership().getId());
        dto.setShippedAt(s.getShippedAt());
        dto.setType(s.getType());
        dto.setStatus(s.getStatus());
        dto.setNotes(s.getNotes());
        if (s.getItems() != null) {
            dto.setItems(s.getItems().stream().map(item -> {
                ShipmentItemDto iDto = new ShipmentItemDto();
                iDto.setId(item.getId());
                iDto.setWineId(item.getWine().getId());
                iDto.setWineName(item.getWine().getName());
                iDto.setWineGrape(item.getWine().getGrape());
                iDto.setQuantity(item.getQuantity());
                iDto.setUnitPrice(item.getUnitPrice());
                return iDto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }

    private record ScoredWine(Wine wine, double score) {}
    private record ScoredResult(List<ScoredWine> sortedCandidates, Map<String, Double> surveyGrapeRatings) {}
}
