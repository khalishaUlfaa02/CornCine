package corncine.example.ticket_service.repository;

import corncine.example.ticket_service.entity.BookingTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingTransactionRepository extends JpaRepository<BookingTransactionEntity, UUID> {
    Optional<BookingTransactionEntity> findByOrderId(String orderId);
    List<BookingTransactionEntity> findByUserId(UUID userId);
}
