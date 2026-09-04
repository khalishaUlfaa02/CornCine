package corncine.example.ticket_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "booking_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingTransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;
    
    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", insertable = false, updatable = false)
    private ScheduleEntity schedule;
    
    @Column(name = "schedule_id")
    private UUID scheduleId;

    @Column(name = "order_id", unique = true)
    private String orderId;

    private Double totalPrice;
    private String paymentStatus;
    private String paymentUrl;
    
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BookingSeatEntity> bookingSeats;
}
