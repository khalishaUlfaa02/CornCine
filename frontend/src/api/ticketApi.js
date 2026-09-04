import axiosClient from './axiosClient';

export const getOccupiedSeats = async (scheduleId) => {
  const response = await axiosClient.get(`/tickets/schedules/${scheduleId}/occupied-seats`);
  return response.data;
};

// Mengambil info jadwal (dari cinema-service)
export const getScheduleDetail = async (scheduleId) => {
  const response = await axiosClient.get(`/schedules/${scheduleId}`);
  return response.data;
};

// Mengambil layout kursi (dari cinema-service)
export const getStudioSeats = async (studioId) => {
  const response = await axiosClient.get(`/seats/studio/${studioId}`);
  return response.data;
};

export const createBooking = async (scheduleId, seatIds) => {
  const response = await axiosClient.post('/tickets/bookings', {
    scheduleId,
    seatIds,
  });
  return response.data;
};

export const simulatePayment = async (bookingCode, paymentMethod) => {
  const response = await axiosClient.post('/tickets/payments/simulate', {
    bookingCode,
    paymentMethod,
  });
  return response.data;
};

export const cancelBooking = async (bookingCode) => {
  const response = await axiosClient.post(`/tickets/bookings/${bookingCode}/cancel`);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await axiosClient.get('/tickets/my-bookings');
  return response.data;
};

export const downloadTicketPdf = async (bookingCode) => {
  const response = await axiosClient.get(`/tickets/${bookingCode}/pdf`, {
    responseType: 'blob', // Penting untuk download file
  });
  return response.data;
};
