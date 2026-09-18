CREATE TABLE tbl_roles (
    role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    role_code VARCHAR(30) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 2: Users (Soft Delete: deleted = false/true)
CREATE TABLE tbl_users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role_id INT NOT NULL REFERENCES tbl_roles(role_id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 3: User Profiles (Relasi 1:1 dengan tbl_users)
CREATE TABLE tbl_user_profiles (
    profile_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES tbl_users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    identity_card_number VARCHAR(30),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 4: Menu Navigasi
CREATE TABLE tbl_menu (
    menu_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    menu_code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 5: Hak Akses Menu (Relasi N:M antara Role dan Menu)
CREATE TABLE tbl_menu_access (
    menu_access_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INT NOT NULL REFERENCES tbl_roles(role_id) ON DELETE CASCADE,
    menu_id INT NOT NULL REFERENCES tbl_menu(menu_id) ON DELETE CASCADE,
    permissions VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_menu UNIQUE (role_id, menu_id)
);

-- Tabel 6: Token Lupa Password
CREATE TABLE tbl_password_resets (
    reset_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 7: Master Genre Film
CREATE TABLE tbl_genres (
    genre_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    genre_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 8: Master Film (Soft Delete: deleted = false/true)
CREATE TABLE tbl_movies (
    movie_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    director VARCHAR(100) NOT NULL,
    cast_members TEXT NOT NULL,
    duration INT NOT NULL,
    age_rating VARCHAR(10) DEFAULT 'SU',
    synopsis TEXT NOT NULL,
    poster_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'NOW_SHOWING',
    release_date DATE NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 9: Penghubung Film & Genre (Relasi N:M)
CREATE TABLE tbl_movie_genres (
    movie_genre_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    movie_id INT NOT NULL REFERENCES tbl_movies(movie_id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES tbl_genres(genre_id) ON DELETE CASCADE,
    CONSTRAINT uq_movie_genre UNIQUE (movie_id, genre_id)
);

-- Tabel 10: Master Bioskop
CREATE TABLE tbl_cinemas (
    cinema_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 11: Master Studio Bioskop
CREATE TABLE tbl_studios (
    studio_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cinema_id INT NOT NULL REFERENCES tbl_cinemas(cinema_id) ON DELETE CASCADE,
    studio_name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    studio_type VARCHAR(30) DEFAULT 'REGULAR',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 12: Master Kursi Studio
CREATE TABLE tbl_seats (
    seat_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studio_id INT NOT NULL REFERENCES tbl_studios(studio_id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL,
    row_name VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_studio_seat UNIQUE (studio_id, seat_code)
);

-- Tabel 13: Jadwal Tayang Film
CREATE TABLE tbl_schedules (
    schedule_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    movie_id INT NOT NULL REFERENCES tbl_movies(movie_id) ON DELETE CASCADE,
    studio_id INT NOT NULL REFERENCES tbl_studios(studio_id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    ticket_price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 14: Transaksi Pemesanan Tiket
CREATE TABLE tbl_booking_transactions (
    transaction_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES tbl_users(user_id) ON DELETE CASCADE,
    schedule_id INT NOT NULL REFERENCES tbl_schedules(schedule_id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    total_tickets INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_deadline TIMESTAMP NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 15: Lembar Tiket Kursi
CREATE TABLE tbl_tickets (
    ticket_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES tbl_booking_transactions(transaction_id) ON DELETE CASCADE,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    schedule_id INT NOT NULL REFERENCES tbl_schedules(schedule_id) ON DELETE CASCADE,
    seat_id INT NOT NULL REFERENCES tbl_seats(seat_id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'BOOKED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PENCEGAHAN DOUBLE BOOKING: Kursi yang sama di jadwal yang sama tidak bisa dipesan 2 kali
CREATE UNIQUE INDEX uq_active_schedule_seat 
ON tbl_tickets (schedule_id, seat_id) 
WHERE status IN ('BOOKED', 'PAID');

-- INDEX QUERY SEARCH
CREATE INDEX idx_users_username ON tbl_users(username);
CREATE INDEX idx_movies_title ON tbl_movies(title);
CREATE INDEX idx_schedules_search ON tbl_schedules(show_date, movie_id);
CREATE INDEX idx_tickets_schedule ON tbl_tickets(schedule_id);

-- FUNGSI POSTGRESQL UNTUK HITUNG TOTAL
CREATE OR REPLACE FUNCTION hitung_total_transaksi(
    p_harga_tiket NUMERIC,
    p_jumlah_kursi INT,
    p_biaya_layanan NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (p_harga_tiket * p_jumlah_kursi) + p_biaya_layanan;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 3. DML: 10 DATA AWAL (SEED DATA)
-- -----------------------------------------------------------------------------

-- 3 ROLES
INSERT INTO tbl_roles (role_name, role_code) VALUES
('Administrator', 'ADMIN'),
('Staff Bioskop', 'STAFF'),
('Customer', 'CUSTOMER');

-- 7 MENU
INSERT INTO tbl_menu (menu_name, menu_code) VALUES
('User Management', 'user_menu'),
('Movie Management', 'movie_menu'),
('Cinema Management', 'cinema_menu'),
('Schedule Management', 'schedule_menu'),
('Ticket Validation', 'validation_menu'),
('Online Booking', 'booking_menu'),
('Report & Dashboard', 'report_menu');

-- MENU ACCESS
INSERT INTO tbl_menu_access (role_id, menu_id, permissions) VALUES
(1, 1, 'view,create,update,delete'),
(1, 2, 'view,create,update,delete'),
(1, 3, 'view,create,update,delete'),
(1, 4, 'view,create,update,delete'),
(1, 5, 'view,create,update,delete'),
(1, 6, 'view,create,update,delete'),
(1, 7, 'view,create,update,delete'),
(2, 2, 'view,create,update'),
(2, 4, 'view,create,update'),
(2, 5, 'view,update'),
(2, 7, 'view'),
(3, 2, 'view'),
(3, 4, 'view'),
(3, 6, 'view,create,update');

---- 10 USERS (Password default: 'password123')
---- Hash BCrypt: $2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K
--INSERT INTO tbl_users (username, password, email, role_id, status) VALUES
--('admin', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'admin@corncine.com', 1, 'ACTIVE'),
--('superadmin', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'superadmin@corncine.com', 1, 'ACTIVE'),
--('staff_jkt', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'staff.jkt@corncine.com', 2, 'ACTIVE'),
--('staff_bdg', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'staff.bdg@corncine.com', 2, 'ACTIVE'),
--('budi_santoso', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'budi.santoso@gmail.com', 3, 'ACTIVE'),
--('siti_aminah', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'siti.aminah@gmail.com', 3, 'ACTIVE'),
--('ahmad_dahlan', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'ahmad.dahlan@gmail.com', 3, 'ACTIVE'),
--('dewi_lestari', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'dewi.lestari@gmail.com', 3, 'ACTIVE'),
--('rizky_pratama', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'rizky.pratama@gmail.com', 3, 'ACTIVE'),
--('ratna_sari', '$2a$10$7Q9j7WkGzL787F6n8d7kOu6A7aL3K2xQYhZ8W1V0X5n1Z1B3K9d2K', 'ratna.sari@gmail.com', 3, 'ACTIVE');
--
---- 10 USER PROFILES (1:1 dengan User)
--INSERT INTO tbl_user_profiles (user_id, full_name, phone_number, identity_card_number, birth_date, gender, address) VALUES
--(1, 'Super Administrator CornCine', '08110000001', '3171010101900001', '1990-01-01', 'MALE', 'Jl. Jenderal Sudirman No. 1, Jakarta'),
--(2, 'System Administrator 2', '08110000002', '3171010101910002', '1991-02-02', 'MALE', 'Jl. M.H. Thamrin No. 2, Jakarta'),
--(3, 'Bambang Staff Jakarta', '08120000003', '3172020202920003', '1992-03-03', 'MALE', 'Jl. Gatot Subroto No. 3, Jakarta'),
--(4, 'Rina Staff Bandung', '08120000004', '3273030303930004', '1993-04-04', 'FEMALE', 'Jl. Asia Afrika No. 4, Bandung'),
--(5, 'Budi Santoso', '08130000005', '3174050505950005', '1995-06-06', 'MALE', 'Jl. Tebet Raya No. 5, Jakarta'),
--(6, 'Siti Aminah', '08130000006', '3174060606960006', '1996-07-07', 'FEMALE', 'Jl. Duren Tiga No. 6, Jakarta'),
--(7, 'Ahmad Dahlan', '08130000007', '3273070707970007', '1997-08-08', 'MALE', 'Jl. Dago No. 7, Bandung'),
--(8, 'Dewi Lestari', '08130000008', '3273080808980008', '1998-09-09', 'FEMALE', 'Jl. R.E. Martadinata No. 8, Bandung'),
--(9, 'Rizky Pratama', '08130000009', '3578090909990009', '1999-10-10', 'MALE', 'Jl. Darmo No. 9, Surabaya'),
--(10, 'Ratna Sari', '08130000010', '3578101010000010', '2000-11-11', 'FEMALE', 'Jl. Gubeng No. 10, Surabaya');
--
-- 6 MASTER GENRES
INSERT INTO tbl_genres (genre_name) VALUES
('Action'), ('Sci-Fi'), ('Drama'), ('Horror'), ('Comedy'), ('Animation');

-- 10 FILM UTAMA
INSERT INTO tbl_movies (
    title,
    duration,
    age_rating,
    synopsis,
    poster_url,
    trailer_url,
    release_date,
    deleted,
    created_at,
    updated_at
) VALUES
('Avengers: Secret Wars', 180, 'R13+', 'Pahlawan multiverse bersatu menghadapi kehancuran semesta.', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2026-05-01', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Interstellar Odyssey', 169, 'SU', 'Perjalanan luar angkasa mencari planet baru hunian manusia.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2026-06-15', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('The Dark Knight Returns', 152, 'D17+', 'Kembalinya ksatria kegelapan melindungi kota Gotham.', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=500', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2026-07-20', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cyberpunk Nexus 2099', 145, 'D17+', 'Detektif masa depan mengungkap konspirasi jaringan AI raksasa.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2026-08-01', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Spirited Kingdom', 125, 'SU', 'Petualangan magis seorang gadis cilik di dunia roh ajaib.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2026-04-10', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


ALTER TABLE tbl_movies ALTER COLUMN title TYPE varchar(150) USING title::varchar;

-- MOVIE_GENRES (Relasi N:M)
INSERT INTO tbl_movie_genres (movie_id, genre_id) VALUES
(1, 1), (1, 2), -- Avengers (Action, Sci-Fi)
(2, 2), (2, 3), -- Interstellar (Sci-Fi, Drama)
(3, 1), (3, 3), -- Batman (Action, Drama)
(4, 2), (4, 1), -- Cyberpunk (Sci-Fi, Action)
(5, 6), (5, 3); -- Spirited Kingdom (Animation, Drama)
(6, 4),         -- Conjuring (Horror)
(7, 1),         -- Fast Track (Action)
(8, 3),         -- Laskar Pelangi (Drama)
(9, 4),         -- Pengabdi Setan (Horror)
(10, 1), (10, 2); -- Avatar (Action, Sci-Fi)

-- 3 BIOSKOP
INSERT INTO tbl_cinemas (name, address, city) VALUES
('CornCine Grand Indonesia', 'Jl. M.H. Thamrin No.1', 'Jakarta'),
('CornCine Paris Van Java', 'Jl. Sukajadi No.131-139', 'Bandung'),
('CornCine Tunjungan Plaza', 'Jl. Jenderal Basuki Rahmat No.8-12', 'Surabaya');

-- 4 STUDIOS
INSERT INTO tbl_studios (cinema_id, studio_name, capacity, studio_type) VALUES
(1, 'Studio 1 IMAX', 10, 'IMAX'),
(1, 'Studio 2 Regular', 10, 'REGULAR'),
(2, 'Studio 1 Premiere', 10, 'PREMIERE'),
(3, 'Studio 1 Regular', 10, 'REGULAR');

-- KURSI OTOMATIS (A1-A5, B1-B5 = 10 Kursi per studio)
INSERT INTO tbl_seats (studio_id, seat_code, row_name, seat_number)
SELECT s.id, 'A' || n, 'A', n FROM (SELECT studio_id AS id FROM tbl_studios) s CROSS JOIN generate_series(1, 5) n
UNION ALL
SELECT s.id, 'B' || n, 'B', n FROM (SELECT studio_id AS id FROM tbl_studios) s CROSS JOIN generate_series(1, 5) n;

-- 10 JADWAL TAYANG
INSERT INTO tbl_schedules (movie_id, studio_id, show_date, start_time, end_time, ticket_price, status) VALUES
(1, 1, CURRENT_DATE, '10:00:00', '13:00:00', 75000.00, 'OPEN'),
(1, 1, CURRENT_DATE, '14:00:00', '17:00:00', 75000.00, 'OPEN'),
(1, 1, CURRENT_DATE, '18:30:00', '21:30:00', 75000.00, 'OPEN'),
(2, 2, CURRENT_DATE, '11:00:00', '13:50:00', 50000.00, 'OPEN'),
(2, 2, CURRENT_DATE, '15:00:00', '17:50:00', 50000.00, 'OPEN');
--(3, 3, CURRENT_DATE, '13:00:00', '15:35:00', 100000.00, 'OPEN'),
--(3, 3, CURRENT_DATE, '17:00:00', '19:35:00', 100000.00, 'OPEN'),
--(4, 4, CURRENT_DATE, '12:00:00', '14:25:00', 45000.00, 'OPEN'),
--(5, 1, CURRENT_DATE + INTERVAL '1 day', '13:00:00', '15:05:00', 75000.00, 'OPEN'),
--(6, 2, CURRENT_DATE + INTERVAL '1 day', '19:00:00', '20:55:00', 50000.00, 'OPEN');

-- 10 TRANSAKSI AWAL
--INSERT INTO tbl_booking_transactions (transaction_code, user_id, schedule_id, total_amount, total_tickets, payment_deadline, payment_status, payment_date) VALUES
--('TRX-20260811-001', 5, 1, 150000.00, 2, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'PAID', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
--('TRX-20260811-002', 6, 1, 75000.00, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'PAID', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
--('TRX-20260811-003', 7, 2, 75000.00, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'PAID', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
--('TRX-20260811-004', 8, 3, 75000.00, 1, CURRENT_TIMESTAMP + INTERVAL '10 minutes', 'PENDING', NULL),
--('TRX-20260811-005', 9, 4, 50000.00, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'PAID', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
--('TRX-20260811-006', 10, 5, 50000.00, 1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'PAID', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
--('TRX-20260811-007', 5, 6, 100000.00, 1, CURRENT_TIMESTAMP - INTERVAL '3 hours', 'CANCELLED', NULL),
--('TRX-20260811-008', 6, 7, 100000.00, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'PAID', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
--('TRX-20260811-009', 7, 8, 45000.00, 1, CURRENT_TIMESTAMP - INTERVAL '20 minutes', 'EXPIRED', NULL),
--('TRX-20260811-010', 8, 9, 75000.00, 1, CURRENT_TIMESTAMP + INTERVAL '12 minutes', 'PENDING', NULL);

---- 10 LEMBAR TIKET
--INSERT INTO tbl_tickets (transaction_id, ticket_code, schedule_id, seat_id, seat_code, price, status) VALUES
--(1, 'TKT-SCH1-A1-001', 1, 1, 'A1', 75000.00, 'PAID'),
--(1, 'TKT-SCH1-A2-002', 1, 2, 'A2', 75000.00, 'PAID'),
--(2, 'TKT-SCH1-A3-003', 1, 3, 'A3', 75000.00, 'PAID'),
--(3, 'TKT-SCH2-A1-004', 2, 1, 'A1', 75000.00, 'PAID'),
--(4, 'TKT-SCH3-A1-005', 3, 1, 'A1', 75000.00, 'BOOKED'),
--(5, 'TKT-SCH4-A1-006', 4, 11, 'A1', 50000.00, 'PAID'),
--(6, 'TKT-SCH5-A1-007', 5, 11, 'A1', 50000.00, 'PAID'),
--(7, 'TKT-SCH6-A1-008', 6, 21, 'A1', 100000.00, 'CANCELLED'),
--(8, 'TKT-SCH7-A1-009', 7, 21, 'A1', 100000.00, 'PAID'),
--(9, 'TKT-SCH8-A1-010', 8, 31, 'A1', 45000.00, 'EXPIRED');

ALTER TABLE tbl_users DROP CONSTRAINT IF EXISTS fkonk4k79bledesvmes4de2obtg;

DROP TABLE IF EXISTS roles CASCADE;

DELETE FROM tbl_roles;
INSERT INTO tbl_roles (role_name, role_code, is_active) VALUES
('Administrator', 'ADMIN', TRUE),
('Staff Bioskop', 'STAFF', TRUE),
('Customer', 'CUSTOMER', TRUE);

ALTER TABLE tbl_users 
ADD CONSTRAINT fk_users_tbl_roles 
FOREIGN KEY (role_id) REFERENCES tbl_roles(role_id);

TRUNCATE TABLE tbl_user_profiles, tbl_users, tbl_roles RESTART IDENTITY CASCADE;

-- 2. Masukkan 3 Master Role resmi (otomatis dapat ID: 1, 2, 3)
INSERT INTO tbl_roles (role_name, role_code, is_active) VALUES
('Administrator', 'ADMIN', TRUE),      
('Staff Bioskop', 'STAFF', TRUE),      
('Customer', 'CUSTOMER', TRUE);       

-- 3. Verifikasi hasilnya
SELECT * FROM tbl_roles;