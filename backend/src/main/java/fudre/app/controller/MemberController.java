package fudre.app.controller;

import fudre.app.dto.MemberDto;
import fudre.app.service.MemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public List<MemberDto> getAll() {
        return memberService.getAll();
    }

    @GetMapping("/{id}")
    public MemberDto getById(@PathVariable Long id) {
        return memberService.getById(id);
    }

    @PostMapping
    public ResponseEntity<MemberDto> create(@RequestBody MemberDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.create(dto));
    }

    @PutMapping("/{id}")
    public MemberDto update(@PathVariable Long id, @RequestBody MemberDto dto) {
        return memberService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        memberService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
