package corncine.example.cinema_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import corncine.example.cinema_service.payload.req.StudioReq;
import corncine.example.cinema_service.payload.res.StudioRes;
import corncine.example.cinema_service.service.StudioService;
import corncine.example.cinema_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/studios")
@RequiredArgsConstructor
public class StudioController {

    private final StudioService studioService;

    @GetMapping("/cinema/{cinemaId}")
    public ResponseEntity<Message> getStudiosByCinemaId(@PathVariable Integer cinemaId) {
        List<StudioRes> result = studioService.getStudiosByCinemaId(cinemaId);
        return new ResponseEntity<>(Message.success("Daftar studio berhasil dimuat.", result), HttpStatus.OK);
    }

    @GetMapping("/{studioId}")
    public ResponseEntity<Message> getStudioById(@PathVariable Integer studioId) {
        StudioRes result = studioService.getStudioById(studioId);
        return new ResponseEntity<>(Message.success("Detail studio berhasil diambil.", result), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> createStudio(@Valid @RequestBody StudioReq req) {
        studioService.createStudio(req);
        return new ResponseEntity<>(Message.success("Studio baru berhasil ditambahkan.", null), HttpStatus.CREATED);
    }

    @PutMapping("/{studioId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> updateStudio(@PathVariable Integer studioId, @Valid @RequestBody StudioReq req) {
        studioService.updateStudio(studioId, req);
        return new ResponseEntity<>(Message.success("Data studio berhasil diperbarui.", null), HttpStatus.OK);
    }

    @DeleteMapping("/{studioId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> deleteStudio(@PathVariable Integer studioId) {
        studioService.deleteStudio(studioId);
        return new ResponseEntity<>(Message.success("Studio berhasil dihapus.", null), HttpStatus.OK);
    }
}
