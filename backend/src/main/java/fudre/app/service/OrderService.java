package fudre.app.service;

import fudre.app.dto.*;
import fudre.app.entity.*;
import fudre.app.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PurchaseListItemRepository purchaseListItemRepository;
    private final PriceListItemRepository priceListItemRepository;
    private final WineRepository wineRepository;
    private final TiendanubeService tiendanubeService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        PurchaseListItemRepository purchaseListItemRepository,
                        PriceListItemRepository priceListItemRepository,
                        WineRepository wineRepository,
                        TiendanubeService tiendanubeService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.purchaseListItemRepository = purchaseListItemRepository;
        this.priceListItemRepository = priceListItemRepository;
        this.wineRepository = wineRepository;
        this.tiendanubeService = tiendanubeService;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAll() {
        return orderRepository.findAll().stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public OrderDto createFromPurchaseList() {
        List<PurchaseListItem> cartItems = purchaseListItemRepository.findAll();
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("La lista de compra está vacía");
        }

        Order order = new Order();
        order.setOrderDate(LocalDate.now());
        order.setStatus("PENDING");
        Order saved = orderRepository.save(order);

        for (PurchaseListItem cartItem : cartItems) {
            PriceListItem pli = cartItem.getPriceListItem();
            Distributor d = pli.getDistributor();
            OrderItem oi = new OrderItem();
            oi.setOrder(saved);
            oi.setPriceListItemId(pli.getId());
            oi.setDistributorId(d.getId());
            oi.setDistributorName(d.getName());
            oi.setDistributorPhone(d.getPhone());
            oi.setDistributorEmail(d.getEmail());
            oi.setName(pli.getName());
            oi.setGrape(pli.getGrape());
            oi.setVintageYear(pli.getVintageYear());
            oi.setPurchasePrice(pli.getPurchasePrice());
            oi.setQuantity(cartItem.getQuantity());
            orderItemRepository.save(oi);
        }

        purchaseListItemRepository.deleteAll();
        return toDto(orderRepository.findById(saved.getId()).orElseThrow());
    }

    @Transactional
    public OrderDto createFromImport(OrderImportDto dto) {
        Order order = new Order();
        order.setOrderDate(LocalDate.now());
        order.setStatus("PENDING");
        Order saved = orderRepository.save(order);

        String distName = dto.getDistributor() != null ? dto.getDistributor().getName() : "Desconocido";
        String distPhone = dto.getDistributor() != null ? dto.getDistributor().getPhone() : null;
        String distEmail = dto.getDistributor() != null ? dto.getDistributor().getEmail() : null;

        for (OrderImportDto.ItemInfo item : dto.getItems()) {
            OrderItem oi = new OrderItem();
            oi.setOrder(saved);
            oi.setDistributorName(distName);
            oi.setDistributorPhone(distPhone);
            oi.setDistributorEmail(distEmail);
            oi.setName(item.getName());
            oi.setGrape(item.getGrape());
            oi.setVintageYear(item.getVintageYear());
            oi.setPurchasePrice(item.getPurchasePrice());
            oi.setQuantity(item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1);
            orderItemRepository.save(oi);
        }

        return toDto(orderRepository.findById(saved.getId()).orElseThrow());
    }

    @Transactional
    public OrderDto updateStatus(Long id, String newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + id));
        order.setStatus(newStatus);

        if ("DELIVERED".equals(newStatus)) {
            order.setDeliveredAt(LocalDate.now());
            for (OrderItem item : order.getItems()) {
                if (!"ORDERED".equals(item.getItemStatus())) continue;

                Wine wine = wineRepository.findByNameIgnoreCase(item.getName()).orElse(null);

                if (wine == null) {
                    wine = new Wine();
                    wine.setName(item.getName());
                    wine.setGrape(item.getGrape());
                    wine.setVintageYear(item.getVintageYear());
                    wine.setStockGondola(item.getQuantity());
                    wine.setStockCuartito(0);
                    wine.setReferencePrice(item.getPurchasePrice());
                    wine.setIsClubEligible(false);
                    wine = wineRepository.save(wine);
                } else {
                    wine.setStockGondola(wine.getStockGondola() + item.getQuantity());
                    wine = wineRepository.save(wine);
                }

                int newStock = wine.getStockGondola() + wine.getStockCuartito();

                if (wine.getTiendanubeProductId() != null && wine.getTiendanubeVariantId() != null) {
                    try {
                        tiendanubeService.updateStock(wine.getTiendanubeProductId(), wine.getTiendanubeVariantId(), newStock);
                    } catch (Exception e) {
                        log.warn("No se pudo actualizar stock en Tiendanube para '{}': {}", wine.getName(), e.getMessage());
                    }
                } else {
                    try {
                        String[] ids = tiendanubeService.createProduct(wine.getName(), wine.getReferencePrice(), newStock);
                        wine.setTiendanubeProductId(ids[0]);
                        wine.setTiendanubeVariantId(ids[1]);
                        wine.setUploadStatus("UPLOADED");
                        wineRepository.save(wine);
                    } catch (Exception e) {
                        log.warn("No se pudo crear producto en Tiendanube para '{}': {}", wine.getName(), e.getMessage());
                    }
                }
            }
        }

        return toDto(orderRepository.save(order));
    }

    @Transactional
    public OrderItemDto updateItemStatus(Long orderId, Long itemId, String itemStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + orderId));
        if (!"ORDERED".equals(order.getStatus())) {
            throw new IllegalStateException("Solo se puede cambiar el estado de ítems en pedidos confirmados (ORDERED)");
        }
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Ítem no encontrado: " + itemId));
        item.setItemStatus(itemStatus);
        return toItemDto(orderItemRepository.save(item));
    }

    @Transactional
    public OrderItemDto updateItemQty(Long orderId, Long itemId, Integer qty) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + orderId));
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Solo se pueden editar pedidos en estado PENDING");
        }
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Ítem no encontrado: " + itemId));
        if (qty <= 0) {
            orderItemRepository.delete(item);
            return null;
        }
        item.setQuantity(qty);
        return toItemDto(orderItemRepository.save(item));
    }

    @Transactional
    public OrderDto addItem(Long orderId, AddOrderItemDto dto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + orderId));
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Solo se pueden editar pedidos en estado PENDING");
        }
        PriceListItem pli = priceListItemRepository.findById(dto.getPriceListItemId())
                .orElseThrow(() -> new NoSuchElementException("Ítem no encontrado: " + dto.getPriceListItemId()));
        Distributor d = pli.getDistributor();
        OrderItem oi = new OrderItem();
        oi.setOrder(order);
        oi.setPriceListItemId(pli.getId());
        oi.setDistributorId(d.getId());
        oi.setDistributorName(d.getName());
        oi.setDistributorPhone(d.getPhone());
        oi.setDistributorEmail(d.getEmail());
        oi.setName(pli.getName());
        oi.setGrape(pli.getGrape());
        oi.setVintageYear(pli.getVintageYear());
        oi.setPurchasePrice(pli.getPurchasePrice());
        oi.setQuantity(dto.getQuantity() != null && dto.getQuantity() > 0 ? dto.getQuantity() : 1);
        orderItemRepository.save(oi);
        return toDto(orderRepository.findById(orderId).orElseThrow());
    }

    @Transactional
    public void removeItem(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + orderId));
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Solo se pueden editar pedidos en estado PENDING");
        }
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Ítem no encontrado: " + itemId));
        orderItemRepository.delete(item);
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Pedido no encontrado: " + id));
        if (!"PENDING".equals(order.getStatus()) && !"CANCELLED".equals(order.getStatus())) {
            throw new IllegalStateException("Solo se pueden eliminar pedidos PENDING o CANCELLED");
        }
        orderRepository.delete(order);
    }

    private OrderDto toDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setOrderDate(order.getOrderDate().toString());
        dto.setDeliveredAt(order.getDeliveredAt() != null ? order.getDeliveredAt().toString() : null);
        dto.setStatus(order.getStatus());
        dto.setNotes(order.getNotes());
        dto.setCreatedAt(order.getCreatedAt());

        List<OrderItemDto> itemDtos = order.getItems().stream()
                .sorted(Comparator.comparing(OrderItem::getDistributorName).thenComparing(OrderItem::getName))
                .map(this::toItemDto)
                .toList();
        dto.setItems(itemDtos);
        List<OrderItemDto> orderedItems = itemDtos.stream()
                .filter(i -> i.getItemStatus() == null || "ORDERED".equals(i.getItemStatus()))
                .toList();
        dto.setTotalItems(orderedItems.stream().mapToInt(OrderItemDto::getQuantity).sum());

        BigDecimal total = orderedItems.stream()
                .filter(i -> i.getPurchasePrice() != null)
                .map(i -> i.getPurchasePrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalAmount(total);

        return dto;
    }

    private OrderItemDto toItemDto(OrderItem item) {
        OrderItemDto dto = new OrderItemDto();
        dto.setId(item.getId());
        dto.setDistributorName(item.getDistributorName());
        dto.setDistributorPhone(item.getDistributorPhone());
        dto.setDistributorEmail(item.getDistributorEmail());
        dto.setName(item.getName());
        dto.setGrape(item.getGrape());
        dto.setVintageYear(item.getVintageYear());
        dto.setPurchasePrice(item.getPurchasePrice());
        dto.setQuantity(item.getQuantity());
        if (item.getPurchasePrice() != null) {
            dto.setSubtotal(item.getPurchasePrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        dto.setItemStatus(item.getItemStatus());
        return dto;
    }
}
