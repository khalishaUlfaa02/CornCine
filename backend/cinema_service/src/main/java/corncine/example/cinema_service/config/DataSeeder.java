package corncine.example.cinema_service.config;

import corncine.example.cinema_service.entity.CinemaEntity;
import corncine.example.cinema_service.entity.GenreEntity;
import corncine.example.cinema_service.entity.MovieEntity;
import corncine.example.cinema_service.entity.ScheduleEntity;
import corncine.example.cinema_service.entity.SeatEntity;
import corncine.example.cinema_service.entity.StudioEntity;
import corncine.example.cinema_service.repository.CinemaRepository;
import corncine.example.cinema_service.repository.GenreRepository;
import corncine.example.cinema_service.repository.MovieRepository;
import corncine.example.cinema_service.repository.ScheduleRepository;
import corncine.example.cinema_service.repository.SeatRepository;
import corncine.example.cinema_service.repository.StudioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CinemaRepository cinemaRepository;
    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;
    private final StudioRepository studioRepository;
    private final SeatRepository seatRepository;
    private final ScheduleRepository scheduleRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Idempotent: jika film sudah >= 20, anggap seed sudah jalan
        if (movieRepository.count() >= 20) {
            return;
        }

        seedGenres();
        seedCinemas();
        seedStudiosAndSeats();
        seedMovies();
        seedSchedules();
        log.info(">>> SEEDER cinema_service: katalog demo berhasil dibuat (>=20 film, jadwal, studio, kursi)");
    }

    private void seedGenres() {
        String[] names = {"Action", "Adventure", "Animation", "Comedy", "Drama",
                "Horror", "Romance", "Sci-Fi", "Thriller", "Fantasy"};
        for (String name : names) {
            if (!genreRepository.existsByGenreNameIgnoreCase(name)) {
                genreRepository.save(GenreEntity.builder().genreName(name).build());
            }
        }
    }

    private void seedCinemas() {
        Object[][] data = {
                {"CornCine Grand Indonesia", "Jakarta", "Jl. MH Thamrin No. 1, Jakarta Pusat", "021-1111111"},
                {"CornCine Paris Van Java", "Bandung", "Jl. Sukajadi No. 137, Bandung", "022-2222222"},
                {"CornCine Tunjungan Plaza", "Surabaya", "Jl. Basuki Rahmat No. 8, Surabaya", "031-3333333"},
                {"CornCine Ambarrukmo Plaza", "Yogyakarta", "Jl. Laksda Adisucipto No. 80, Sleman", "0274-444444"},
                {"CornCine Living World", "Bali", "Jl. Gatot Subroto, Denpasar", "0361-555555"},
        };
        for (Object[] row : data) {
            String name = (String) row[0];
            if (cinemaRepository.existsByNameIgnoreCase(name)) {
                continue;
            }
            cinemaRepository.save(CinemaEntity.builder()
                    .name(name)
                    .city((String) row[1])
                    .address((String) row[2])
                    .phoneNumber((String) row[3])
                    .isActive(true)
                    .deleted(false)
                    .build());
        }
    }

    private void seedStudiosAndSeats() {
        List<CinemaEntity> cinemas = cinemaRepository.findAll();
        for (CinemaEntity cinema : cinemas) {
            List<StudioEntity> existing = studioRepository.findByCinema_CinemaId(cinema.getCinemaId());
            if (existing.size() >= 2) {
                continue;
            }
            // 2 studio per cabang: 1 Regular + 1 IMAX/Premiere bergantian
            StudioEntity s1 = studioRepository.save(StudioEntity.builder()
                    .cinema(cinema).studioNumber(1).studioType("REGULAR").totalSeats(48).build());
            generateSeats(s1, 6, 8, "REGULAR");

            String type = (cinema.getCinemaId() % 2 == 0) ? "IMAX" : "PREMIERE";
            StudioEntity s2 = studioRepository.save(StudioEntity.builder()
                    .cinema(cinema).studioNumber(2).studioType(type).totalSeats(32).build());
            generateSeats(s2, 4, 8, "REGULAR");
        }
    }

    private void generateSeats(StudioEntity studio, int rows, int seatsPerRow, String seatType) {
        List<SeatEntity> seats = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            String rowLabel = String.valueOf((char) ('A' + r));
            for (int s = 1; s <= seatsPerRow; s++) {
                seats.add(SeatEntity.builder()
                        .studio(studio)
                        .seatRow(rowLabel)
                        .seatNumber(s)
                        .seatCode(rowLabel + s)
                        .seatType(seatType)
                        .build());
            }
        }
        seatRepository.saveAll(seats);
    }

    private void seedMovies() {
        if (movieRepository.count() > 0) {
            return;
        }
        Object[][] data = {
                {"Avengers: Secret Wars", 180, "R13+", "Action", 2026, 5, 1},
                {"Interstellar Odyssey", 169, "SU", "Sci-Fi", 2026, 6, 15},
                {"The Dark Knight Returns", 152, "D17+", "Action", 2026, 7, 20},
                {"Cyberpunk Nexus 2099", 145, "D17+", "Sci-Fi", 2026, 8, 1},
                {"Spirited Kingdom", 125, "SU", "Animation", 2026, 4, 10},
                {"Horor Malam Jumat", 110, "D17+", "Horror", 2026, 3, 7},
                {"Komedi Kacau Balau", 105, "SU", "Comedy", 2026, 2, 14},
                {"Cinta di Ujung Senja", 118, "R13+", "Romance", 2026, 2, 14},
                {"Petualangan Nusantara", 122, "SU", "Adventure", 2026, 5, 20},
                {"Misteri Villa Tua", 108, "D17+", "Thriller", 2026, 6, 5},
                {"Drama Keluarga Kita", 130, "SU", "Drama", 2026, 1, 10},
                {"Galaxy Defenders", 140, "R13+", "Action", 2026, 7, 4},
                {"Robot Sahabatku", 98, "SU", "Animation", 2026, 6, 21},
                {"Hantu Kosan", 95, "D17+", "Horror", 2026, 8, 8},
                {"Stand Up Malam Ini", 100, "SU", "Comedy", 2026, 4, 25},
                {"Janji Hati", 115, "R13+", "Romance", 2026, 2, 28},
                {"Samudra Terakhir", 135, "SU", "Adventure", 2026, 7, 11},
                {"Kasus Terakhir Detektif", 128, "D17+", "Thriller", 2026, 5, 30},
                {"Ayahku Pahlawanku", 112, "SU", "Drama", 2026, 3, 21},
                {"Dunia Fantasi Ajaib", 120, "SU", "Fantasy", 2026, 12, 20},
                {"Perang Bintang Timur", 150, "R13+", "Sci-Fi", 2026, 12, 25},
        };
        for (Object[] row : data) {
            String genreName = (String) row[3];
            GenreEntity genre = genreRepository.findByGenreNameIgnoreCase(genreName).orElse(null);
            Set<GenreEntity> genres = new HashSet<>();
            if (genre != null) {
                genres.add(genre);
            }
            movieRepository.save(MovieEntity.builder()
                    .title((String) row[0])
                    .synopsis("Sinopsis demo untuk film " + row[0] + ".")
                    .durationMinutes((Integer) row[1])
                    .ageRating((String) row[2])
                    .releaseDate(LocalDate.of((Integer) row[4], (Integer) row[5], (Integer) row[6]))
                    .genres(genres)
                    .deleted(false)
                    .build());
        }
    }

    private void seedSchedules() {
        if (scheduleRepository.count() >= 20) {
            return;
        }
        List<MovieEntity> movies = movieRepository.findAll().stream()
                .filter(m -> !Boolean.TRUE.equals(m.getDeleted()))
                .limit(10)
                .toList();
        List<StudioEntity> studios = studioRepository.findAll();
        if (movies.isEmpty() || studios.isEmpty()) {
            return;
        }
        // 2 jadwal per film (hari ini & besok) -> 20 jadwal
        LocalDate today = LocalDate.now();
        LocalTime[] times = {LocalTime.of(13, 0), LocalTime.of(16, 30)};
        int i = 0;
        for (MovieEntity movie : movies) {
            for (int d = 0; d < 2; d++) {
                StudioEntity studio = studios.get(i % studios.size());
                LocalTime start = times[(i + d) % times.length];
                scheduleRepository.save(ScheduleEntity.builder()
                        .movie(movie)
                        .studio(studio)
                        .showDate(today.plusDays(d))
                        .startTime(start)
                        .endTime(start.plusMinutes(movie.getDurationMinutes() + 20))
                        .price(new BigDecimal("45000"))
                        .build());
                i++;
            }
        }
    }
}
