package corncine.example.cinema_service.service.impl;

import corncine.example.cinema_service.entity.MovieEntity;
import corncine.example.cinema_service.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelImportServiceImpl {

    private final MovieRepository movieRepository;

    @Transactional
    public void importMoviesFromExcel(MultipartFile file) {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            List<MovieEntity> moviesToSave = new ArrayList<>();
            int rowNumber = 0;

            while (rows.hasNext()) {
                Row currentRow = rows.next();

                // Lewati baris header index ke-0
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }

                // Kolom 0: Judul, Kolom 1: Sinopsis, Kolom 2: Durasi, Kolom 3: Age Rating
                String title = currentRow.getCell(0).getStringCellValue();
                String synopsis = currentRow.getCell(1) != null ? currentRow.getCell(1).getStringCellValue() : "";
                int duration = (int) currentRow.getCell(2).getNumericCellValue();
                String ageRating = currentRow.getCell(3) != null ? currentRow.getCell(3).getStringCellValue() : "13+";

                MovieEntity movie = MovieEntity.builder()
                        .title(title)
                        .synopsis(synopsis)
                        .durationMinutes(duration)
                        .ageRating(ageRating)
                        .genres(new HashSet<>())
                        .deleted(false)
                        .build();

                moviesToSave.add(movie);
            }

            movieRepository.saveAll(moviesToSave);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengimpor data dari file Excel: " + e.getMessage());
        }
    }
}