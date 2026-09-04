package corncine.example.ticket_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", insertable = false, updatable = false)
    private MovieEntity movie;
    
    @Column(name = "movie_id")
    private UUID movieId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studio_id", insertable = false, updatable = false)
    private StudioEntity studio;
    
    @Column(name = "studio_id")
    private UUID studioId;
    
    private LocalDateTime showTime;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double price;
}
