package fudre.app.service;

import fudre.app.dto.WineDto;
import fudre.app.entity.Wine;
import fudre.app.repository.WineRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class WineService {

    private static final Logger log = LoggerFactory.getLogger(WineService.class);

    private final WineRepository wineRepository;
    private final EntityManager entityManager;
    private final TiendanubeService tiendanubeService;

    @Value("${fudre.uploads.dir:uploads}")
    private String uploadsDir;

    @Value("${fudre.server.base-url:http://localhost:8080}")
    private String serverBaseUrl;

    public WineService(WineRepository wineRepository, EntityManager entityManager,
                       TiendanubeService tiendanubeService) {
        this.wineRepository = wineRepository;
        this.entityManager = entityManager;
        this.tiendanubeService = tiendanubeService;
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
        wine.setUploadStatus("PENDING");
        wineRepository.save(wine);
        entityManager.flush();
        entityManager.refresh(wine);

        try {
            int totalStock = wine.getStockGondola() + wine.getStockCuartito();
            String[] ids = tiendanubeService.createProduct(wine.getName(), wine.getReferencePrice(), totalStock);
            wine.setTiendanubeProductId(ids[0]);
            wine.setTiendanubeVariantId(ids[1]);
            wine.setUploadStatus("UPLOADED");
            wineRepository.save(wine);
        } catch (Exception e) {
            log.warn("No se pudo sincronizar con Tiendanube al crear vino '{}': {}", wine.getName(), e.getMessage());
        }

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
        wineRepository.save(wine);
        entityManager.flush();
        entityManager.refresh(wine);

        if (wine.getTiendanubeProductId() != null && wine.getTiendanubeVariantId() != null) {
            try {
                int totalStock = wine.getStockGondola() + wine.getStockCuartito();
                tiendanubeService.updateProduct(
                    wine.getTiendanubeProductId(), wine.getTiendanubeVariantId(),
                    wine.getName(), wine.getReferencePrice(), totalStock);
                wine.setUploadStatus("UPLOADED");
                wineRepository.save(wine);
            } catch (Exception e) {
                log.warn("No se pudo sincronizar con Tiendanube al actualizar vino '{}': {}", wine.getName(), e.getMessage());
            }
        }

        return toDto(wine);
    }

    @Transactional
    public void delete(Long id) {
        Wine wine = wineRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Vino no encontrado: " + id));

        if (wine.getTiendanubeProductId() != null) {
            try {
                tiendanubeService.deleteProduct(wine.getTiendanubeProductId());
            } catch (Exception e) {
                log.warn("No se pudo eliminar de Tiendanube el vino '{}': {}", wine.getName(), e.getMessage());
            }
        }

        wineRepository.deleteById(id);
    }

    @Transactional
    public WineDto uploadImage(Long id, MultipartFile file) throws IOException {
        Wine wine = wineRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Vino no encontrado: " + id));

        String ext = getExtension(file.getOriginalFilename());
        String filename = "wine_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
        Path dir = Paths.get(uploadsDir, "wines");
        Files.createDirectories(dir);
        Files.write(dir.resolve(filename), file.getBytes());

        String publicUrl = serverBaseUrl + "/uploads/wines/" + filename;
        wine.setImageUrl(publicUrl);
        wineRepository.save(wine);

        if (wine.getTiendanubeProductId() != null) {
            try {
                tiendanubeService.uploadProductImage(wine.getTiendanubeProductId(), publicUrl);
            } catch (Exception e) {
                log.warn("No se pudo subir imagen a Tiendanube para vino '{}': {}", wine.getName(), e.getMessage());
            }
        }

        return toDto(wine);
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
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
        dto.setTiendanubeVariantId(wine.getTiendanubeVariantId());
        dto.setUploadStatus(wine.getUploadStatus());
        dto.setImageUrl(wine.getImageUrl());
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
        return wine;
    }
}
