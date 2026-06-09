package fudre.app.controller;

import fudre.app.dto.*;
import fudre.app.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderDto> getAll() {
        return orderService.getAll();
    }

    @PostMapping
    public ResponseEntity<OrderDto> createFromPurchaseList() {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createFromPurchaseList());
    }

    @PostMapping("/import")
    public ResponseEntity<OrderDto> createFromImport(@RequestBody OrderImportDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createFromImport(dto));
    }

    @PutMapping("/{id}/status")
    public OrderDto updateStatus(@PathVariable Long id, @RequestBody UpdateOrderStatusDto dto) {
        return orderService.updateStatus(id, dto.getStatus());
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<OrderDto> addItem(@PathVariable Long id, @RequestBody AddOrderItemDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.addItem(id, dto));
    }

    @PutMapping("/{orderId}/items/{itemId}/status")
    public OrderItemDto updateItemStatus(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestBody UpdateOrderItemStatusDto dto) {
        return orderService.updateItemStatus(orderId, itemId, dto.getItemStatus());
    }

    @PutMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<OrderItemDto> updateItemQty(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestBody UpdateOrderItemQtyDto dto) {
        OrderItemDto result = orderService.updateItemQty(orderId, itemId, dto.getQuantity());
        return result == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(result);
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long orderId, @PathVariable Long itemId) {
        orderService.removeItem(orderId, itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
