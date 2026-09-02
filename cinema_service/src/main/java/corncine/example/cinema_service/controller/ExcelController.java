package corncine.example.cinema_service.controller;

import corncine.example.cinema_service.service.ExcelExportService;
import corncine.example.cinema_service.service.ExcelImportService;
import corncine.example.cinema_service.utility.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@RestController
@RequestMapping("/movies/excel")
@RequiredArgsConstructor
public class ExcelController {

    private final ExcelExportService excelExportService;
    private final ExcelImportService excelImportService;

    // Akses: ADMIN & STAFF dapat mengunduh laporan Excel
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<InputStreamResource> exportExcel() throws IOException {
        ByteArrayInputStream in = excelExportService.exportMoviesToExcel();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=Daftar_Film_CornCine.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    // Akses: Hanya ADMIN yang dapat mengimpor data masal
    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> importExcel(@RequestParam("file") MultipartFile file) {
        excelImportService.importMoviesFromExcel(file);
        return ResponseEntity.ok(Message.success("Data film dari Excel berhasil diimpor ke database.", null));
    }
}