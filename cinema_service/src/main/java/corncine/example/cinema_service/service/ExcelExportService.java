package corncine.example.cinema_service.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface ExcelExportService {
    ByteArrayInputStream exportMoviesToExcel() throws IOException;
}