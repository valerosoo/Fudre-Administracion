package fudre.app.service;

import fudre.app.entity.*;
import fudre.app.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class StockSyncService {

    private final WineRepository wineRepository;
    private final TiendanubeService tiendanubeService;
    private final MemberRepository memberRepository;
    private final MembershipRepository membershipRepository;
    private final ShipmentRepository shipmentRepository;

    public StockSyncService(WineRepository wineRepository, TiendanubeService tiendanubeService,
                            MemberRepository memberRepository, MembershipRepository membershipRepository,
                            ShipmentRepository shipmentRepository) {
        this.wineRepository = wineRepository;
        this.tiendanubeService = tiendanubeService;
        this.memberRepository = memberRepository;
        this.membershipRepository = membershipRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @Transactional
    public void discountStockFromOrder(List<Map<String, Object>> products) {
        for (Map<String, Object> product : products) {
            String tiendanubeProductId = String.valueOf(product.get("product_id"));
            int quantity = toInt(product.get("quantity"));

            wineRepository.findByTiendanubeProductId(tiendanubeProductId).ifPresent(wine -> {
                int total = wine.getStockGondola() + wine.getStockCuartito();
                if (total < quantity) return;
                deductStock(wine, quantity);
                wineRepository.save(wine);
                syncStockToTiendanube(wine);
            });
        }
    }

    @Transactional
    public void restoreStockFromOrder(List<Map<String, Object>> products) {
        for (Map<String, Object> product : products) {
            String tiendanubeProductId = String.valueOf(product.get("product_id"));
            int quantity = toInt(product.get("quantity"));

            wineRepository.findByTiendanubeProductId(tiendanubeProductId).ifPresent(wine -> {
                wine.setStockGondola(wine.getStockGondola() + quantity);
                wineRepository.save(wine);
                syncStockToTiendanube(wine);
            });
        }
    }

    @Transactional
    public void createShipmentFromOrder(Map<String, Object> order) {
        String orderId = String.valueOf(order.get("id"));

        // Idempotencia: si ya procesamos esta orden, salir
        if (shipmentRepository.existsByTiendanubeOrderId(orderId)) return;

        // Buscar miembro por email del cliente
        @SuppressWarnings("unchecked")
        Map<String, Object> customer = (Map<String, Object>) order.get("customer");
        if (customer == null) return;
        String email = (String) customer.get("email");
        if (email == null) return;

        Optional<Member> memberOpt = memberRepository.findByEmail(email);
        if (memberOpt.isEmpty()) return;
        Member member = memberOpt.get();

        // Buscar membresía activa
        Optional<Membership> membershipOpt = membershipRepository.findByMemberIdAndStatus(
                member.getId(), MembershipStatus.ACTIVE);
        if (membershipOpt.isEmpty()) return;
        Membership membership = membershipOpt.get();

        // Mapear productos a vinos
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> products = (List<Map<String, Object>>) order.get("products");
        if (products == null || products.isEmpty()) return;

        List<ShipmentItem> items = new ArrayList<>();
        for (Map<String, Object> product : products) {
            String productId = String.valueOf(product.get("product_id"));
            int qty = toInt(product.get("quantity"));
            String priceStr = String.valueOf(product.get("price"));

            wineRepository.findByTiendanubeProductId(productId).ifPresent(wine -> {
                ShipmentItem item = new ShipmentItem();
                item.setWine(wine);
                item.setQuantity(qty);
                try { item.setUnitPrice(new BigDecimal(priceStr)); } catch (Exception ignored) {}
                items.add(item);
            });
        }

        if (items.isEmpty()) return;

        // Costo de envío
        BigDecimal shippingCost = BigDecimal.ZERO;
        try { shippingCost = new BigDecimal(String.valueOf(order.get("shipping_cost_customer"))); }
        catch (Exception ignored) {}

        // Fecha de la orden
        LocalDate shippedAt = LocalDate.now();
        try {
            String createdAt = (String) order.get("created_at");
            if (createdAt != null) shippedAt = LocalDate.parse(createdAt.substring(0, 10));
        } catch (Exception ignored) {}

        Shipment shipment = new Shipment();
        shipment.setMember(member);
        shipment.setMembership(membership);
        shipment.setShippedAt(shippedAt);
        shipment.setShippingCost(shippingCost);
        shipment.setTiendanubeOrderId(orderId);
        shipment.setNotes("Importado desde Tiendanube orden #" + orderId);

        Shipment saved = shipmentRepository.save(shipment);
        items.forEach(item -> item.setShipment(saved));
        saved.setItems(items);
        shipmentRepository.save(saved);
    }

    @Transactional
    public void cancelShipmentFromOrder(String orderId) {
        shipmentRepository.findByTiendanubeOrderId(orderId).ifPresent(shipment -> {
            if (shipment.getItems() != null) {
                for (ShipmentItem item : shipment.getItems()) {
                    Wine wine = item.getWine();
                    wine.setStockGondola(wine.getStockGondola() + item.getQuantity());
                    wineRepository.save(wine);
                    syncStockToTiendanube(wine);
                }
            }
            shipmentRepository.delete(shipment);
        });
    }

    public void syncStockToTiendanube(Wine wine) {
        if (wine.getTiendanubeProductId() == null || wine.getTiendanubeVariantId() == null) return;
        int totalStock = wine.getStockGondola() + wine.getStockCuartito();
        tiendanubeService.updateStock(wine.getTiendanubeProductId(), wine.getTiendanubeVariantId(), totalStock);
    }

    private void deductStock(Wine wine, int quantity) {
        int remaining = quantity;
        int fromGondola = Math.min(remaining, wine.getStockGondola());
        wine.setStockGondola(wine.getStockGondola() - fromGondola);
        remaining -= fromGondola;
        if (remaining > 0) wine.setStockCuartito(wine.getStockCuartito() - remaining);
    }

    private int toInt(Object value) {
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return 0; }
    }
}
