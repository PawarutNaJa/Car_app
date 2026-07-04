import { Vehicle, Booking, NotificationItem, UserRole, UserProfile } from './types';

// In dev, Vite proxies /api to the backend (see vite.config.ts).
// In prod, set VITE_API_URL to your deployed API base URL.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, keep default message
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Auth ----
export const login = (email: string, password: string) =>
  request<UserProfile>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (data: { name: string; email: string; phone: string; role: UserRole; password: string }) =>
  request<UserProfile>('/auth/register', { method: 'POST', body: JSON.stringify(data) });

// ---- Vehicles ----
export const getVehicles = () => request<Vehicle[]>('/vehicles');

export const createVehicle = (v: Omit<Vehicle, 'id'>) =>
  request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(v) });

export const updateVehicle = (id: string, v: Omit<Vehicle, 'id'>) =>
  request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(v) });

export const deleteVehicle = (id: string) =>
  request<void>(`/vehicles/${id}`, { method: 'DELETE' });

// ---- Bookings ----
export const getBookings = () => request<Booking[]>('/bookings');

export const createBooking = (b: Omit<Booking, 'id' | 'status' | 'createdAt'>) =>
  request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(b) });

export const updateBookingStatus = (id: string, status: 'approved' | 'rejected' | 'cancelled', notes?: string) =>
  request<Booking>(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) });

// ---- Notifications ----
export const getNotifications = () => request<NotificationItem[]>('/notifications');

export const markAllNotificationsRead = (userId: string) =>
  request<void>('/notifications/mark-all-read', { method: 'PUT', body: JSON.stringify({ userId }) });

export const clearAllNotifications = (userId: string) =>
  request<void>(`/notifications?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
