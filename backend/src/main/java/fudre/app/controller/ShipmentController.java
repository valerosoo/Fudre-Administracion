package fudre.app.controller;

import fudre.app.dto.ShipmentDto;
import fudre.app.entity.ShipmentType;
import fudre.app.service.ShipmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @GetMapping("/type/{type}")
    public List<ShipmentDto> getByType(@PathVariable String type) {
        return shipmentService.getByType(ShipmentType.valueOf(type.toUpperCase()));
    }

    @PostMapping
    public ResponseEntity<ShipmentDto> create(@RequestBody ShipmentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shipmentService.create(dto));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ShipmentDto> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.confirm(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        shipmentService.cancel(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate-proposals")
    public ResponseEntity<List<ShipmentDto>> generateProposals(
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {
        if (year == 0) year = LocalDate.now().getYear();
        if (month == 0) month = LocalDate.now().getMonthValue();
        return ResponseEntity.ok(shipmentService.generateProposals(year, month));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        shipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
