package fudre.app.service;

import fudre.app.entity.Wine;
import fudre.app.repository.WineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StockSyncService {

    private final WineRepository wineRepository;
    private final TiendanubeService tiendanubeService;

    public StockSyncService(WineRepository wineRepository, TiendanubeService tiendanubeService) {
        this.wineRepository = wineRepository;
        this.tiendanubeService = tiendanubeService;
    }

    @Transactional
    public void discountStockFromOrder(List<Map<String, Object>> products) {
        for (Map<String, Object> product : products) {
            String tiendanubeProductId = String.valueOf(product.get("product_id"));
            int quantity = (int) product.get("quantity");

            Optional<Wine> wineOpt = wineRepository.findByTiendanubeProductId(tiendanubeProductId);
            if (wineOpt.isEmpty()) continue;

            Wine wine = wineOpt.get();
            int total = wine.getStockGondola() + wine.getStockCuartito();
            if (total < quantity) continue;

            int remaining = quantity;
            int fromGondola = Math.min(remaining, wine.getStockGondola());
            wine.setStockGondola(wine.getStockGondola() - fromGondola);
            remaining -= fromGondola;
            if (remaining > 0) {
                wine.setStockCuartito(wine.getStockCuartito() - remaining);
            }
            wineRepository.save(wine);
        }
    }

    public void syncStockToTiendanube(Wine wine) {
        if (wine.getTiendanubeProductId() == null) return;
        int totalStock = wine.getStockGondola() + wine.getStockCuartito();
        tiendanubeService.updateStock(wine.getTiendanubeProductId(), wine.getTiendanubeProductId(), totalStock);
    }
}
