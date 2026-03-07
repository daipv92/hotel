export type UserRole = "admin" | "receptionist";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hotel_id: string;
  created_at: string;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}

export type RoomStatus = "ready" | "occupied" | "dirty";

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  code: string;
  description: string | null;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  images: string[];
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_number: string;
  floor: number;
  room_type_id: string;
  status: RoomStatus;
  notes: string | null;
  created_at: string;
  // joined
  room_type?: RoomType;
}

export interface RoomStatusLog {
  id: string;
  room_id: string;
  old_status: RoomStatus | null;
  new_status: RoomStatus;
  changed_by: string | null;
  changed_at: string;
}

export type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export interface Guest {
  id: string;
  hotel_id: string;
  full_name: string;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  hotel_id: string;
  booking_code: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  num_guests: number;
  status: BookingStatus;
  total_amount: number;
  paid_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // joined
  guest?: Guest;
  room?: Room;
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
}

export interface Floor {
  id: string;
  hotel_id: string;
  name: string;
  floor_number: number;
  description: string | null;
  created_at: string;
}

export type PricingType = "hourly" | "daily";

export interface PricingRule {
  id: string;
  hotel_id: string;
  room_type_id: string;
  pricing_type: PricingType;
  price: number;
  start_hour: number | null;
  end_hour: number | null;
  description: string | null;
  created_at: string;
  // joined
  room_type?: RoomType;
}

export type ServiceCategory = "food" | "drink" | "clean" | "other";

export interface Service {
  id: string;
  hotel_id: string;
  name: string;
  price: number;
  category: ServiceCategory;
  created_at: string;
}
