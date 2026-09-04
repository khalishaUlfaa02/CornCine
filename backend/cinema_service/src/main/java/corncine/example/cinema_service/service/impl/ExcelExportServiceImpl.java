package corncine.example.cinema_service.service.impl;

import corncine.example.cinema_service.entity.GenreEntity;
import corncine.example.cinema_service.entity.MovieEntity;
import corncine.example.cinema_service.repository.MovieRepository;
import corncine.example.cinema_service.service.ExcelExportService;
import lombok.RequiredArgsConstructor;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcelExportServiceImpl implements ExcelExportService {
    private final MovieRepository movieRepository;

    @Override
    public ByteArrayInputStream exportMoviesToExcel() throws IOException {
        String[] columns = {"ID Film", "Judul", "Durasi (Menit)", "Batasan Umur", "Tanggal Rilis", "Genre"};

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Katalog Film");

            // Header Style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Row Header
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            List<MovieEntity> movies = movieRepository.findAll();
            int rowIdx = 1;
            for (MovieEntity movie : movies) {
                if (movie.getDeleted()) continue;

                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(movie.getMovieId());
                row.createCell(1).setCellValue(movie.getTitle());
                row.createCell(2).setCellValue(movie.getDurationMinutes());
                row.createCell(3).setCellValue(movie.getAgeRating() != null ? movie.getAgeRating() : "-");
                row.createCell(4).setCellValue(movie.getReleaseDate() != null ? movie.getReleaseDate().toString() : "-");

                String genres = movie.getGenres().stream().map(GenreEntity::getGenreName).collect(Collectors.joining(", "));
                row.createCell(5).setCellValue(genres);
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
