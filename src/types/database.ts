export type Floor = {
  id: string;
  hotel_id: string;
  name: string;
  floor_number: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type RoomCategory = {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  base_price: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  hotel_id: string;
  floor_id: string;
  room_category_id: string;
  room_number: string;
  status: "available" | "occupied" | "dirty";
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  floors?: Floor;
  room_categories?: RoomCategory;
};

export type PricingRule = {
  id: string;
  room_category_id: string;
  pricing_type: "hourly" | "overnight" | "daily";
  price: number;
  min_hours: number | null;
  max_hours: number | null;
  extra_hour_price: number | null;
  overnight_checkin_from: string | null;
  overnight_checkout_before: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  room_categories?: RoomCategory;
};

export type ServiceCategory = {
  id: string;
  hotel_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Service = {
  id: string;
  hotel_id: string;
  category_id: string | null;
  name: string;
  price: number;
  unit: string;
  is_active: boolean;
  usage_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  service_categories?: ServiceCategory;
};

export type Booking = {
  id: string;
  hotel_id: string;
  room_id: string;
  guest_id: string | null;
  pricing_type: "hourly" | "overnight" | "daily" | null;
  status: "reserved" | "checked_in" | "checked_out" | "cancelled";
  check_in_at: string;
  check_out_at: string | null;
  expected_check_out_at: string | null;
  guest_name: string;
  guest_id_number: string | null;
  guest_count: number;
  room_charge: number;
  service_total: number;
  discount: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  checked_out_by: string | null;
  created_at: string;
  updated_at: string;
  rooms?: Room;
};

export type BookingService = {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_by: string | null;
  created_at: string;
};

export type ExpenseCategory = {
  id: string;
  hotel_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  hotel_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  booking_id: string | null;
  expense_category_id: string | null;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expense_categories?: ExpenseCategory;
};

export type RoomOccupancy = {
  hotel_id: string;
  room_id: string;
  room_number: string;
  status: "available" | "occupied" | "dirty";
  floor_name: string;
  floor_number: number;
  category_name: string;
  current_booking_id: string | null;
  current_guest: string | null;
  check_in_at: string | null;
  future_booking_id: string | null;
  future_guest: string | null;
  future_check_in: string | null;
};
