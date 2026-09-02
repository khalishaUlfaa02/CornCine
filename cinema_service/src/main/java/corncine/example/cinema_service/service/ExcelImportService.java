package corncine.example.cinema_service.service;

import org.springframework.web.multipart.MultipartFile;

public interface ExcelImportService {
    void importMoviesFromExcel(MultipartFile file);
}