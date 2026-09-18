package corncine.example.ticket_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "booking_seats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSeatEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private BookingTransactionEntity transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", insertable = false, updatable = false)
    private SeatEntity seat;
    
    @Column(name = "seat_id")
    private UUID seatId;

    // Referensi kursi dari cinema_service (ID integer / kode seperti "C4").
    // Alasan sama seperti scheduleRef: kolom UUID tidak bisa menyimpan "1".
    @Column(name = "seat_ref")
    private String seatRef;
    
    private Double price;
}
