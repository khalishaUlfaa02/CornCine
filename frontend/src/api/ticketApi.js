import axiosClient from './axiosClient';
import { getStoredToken } from './movieApi';

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
  // Backend menerima String agar ID integer cinema ("1") maupun UUID lama sama-sama lolos parse JSON
  const response = await axiosClient.post('/tickets/bookings', {
    scheduleId: String(scheduleId),
    seatIds: (seatIds || []).map((id) => String(id)),
  }, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const createPaymentInvoice = async (bookingData) => {
  const response = await axiosClient.post('/api/payments/create-invoice', bookingData, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const simulatePayment = async (bookingCode, paymentMethod) => {
  const response = await axiosClient.post('/tickets/payments/simulate', {
    bookingCode,
    paymentMethod,
  }, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const cancelBooking = async (bookingCode) => {
  const response = await axiosClient.post(`/tickets/bookings/${bookingCode}/cancel`, {}, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const syncPaymentStatus = async (bookingCode) => {
  const response = await axiosClient.get(`/api/payments/sync-status/${bookingCode}`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const getMyBookings = async () => {
  const response = await axiosClient.get('/tickets/my-bookings', {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const downloadTicketPdf = async (bookingCode) => {
  const response = await axiosClient.get(`/tickets/${bookingCode}/pdf`, {
    responseType: 'blob', // Penting untuk download file
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const validateTicket = async (bookingCode) => {
  const response = await axiosClient.post('/tickets/validate', { bookingCode }, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};
