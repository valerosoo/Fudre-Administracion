package fudre.app.service;

import fudre.app.dto.AddToCartDto;
import fudre.app.dto.PurchaseListItemDto;
import fudre.app.entity.Distributor;
import fudre.app.entity.PriceListItem;
import fudre.app.entity.PurchaseListItem;
import fudre.app.repository.PriceListItemRepository;
import fudre.app.repository.PurchaseListItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PurchaseListService {

    private final PurchaseListItemRepository purchaseListItemRepository;
    private final PriceListItemRepository priceListItemRepository;

    public PurchaseListService(PurchaseListItemRepository purchaseListItemRepository,
                               PriceListItemRepository priceListItemRepository) {
        this.purchaseListItemRepository = purchaseListItemRepository;
        this.priceListItemRepository = priceListItemRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseListItemDto> getAll() {
        return purchaseListItemRepository.findAll().stream()
                .sorted(Comparator.comparing((PurchaseListItem i) -> i.getPriceListItem().getDistributor().getName())
                        .thenComparing(i -> i.getPriceListItem().getName()))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PurchaseListItemDto addItem(AddToCartDto dto) {
        if (dto.getQuantity() == null || dto.getQuantity() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        return purchaseListItemRepository.findByPriceListItemId(dto.getPriceListItemId())
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + dto.getQuantity());
                    return toDto(purchaseListItemRepository.save(existing));
                })
                .orElseGet(() -> {
                    PriceListItem pli = priceListItemRepository.findById(dto.getPriceListItemId())
                            .orElseThrow(() -> new NoSuchElementException("Item no encontrado: " + dto.getPriceListItemId()));
                    PurchaseListItem item = new PurchaseListItem();
                    item.setPriceListItem(pli);
                    item.setQuantity(dto.getQuantity());
                    return toDto(purchaseListItemRepository.save(item));
                });
    }

    @Transactional
    public PurchaseListItemDto updateQuantity(Long id, Integer quantity) {
        PurchaseListItem item = purchaseListItemRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Item no encontrado: " + id));
        if (quantity <= 0) {
            purchaseListItemRepository.delete(item);
            return null;
        }
        item.setQuantity(quantity);
        return toDto(purchaseListItemRepository.save(item));
    }

    @Transactional
    public void removeItem(Long id) {
        PurchaseListItem item = purchaseListItemRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Item no encontrado: " + id));
        purchaseListItemRepository.delete(item);
    }

    @Transactional
    public void clearAll() {
        purchaseListItemRepository.deleteAll();
    }

    private PurchaseListItemDto toDto(PurchaseListItem item) {
        PriceListItem pli = item.getPriceListItem();
        Distributor d = pli.getDistributor();
        PurchaseListItemDto dto = new PurchaseListItemDto();
        dto.setId(item.getId());
        dto.setPriceListItemId(pli.getId());
        dto.setName(pli.getName());
        dto.setGrape(pli.getGrape());
        dto.setVintageYear(pli.getVintageYear());
        dto.setPurchasePrice(pli.getPurchasePrice());
        dto.setImageUrl(pli.getImageUrl());
        dto.setDistributorId(d.getId());
        dto.setDistributorName(d.getName());
        dto.setDistributorPhone(d.getPhone());
        dto.setDistributorEmail(d.getEmail());
        dto.setQuantity(item.getQuantity());
        dto.setAddedAt(item.getAddedAt());
        return dto;
    }
}
