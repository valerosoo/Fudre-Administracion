package fudre.app.controller;

import fudre.app.dto.MemberDto;
import fudre.app.service.MemberService;
import fudre.app.service.StockSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/tiendanube")
public class TiendanubeWebhookController {

    private final StockSyncService stockSyncService;
    private final MemberService memberService;

    public TiendanubeWebhookController(StockSyncService stockSyncService, MemberService memberService) {
        this.stockSyncService = stockSyncService;
        this.memberService = memberService;
    }

    /**
     * Endpoint único para todos los eventos de Tiendanube.
     * Registrar esta URL en el panel de Tiendanube para todos los topics.
     *
     * Eventos manejados:
     * - order/paid       → descuenta stock + crea envío en la BD
     * - order/cancelled  → restaura stock + elimina envío si existe
     * - customer/created → crea miembro en la BD (si no existe)
     */
    @PostMapping
    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> payload) {
        String event = (String) payload.get("event");
        if (event == null) return ResponseEntity.ok().build();

        switch (event) {
            case "order/paid" -> handleOrderPaid(payload);
            case "order/cancelled" -> handleOrderCancelled(payload);
            case "customer/created" -> handleCustomerCreated(payload);
        }

        return ResponseEntity.ok().build();
    }

    // Mantener endpoint legacy /orders por compatibilidad con Tiendanube si ya estaba registrado
    @PostMapping("/orders")
    public ResponseEntity<Void> handleOrderLegacy(@RequestBody Map<String, Object> payload) {
        return handleWebhook(payload);
    }

    @SuppressWarnings("unchecked")
    private void handleOrderPaid(Map<String, Object> payload) {
        Map<String, Object> order = (Map<String, Object>) payload.get("order");
        if (order == null) return;

        List<Map<String, Object>> products = (List<Map<String, Object>>) order.get("products");
        if (products != null) {
            stockSyncService.discountStockFromOrder(products);
        }
        stockSyncService.createShipmentFromOrder(order);
    }

    @SuppressWarnings("unchecked")
    private void handleOrderCancelled(Map<String, Object> payload) {
        Map<String, Object> order = (Map<String, Object>) payload.get("order");
        if (order == null) return;

        List<Map<String, Object>> products = (List<Map<String, Object>>) order.get("products");
        if (products != null) {
            stockSyncService.restoreStockFromOrder(products);
        }

        String orderId = String.valueOf(order.get("id"));
        stockSyncService.cancelShipmentFromOrder(orderId);
    }

    @SuppressWarnings("unchecked")
    private void handleCustomerCreated(Map<String, Object> payload) {
        Map<String, Object> customer = (Map<String, Object>) payload.get("customer");
        if (customer == null) return;

        String email = (String) customer.get("email");
        String name  = (String) customer.get("name");
        String phone = (String) customer.get("phone");

        String address = null;
        Map<String, Object> defaultAddress = (Map<String, Object>) customer.get("default_address");
        if (defaultAddress != null) {
            String street = (String) defaultAddress.get("address");
            String city   = (String) defaultAddress.get("city");
            if (street != null && city != null) address = street + ", " + city;
            else if (street != null) address = street;
        }

        if (email == null) return;

        MemberDto dto = new MemberDto();
        dto.setEmail(email);
        dto.setName(name != null ? name : "Sin Nombre");
        dto.setPhone(phone);
        dto.setDeliveryAddress(address);

        memberService.createOrSkip(dto);
    }
}
