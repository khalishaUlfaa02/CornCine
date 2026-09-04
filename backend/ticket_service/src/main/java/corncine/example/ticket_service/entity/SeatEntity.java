package corncine.example.ticket_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "seats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String seatRow;
    private Integer seatNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studio_id", insertable = false, updatable = false)
    private StudioEntity studio;
    
    @Column(name = "studio_id")
    private UUID studioId;
}
