package fudre.app.controller;

import fudre.app.dto.ShipmentDto;
import fudre.app.service.ShipmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @GetMapping
    public List<ShipmentDto> getAll() {
        return shipmentService.getAll();
    }

    @GetMapping("/{id}")
    public ShipmentDto getById(@PathVariable Long id) {
        return shipmentService.getById(id);
    }

    @GetMapping("/member/{memberId}")
    public List<ShipmentDto> getByMember(@PathVariable Long memberId) {
        return shipmentService.getByMember(memberId);
    }

    @PostMapping
    public ResponseEntity<ShipmentDto> create(@RequestBody ShipmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shipmentService.create(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        shipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
