package fudre.app.controller;

import fudre.app.dto.AddToCartDto;
import fudre.app.dto.PurchaseListItemDto;
import fudre.app.dto.UpdateQuantityDto;
import fudre.app.service.PurchaseListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-list")
public class PurchaseListController {

    private final PurchaseListService purchaseListService;

    public PurchaseListController(PurchaseListService purchaseListService) {
        this.purchaseListService = purchaseListService;
    }

    @GetMapping
    public List<PurchaseListItemDto> getAll() {
        return purchaseListService.getAll();
    }

    @PostMapping
    public ResponseEntity<PurchaseListItemDto> addItem(@RequestBody AddToCartDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseListService.addItem(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseListItemDto> updateQuantity(@PathVariable Long id,
                                                              @RequestBody UpdateQuantityDto dto) {
        PurchaseListItemDto result = purchaseListService.updateQuantity(id, dto.getQuantity());
        return result != null ? ResponseEntity.ok(result) : ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeItem(@PathVariable Long id) {
        purchaseListService.removeItem(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearAll() {
        purchaseListService.clearAll();
        return ResponseEntity.noContent().build();
    }
}
