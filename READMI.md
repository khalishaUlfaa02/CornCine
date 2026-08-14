# 🎬 CornCine - Sistem Penjualan dan Manajemen Tiket Bioskop Berbasis Web

> **Projek Akhir Java Lanjutan (Program Sarjana S1)**  
> Platform pemesanan tiket bioskop online dan manajemen bioskop terdistribusi yang dibangun dengan arsitektur **Microservices (Spring Boot)**, autentikasi **Stateless JWT**, database **PostgreSQL**, dan antarmuka responsif **React.js**.

---

## 📋 Daftar Isi
- [🎬 CornCine - Sistem Penjualan dan Manajemen Tiket Bioskop Berbasis Web](#-corncine---sistem-penjualan-dan-manajemen-tiket-bioskop-berbasis-web)
  - [📋 Daftar Isi](#-daftar-isi)
  - [📖 Deskripsi Singkat](#-deskripsi-singkat)
  - [🚀 Fitur Utama](#-fitur-utama)
    - [🔐 1. Autentikasi \& Keamanan (Auth Service)](#-1-autentikasi--keamanan-auth-service)
    - [🎥 2. Katalog Film \& Bioskop (Cinema Service)](#-2-katalog-film--bioskop-cinema-service)
    - [🎟️ 3. Transaksi \& Booking Engine (Ticket Service)](#️-3-transaksi--booking-engine-ticket-service)
    - [🚪 4. Pintu Masuk Terpadu (Gateway Service)](#-4-pintu-masuk-terpadu-gateway-service)
  - [👥 Hak Akses \& Role (RBAC)](#-hak-akses--role-rbac)
  - [🛠️ Teknologi yang Digunakan](#️-teknologi-yang-digunakan)
  - [🗄️ Skema Database \& Relasi](#️-skema-database--relasi)

---

## 📖 Deskripsi Singkat
**CornCine** adalah platform bioskop modern yang menyediakan kemudahan pemesanan tiket film secara daring bagi penonton (*Customer*), pengelolaan operasional harian bagi petugas bioskop (*Staff*), dan kendali sistem penuh serta rekapitulasi data bagi manajer (*Administrator*). 

Sistem ini menerapkan prinsip keamanan **Stateless JWT**, proteksi **Anti Double Booking**, background task **Spring Scheduler**, notifikasi email **SMTP Gmail**, batch **Import/Export Excel (Apache POI)**, serta **API Gateway** sebagai pintu gerbang lalu lintas tunggal.

---

## 🚀 Fitur Utama

### 🔐 1. Autentikasi & Keamanan (Auth Service)
* **Register & Login:** Password dienkripsi dengan algoritma `BCryptPasswordEncoder`.
* **Stateless JWT:** Token Bearer dengan masa kedaluwarsa, membawa identitas `userId`, `username`, dan `role`.
* **Forgot & Reset Password:** Pengiriman token reset kata sandi ke email aktif penonton via JavaMail SMTP.
* **User Management & Soft Delete:** Pengelolaan status user (`ACTIVE`/`INACTIVE`) dan soft delete akun (`deleted = true`).

### 🎥 2. Katalog Film & Bioskop (Cinema Service)
* **Katalog Film Responsif:** Server-side search (*partial matching*), filter genre/rating usia, sorting (A-Z, Z-A, Terbaru, Terlama), dan pagination.
* **Upload Poster Fisik:** Pengunggahan file gambar poster film (`MultipartFile`) langsung ke server.
* **Import & Export Excel:** Batch upload data film menggunakan template Excel serta export katalog film (.xlsx) via Apache POI.
* **Master Bioskop, Studio, & Denah Kursi:** Manajemen kapasitas, tipe studio (Regular, IMAX, Premiere), dan generate kursi fisik otomatis.
* **Jadwal Tayang:** Pengaturan tanggal pemutaran, jam mulai/selesai, dan penentuan harga tiket.

### 🎟️ 3. Transaksi & Booking Engine (Ticket Service)
* **Seat Selection:** Visual denah kursi studio interaktif secara real-time.
* **Pencegahan Double Booking:** Kombinasi `@Transactional` dan *Partial Unique Index* di PostgreSQL untuk mengunci kursi agar tidak dapat dipesan ganda.
* **Pembatalan Tiket:** Aturan pembatalan mandiri minimal 1 jam sebelum jam penayangan dimulai.
* **Email Tiket Otomatis:** Dispatch struk konfirmasi tiket (HTML template) ke email penonton.
* **Automated Background Scheduler:** Auto-expire transaksi belum dibayar setelah 15 menit dan update tiket kedaluwarsa.
* **Export Laporan Penjualan:** Laporan transaksi berkala dalam format Excel dengan *freeze pane*, border, dan format mata uang Rupiah.

### 🚪 4. Pintu Masuk Terpadu (Gateway Service)
* **Centralized Routing & Path Rewriting:** Merutekan `/auth/**`, `/cinemas/**`, `/tickets/**` ke microservice terkait.
* **Rate Limiting Filter:** Membatasi frekuensi request client untuk mencegah serangan spam / brute-force (HTTP 429).
* **CORS Management:** Menangani kebijakan Cross-Origin Resource Sharing terpusat bagi frontend.

---

## 👥 Hak Akses & Role (RBAC)

| Fitur / Modul | CUSTOMER | STAFF | ADMIN |
| :--- | :---: | :---: | :---: |
| Register, Login, Forgot & Reset Password | ✅ | ✅ | ✅ |
| Eksplorasi Katalog Film, Detail & Filter | ✅ | ✅ | ✅ |
| Pemilihan Kursi & Booking Tiket Online | ✅ | ❌ | ❌ |
| Pembatalan Tiket Mandiri (> 1 Jam) | ✅ | ❌ | ❌ |
| Cetak Riwayat Transaksi & Tiket Saya | ✅ | ❌ | ❌ |
| Validasi / Check-in Tiket Penonton | ❌ | ✅ | ✅ |
| Kelola Jadwal Tayang & Film (CRUD) | ❌ | ✅ | ✅ |
| Import / Export Excel Data Film | ❌ | ✅ | ✅ |
| Kelola Master Bioskop & Studio | ❌ | ❌ | ✅ |
| Kelola Akun Pengguna & Soft Delete | ❌ | ❌ | ✅ |
| Export Laporan Transaksi Finansial | ❌ | ❌ | ✅ |

---

## 🛠️ Teknologi yang Digunakan

* **Frontend:** React.js, Vite, React Router DOM, Axios, Context API, CSS Modules / Responsive Layout.
* **Backend:** Java 17, Spring Boot 3.2.5, Spring Cloud Gateway, Spring Security, Spring Data JPA, OpenFeign, Lombok.
* **Database:** PostgreSQL (Single Database: `corncine_db`).
* **Libraries & Utilities:** 
  * JSON Web Token (`jjwt` 0.11.5)
  * Apache POI (`poi-ooxml` 5.2.5) untuk manipulasi Excel
  * Jakarta Mail / Spring Mail untuk SMTP Email Notification
  * Spring Scheduling (`@EnableScheduling`) untuk background cron jobs.

---

## 🗄️ Skema Database & Relasi

Sistem database menerapkan normalisasi hingga **3NF** dan mencakup seluruh jenis relasi wajib:
1. **One-to-One (1:1):** `tbl_users` (1) $\leftrightarrow$ `tbl_user_profiles` (1)
2. **One-to-Many (1:N):** `tbl_cinemas` (1) $\rightarrow$ `tbl_studios` (N)
3. **One-to-Many (1:N):** `tbl_studios` (1) $\rightarrow$ `tbl_seats` (N) & `tbl_schedules` (N)
4. **One-to-Many (1:N):** `tbl_booking_transactions` (1) $\rightarrow$ `tbl_tickets` (N)
5. **Many-to-Many (N:M):** `tbl_movies` (N) $\leftrightarrow$ `tbl_genres` (M) melalui `tbl_movie_genres`
6. **Many-to-Many (N:M):** `tbl_roles` (N) $\leftrightarrow$ `tbl_menu` (M) melalui `tbl_menu_access`
7. **Soft Delete:** Diterapkan pada `tbl_users`, `tbl_movies`, dan `tbl_cinemas`.

---
