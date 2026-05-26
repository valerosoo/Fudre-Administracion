package fudre.app.controller;

import fudre.app.dto.MembershipDto;
import fudre.app.service.MembershipService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memberships")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping
    public List<MembershipDto> getAll() {
        return membershipService.getAll();
    }

    @GetMapping("/{id}")
    public MembershipDto getById(@PathVariable Long id) {
        return membershipService.getById(id);
    }

    @GetMapping("/member/{memberId}")
    public List<MembershipDto> getByMember(@PathVariable Long memberId) {
        return membershipService.getByMember(memberId);
    }

    @PostMapping
    public ResponseEntity<MembershipDto> create(@RequestBody MembershipDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membershipService.create(dto));
    }

    @PutMapping("/{id}")
    public MembershipDto update(@PathVariable Long id, @RequestBody MembershipDto dto) {
        return membershipService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        membershipService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
