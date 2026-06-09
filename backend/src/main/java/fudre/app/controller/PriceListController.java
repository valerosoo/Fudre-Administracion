package fudre.app.controller;

import fudre.app.dto.PriceListImportDto;
import fudre.app.dto.PriceListItemDto;
import fudre.app.service.PriceListService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/price-list")
public class PriceListController {

    private final PriceListService priceListService;

    public PriceListController(PriceListService priceListService) {
        this.priceListService = priceListService;
    }

    @GetMapping
    public List<PriceListItemDto> getAll() {
        return priceListService.getAll();
    }

    @PostMapping("/upsert")
    public ResponseEntity<List<PriceListItemDto>> upsert(@RequestBody PriceListImportDto dto) {
        return ResponseEntity.ok(priceListService.upsertBatch(dto));
    }
}
