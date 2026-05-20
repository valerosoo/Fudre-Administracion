package fudre.app.service;

import fudre.app.dto.WineDto;
import fudre.app.entity.Wine;
import fudre.app.repository.WineRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class WineService {

    private final WineRepository wineRepository;
    private final EntityManager entityManager;

    public WineService(WineRepository wineRepository, EntityManager entityManager) {
        this.wineRepository = wineRepository;
        this.entityManager = entityManager;
    }

    public List<WineDto> getAll() {
        return wineRepository.findAll().stream().map(this::toDto).toList();
    }

    public WineDto getById(Long id) {
        return wineRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new NoSuchElementException("Vino no encontrado: " + id));
    }

    @Transactional
    public WineDto create(WineDto dto) {
        Wine wine = toEntity(dto);
        wineRepository.save(wine);
        entityManager.flush();
        entityManager.refresh(wine);
        return toDto(wine);
    }

    @Transactional
    public WineDto update(Long id, WineDto dto) {
        Wine wine = wineRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Vino no encontrado: " + id));
        wine.setName(dto.getName());
        wine.setGrape(dto.getGrape());
        wine.setVintageYear(dto.getVintageYear());
        wine.setStockGondola(dto.getStockGondola());
        wine.setStockCuartito(dto.getStockCuartito());
        wine.setReferencePrice(dto.getReferencePrice());
        wine.setIsClubEligible(dto.getIsClubEligible());
        wine.setTiendanubeProductId(dto.getTiendanubeProductId());
        wine.setUploadStatus(dto.getUploadStatus());
        wineRepository.save(wine);
        entityManager.flush();
        entityManager.refresh(wine);
        return toDto(wine);
    }

    public void delete(Long id) {
        if (!wineRepository.existsById(id)) {
            throw new NoSuchElementException("Vino no encontrado: " + id);
        }
        wineRepository.deleteById(id);
    }

    private WineDto toDto(Wine wine) {
        WineDto dto = new WineDto();
        dto.setId(wine.getId());
        dto.setName(wine.getName());
        dto.setGrape(wine.getGrape());
        dto.setVintageYear(wine.getVintageYear());
        dto.setStockGondola(wine.getStockGondola());
        dto.setStockCuartito(wine.getStockCuartito());
        dto.setStockTotal(wine.getStockGondola() + wine.getStockCuartito());
        dto.setReferencePrice(wine.getReferencePrice());
        dto.setCategory(wine.getCategory());
        dto.setIsClubEligible(wine.getIsClubEligible());
        dto.setTiendanubeProductId(wine.getTiendanubeProductId());
        dto.setUploadStatus(wine.getUploadStatus());
        return dto;
    }

    private Wine toEntity(WineDto dto) {
        Wine wine = new Wine();
        wine.setName(dto.getName());
        wine.setGrape(dto.getGrape());
        wine.setVintageYear(dto.getVintageYear());
        wine.setStockGondola(dto.getStockGondola() != null ? dto.getStockGondola() : 0);
        wine.setStockCuartito(dto.getStockCuartito() != null ? dto.getStockCuartito() : 0);
        wine.setReferencePrice(dto.getReferencePrice());
        wine.setIsClubEligible(dto.getIsClubEligible() != null ? dto.getIsClubEligible() : false);
        wine.setTiendanubeProductId(dto.getTiendanubeProductId());
        wine.setUploadStatus(dto.getUploadStatus());
        return wine;
    }
}
