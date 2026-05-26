package fudre.app.controller;

import fudre.app.service.StockSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/tiendanube")
public class TiendanubeWebhookController {

    private final StockSyncService stockSyncService;

    public TiendanubeWebhookController(StockSyncService stockSyncService) {
        this.stockSyncService = stockSyncService;
    }

    @PostMapping("/orders")
    public ResponseEntity<Void> handleOrder(@RequestBody Map<String, Object> payload) {
        String event = (String) payload.get("event");
        if ("order/paid".equals(event) || "order/fulfilled".equals(event)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> order = (Map<String, Object>) payload.get("order");
            if (order != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> products = (List<Map<String, Object>>) order.get("products");
                if (products != null) {
                    stockSyncService.discountStockFromOrder(products);
                }
            }
        }
        return ResponseEntity.ok().build();
    }
}
