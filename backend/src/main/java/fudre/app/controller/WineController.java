package fudre.app.controller;

import fudre.app.dto.WineDto;
import fudre.app.service.WineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/wines")
public class WineController {

    private final WineService wineService;

    public WineController(WineService wineService) {
        this.wineService = wineService;
    }

    @GetMapping
    public List<WineDto> getAll() {
        return wineService.getAll();
    }

    @GetMapping("/{id}")
    public WineDto getById(@PathVariable Long id) {
        return wineService.getById(id);
    }

    @PostMapping
    public ResponseEntity<WineDto> create(@RequestBody WineDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wineService.create(dto));
    }

    @PutMapping("/{id}")
    public WineDto update(@PathVariable Long id, @RequestBody WineDto dto) {
        return wineService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        wineService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public WineDto uploadImage(@PathVariable Long id,
                               @RequestParam("file") MultipartFile file) throws IOException {
        return wineService.uploadImage(id, file);
    }
}
