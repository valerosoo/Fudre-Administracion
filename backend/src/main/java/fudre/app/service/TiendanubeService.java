package fudre.app.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class TiendanubeService {

    private final RestClient restClient;

    public TiendanubeService(RestClient tiendanubeRestClient) {
        this.restClient = tiendanubeRestClient;
    }

    public void updateStock(String productId, String variantId, int newStock) {
        restClient.put()
                .uri("/products/{productId}/variants/{variantId}", productId, variantId)
                .body(Map.of("stock", newStock))
                .retrieve()
                .toBodilessEntity();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getOrder(String orderId) {
        return restClient.get()
                .uri("/orders/{orderId}", orderId)
                .retrieve()
                .body(Map.class);
    }
}
