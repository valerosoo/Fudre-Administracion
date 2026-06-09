package fudre.app.service;

import fudre.app.dto.DistributorDto;
import fudre.app.dto.PriceListImportDto;
import fudre.app.dto.PriceListItemDto;
import fudre.app.dto.PriceListItemImportDto;
import fudre.app.entity.Distributor;
import fudre.app.entity.PriceListItem;
import fudre.app.repository.DistributorRepository;
import fudre.app.repository.PriceListItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class PriceListService {

    private final PriceListItemRepository priceListItemRepository;
    private final DistributorRepository distributorRepository;

    public PriceListService(PriceListItemRepository priceListItemRepository,
                            DistributorRepository distributorRepository) {
        this.priceListItemRepository = priceListItemRepository;
        this.distributorRepository = distributorRepository;
    }

    @Transactional(readOnly = true)
    public List<PriceListItemDto> getAll() {
        return priceListItemRepository.findAll().stream()
                .sorted(Comparator.comparing((PriceListItem i) -> i.getDistributor().getName())
                        .thenComparing(PriceListItem::getName))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public List<PriceListItemDto> upsertBatch(PriceListImportDto importDto) {
        DistributorDto dDto = importDto.getDistributor();

        Distributor distributor = distributorRepository.findByName(dDto.getName())
                .orElseGet(() -> {
                    Distributor d = new Distributor();
                    d.setName(dDto.getName());
                    return d;
                });

        if (dDto.getPhone() != null) distributor.setPhone(dDto.getPhone());
        if (dDto.getEmail() != null) distributor.setEmail(dDto.getEmail());
        distributorRepository.save(distributor);

        List<PriceListItem> upserted = importDto.getItems().stream()
                .filter(i -> i.getName() != null && !i.getName().isBlank())
                .map(i -> upsertItem(distributor, i))
                .toList();

        return upserted.stream().map(this::toDto).toList();
    }

    private PriceListItem upsertItem(Distributor distributor, PriceListItemImportDto dto) {
        PriceListItem item = priceListItemRepository
                .findByDistributorIdAndNameAndVintageYear(distributor.getId(), dto.getName(), dto.getVintageYear())
                .orElseGet(() -> {
                    PriceListItem i = new PriceListItem();
                    i.setDistributor(distributor);
                    i.setName(dto.getName());
                    i.setGrape(dto.getGrape());
                    i.setVintageYear(dto.getVintageYear());
                    return i;
                });

        item.setPurchasePrice(dto.getPurchasePrice());
        if (dto.getImageUrl() != null) item.setImageUrl(dto.getImageUrl());
        item.setUpdatedAt(LocalDateTime.now());
        return priceListItemRepository.save(item);
    }

    private PriceListItemDto toDto(PriceListItem item) {
        Distributor d = item.getDistributor();
        PriceListItemDto dto = new PriceListItemDto();
        dto.setId(item.getId());
        dto.setDistributorId(d.getId());
        dto.setDistributorName(d.getName());
        dto.setDistributorPhone(d.getPhone());
        dto.setDistributorEmail(d.getEmail());
        dto.setName(item.getName());
        dto.setGrape(item.getGrape());
        dto.setVintageYear(item.getVintageYear());
        dto.setPurchasePrice(item.getPurchasePrice());
        dto.setImageUrl(item.getImageUrl());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}
