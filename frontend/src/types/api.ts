/**
 * Tipos para erros da API
 */

export interface ApiError {
  error: string;
  statusCode?: number;
  message?: string;
}

export interface ApiErrorResponse {
  response?: {
    data?: ApiError;
    status?: number;
    statusText?: string;
  };
  message?: string;
}

/**
 * Tipos para entidades principais
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'OVERDUE' | 'OVERDUE_PAYMENT' | 'BLOCKED';
  phone?: string;
  isActive: boolean;
  createdAt: string;
  vessels?: UserVessel[];
}

export interface Vessel {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  location?: string;
  imageUrl?: string;
  isActive: boolean;
  calendarDaysAhead?: number;
  bookingLimit?: {
    maxActiveBookings: number;
  };
}

export interface UserVessel {
  id: string;
  userId: string;
  vesselId: string;
  status: string;
  vessel?: Vessel;
}

export interface Booking {
  id: string;
  userId: string;
  vesselId: string;
  bookingDate: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  vessel?: {
    id: string;
    name: string;
    description?: string;
    location?: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  isRead?: boolean;
  readAt?: string;
}

/**
 * Tipos para requests comuns
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  name: string;
  role?: 'ADMIN' | 'USER';
  phone?: string;
  vesselIds?: string[];
}

export interface CreateBookingRequest {
  vesselId: string;
  bookingDate: string;
  notes?: string;
}

export interface CreateVesselRequest {
  name: string;
  description?: string;
  capacity?: number;
  location?: string;
  imageUrl?: string;
  maxActiveBookings?: number;
  calendarDaysAhead?: number;
}






