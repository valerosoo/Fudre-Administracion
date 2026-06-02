package fudre.app.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class TiendanubeService {

    private final RestClient restClient;

    public TiendanubeService(RestClient tiendanubeRestClient) {
        this.restClient = tiendanubeRestClient;
    }

    @SuppressWarnings("unchecked")
    public String[] createProduct(String name, BigDecimal price, int stock) {
        Map<String, Object> body = Map.of(
            "name", Map.of("es", name),
            "variants", List.of(Map.of(
                "price", price != null ? price.toPlainString() : "0",
                "stock", stock
            ))
        );
        Map<String, Object> response = restClient.post()
                .uri("/products")
                .body(body)
                .retrieve()
                .body(Map.class);

        String productId = String.valueOf(response.get("id"));
        List<Map<String, Object>> variants = (List<Map<String, Object>>) response.get("variants");
        String variantId = variants != null && !variants.isEmpty()
                ? String.valueOf(variants.get(0).get("id"))
                : productId;
        return new String[]{productId, variantId};
    }

    public void updateProduct(String productId, String variantId, String name, BigDecimal price, int stock) {
        restClient.put()
                .uri("/products/{productId}", productId)
                .body(Map.of("name", Map.of("es", name)))
                .retrieve()
                .toBodilessEntity();

        restClient.put()
                .uri("/products/{productId}/variants/{variantId}", productId, variantId)
                .body(Map.of(
                    "price", price != null ? price.toPlainString() : "0",
                    "stock", stock
                ))
                .retrieve()
                .toBodilessEntity();
    }

    public void updateStock(String productId, String variantId, int newStock) {
        restClient.put()
                .uri("/products/{productId}/variants/{variantId}", productId, variantId)
                .body(Map.of("stock", newStock))
                .retrieve()
                .toBodilessEntity();
    }

    public void deleteProduct(String productId) {
        restClient.delete()
                .uri("/products/{productId}", productId)
                .retrieve()
                .toBodilessEntity();
    }

    public void uploadProductImage(String productId, String imageUrl) {
        restClient.post()
                .uri("/products/{productId}/images", productId)
                .body(Map.of("src", imageUrl))
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
