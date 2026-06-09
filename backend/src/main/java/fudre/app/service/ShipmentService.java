package fudre.app.service;

import fudre.app.dto.ShipmentDto;
import fudre.app.dto.ShipmentItemDto;
import fudre.app.entity.*;
import fudre.app.repository.MemberRepository;
import fudre.app.repository.MembershipRepository;
import fudre.app.repository.ShipmentRepository;
import fudre.app.repository.WineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final WineRepository wineRepository;
    private final StockSyncService stockSyncService;
    private final RecommendationService recommendationService;

    public ShipmentService(ShipmentRepository shipmentRepository, MemberRepository memberRepository,
                           MembershipRepository membershipRepository, WineRepository wineRepository,
                           StockSyncService stockSyncService, RecommendationService recommendationService) {
        this.shipmentRepository = shipmentRepository;
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.wineRepository = wineRepository;
        this.stockSyncService = stockSyncService;
        this.recommendationService = recommendationService;
    }

    public List<ShipmentDto> getAll() {
        return shipmentRepository.findAll().stream().map(this::toDto).toList();
    }

    public ShipmentDto getById(Long id) {
        return shipmentRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new NoSuchElementException("Envío no encontrado: " + id));
    }

    public List<ShipmentDto> getByMember(Long memberId) {
        return shipmentRepository.findByMemberId(memberId).stream().map(this::toDto).toList();
    }

    public List<ShipmentDto> getByType(ShipmentType type) {
        return shipmentRepository.findByType(type).stream().map(this::toDto).toList();
    }

    @Transactional
    public ShipmentDto create(ShipmentDto dto) {
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new NoSuchElementException("Miembro no encontrado: " + dto.getMemberId()));
        Membership membership = membershipRepository.findById(dto.getMembershipId())
                .orElseThrow(() -> new NoSuchElementException("Membresía no encontrada: " + dto.getMembershipId()));

        ShipmentType type = dto.getType() != null ? dto.getType() : ShipmentType.STANDALONE;
        ShipmentStatus status = dto.getStatus() != null ? dto.getStatus() : ShipmentStatus.CONFIRMED;

        Shipment shipment = new Shipment();
        shipment.setMember(member);
        shipment.setMembership(membership);
        shipment.setShippedAt(dto.getShippedAt() != null ? dto.getShippedAt() : LocalDate.now());
        shipment.setShippingCost(dto.getShippingCost());
        shipment.setNotes(dto.getNotes());
        shipment.setType(type);
        shipment.setStatus(status);

        boolean deductStock = status == ShipmentStatus.CONFIRMED;

        if (dto.getItems() != null) {
            List<ShipmentItem> items = dto.getItems().stream().map(itemDto -> {
                Wine wine = wineRepository.findById(itemDto.getWineId())
                        .orElseThrow(() -> new NoSuchElementException("Vino no encontrado: " + itemDto.getWineId()));
                int qty = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;
                if (deductStock) {
                    if (wine.getStockGondola() + wine.getStockCuartito() < qty) {
                        throw new IllegalStateException("Stock insuficiente para el vino: " + wine.getName());
                    }
                    deductWineStock(wine, qty);
                    wineRepository.save(wine);
                    stockSyncService.syncStockToTiendanube(wine);
                }
                ShipmentItem item = new ShipmentItem();
                item.setShipment(shipment);
                item.setWine(wine);
                item.setQuantity(qty);
                item.setUnitPrice(itemDto.getUnitPrice());
                return item;
            }).toList();
            shipment.setItems(items);
        }

        return toDto(shipmentRepository.save(shipment));
    }

    @Transactional
    public ShipmentDto confirm(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Envío no encontrado: " + id));
        if (shipment.getStatus() != ShipmentStatus.PROPOSED) {
            throw new IllegalStateException("Solo se pueden confirmar envíos en estado PROPOSED");
        }

        if (shipment.getItems() != null) {
            for (ShipmentItem item : shipment.getItems()) {
                Wine wine = item.getWine();
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                if (wine.getStockGondola() + wine.getStockCuartito() < qty) {
                    throw new IllegalStateException("Stock insuficiente para el vino: " + wine.getName());
                }
                deductWineStock(wine, qty);
                wineRepository.save(wine);
                stockSyncService.syncStockToTiendanube(wine);
            }
        }

        shipment.setStatus(ShipmentStatus.CONFIRMED);
        return toDto(shipmentRepository.save(shipment));
    }

    @Transactional
    public void cancel(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Envío no encontrado: " + id));

        if (shipment.getStatus() == ShipmentStatus.CONFIRMED && shipment.getItems() != null) {
            for (ShipmentItem item : shipment.getItems()) {
                Wine wine = item.getWine();
                wine.setStockGondola(wine.getStockGondola() + item.getQuantity());
                wineRepository.save(wine);
                stockSyncService.syncStockToTiendanube(wine);
            }
        }

        shipment.setStatus(ShipmentStatus.CANCELLED);
        shipmentRepository.save(shipment);
    }

    @Transactional
    public void delete(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Envío no encontrado: " + id));
        if (shipment.getStatus() == ShipmentStatus.CONFIRMED && shipment.getItems() != null) {
            for (ShipmentItem item : shipment.getItems()) {
                Wine wine = item.getWine();
                wine.setStockGondola(wine.getStockGondola() + item.getQuantity());
                wineRepository.save(wine);
                stockSyncService.syncStockToTiendanube(wine);
            }
        }
        shipmentRepository.deleteById(id);
    }

    public List<ShipmentDto> generateProposals(int year, int month) {
        return recommendationService.generateProposalsForMonth(year, month);
    }

    private void deductWineStock(Wine wine, int qty) {
        int remaining = qty;
        int fromGondola = Math.min(remaining, wine.getStockGondola());
        wine.setStockGondola(wine.getStockGondola() - fromGondola);
        remaining -= fromGondola;
        if (remaining > 0) {
            wine.setStockCuartito(wine.getStockCuartito() - remaining);
        }
    }

    private ShipmentDto toDto(Shipment s) {
        ShipmentDto dto = new ShipmentDto();
        dto.setId(s.getId());
        dto.setMemberId(s.getMember().getId());
        dto.setMemberName(s.getMember().getName());
        dto.setMemberEmail(s.getMember().getEmail());
        dto.setMembershipId(s.getMembership().getId());
        dto.setShippedAt(s.getShippedAt());
        dto.setShippingCost(s.getShippingCost());
        dto.setNotes(s.getNotes());
        dto.setTiendanubeOrderId(s.getTiendanubeOrderId());
        dto.setType(s.getType());
        dto.setStatus(s.getStatus());
        if (s.getItems() != null) {
            dto.setItems(s.getItems().stream().map(this::toItemDto).toList());
        }
        return dto;
    }

    private ShipmentItemDto toItemDto(ShipmentItem item) {
        ShipmentItemDto dto = new ShipmentItemDto();
        dto.setId(item.getId());
        dto.setWineId(item.getWine().getId());
        dto.setWineName(item.getWine().getName());
        dto.setWineGrape(item.getWine().getGrape());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        return dto;
    }
}
