package corncine.example.ticket_service.repository;

import corncine.example.ticket_service.entity.BookingSeatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeatEntity, UUID> {
    List<BookingSeatEntity> findByTransactionId(UUID transactionId);

    @Query("SELECT bs.seatId FROM BookingSeatEntity bs " +
           "JOIN bs.transaction t " +
           "WHERE t.scheduleId = :scheduleId " +
           "AND t.paymentStatus IN ('PENDING', 'PAID')")
    List<UUID> findOccupiedSeatIdsBySchedule(@Param("scheduleId") UUID scheduleId);
}
