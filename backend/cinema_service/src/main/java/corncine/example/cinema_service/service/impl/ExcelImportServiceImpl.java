package corncine.example.cinema_service.service.impl;

import corncine.example.cinema_service.service.ExcelImportService;
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
public class ExcelImportServiceImpl implements ExcelImportService {

    private final MovieRepository movieRepository;

    @Override
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

                // Format mengikuti hasil EXPORT: [ID, Judul, Durasi, Age Rating, Release Date, Genre]
                // Kolom 0: ID Film (diabaikan untuk insert baru)
                String title = getStringValue(currentRow.getCell(1));
                if (title == null || title.isBlank()) continue;

                int duration = (int) getNumericValue(currentRow.getCell(2));
                if (duration <= 0) duration = 120;

                String ageRating = getStringValue(currentRow.getCell(3));
                if (ageRating == null || ageRating.isBlank() || "-".equals(ageRating)) ageRating = "13+";

                String releaseDateStr = getStringValue(currentRow.getCell(4));
                java.time.LocalDate releaseDate = null;
                if (releaseDateStr != null && !"-".equals(releaseDateStr) && !releaseDateStr.isBlank()) {
                    try {
                        releaseDate = java.time.LocalDate.parse(releaseDateStr);
                    } catch (Exception ignored) {}
                }

                String genreStr = getStringValue(currentRow.getCell(5));

                MovieEntity movie = MovieEntity.builder()
                        .title(title)
                        .synopsis("Diimpor dari Excel pada " + java.time.LocalDate.now())
                        .durationMinutes(duration)
                        .ageRating(ageRating)
                        .releaseDate(releaseDate)
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

    private String getStringValue(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.STRING) {
                return cell.getStringCellValue().trim();
            } else if (cell.getCellType() == CellType.NUMERIC) {
                if (org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    return String.valueOf((int) val);
                }
                return String.valueOf(val);
            } else if (cell.getCellType() == CellType.BOOLEAN) {
                return String.valueOf(cell.getBooleanCellValue());
            }
        } catch (Exception ignored) {}
        return null;
    }

    private double getNumericValue(Cell cell) {
        if (cell == null) return 0;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return cell.getNumericCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                return Double.parseDouble(cell.getStringCellValue().trim());
            }
        } catch (Exception ignored) {}
        return 0;
    }
}