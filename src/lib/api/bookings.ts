import { createClient } from "@/lib/supabase/client";
import type { Booking, BookingService } from "@/types/database";

const supabase = () => createClient();

const BOOKING_SELECT = "*, guest:guests(*), room:rooms(*, room_type:room_types(*))";

export async function getBookings() {
  const { data, error } = await supabase()
    .from("bookings")
    .select(BOOKING_SELECT)
    .order("check_in_date", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function getBookingsByDateRange(from: string, to: string) {
  const { data, error } = await supabase()
    .from("bookings")
    .select(BOOKING_SELECT)
    .or(`check_in_date.lte.${to},check_out_date.gte.${from}`)
    .not("status", "eq", "cancelled")
    .order("check_in_date");
  if (error) throw error;
  return data as Booking[];
}

export async function getBookingsByRoom(roomId: string) {
  const { data, error } = await supabase()
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("room_id", roomId)
    .order("check_in_date", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function getActiveBookingByRoom(roomId: string) {
  const { data, error } = await supabase()
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("room_id", roomId)
    .eq("status", "checked_in")
    .maybeSingle();
  if (error) throw error;
  return data as Booking | null;
}

export async function getUpcomingBookingByRoom(roomId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase()
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("room_id", roomId)
    .eq("status", "confirmed")
    .gte("check_in_date", today)
    .order("check_in_date")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Booking | null;
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase()
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function createBooking(
  values: Pick<
    Booking,
    "hotel_id" | "guest_id" | "room_id" | "check_in_date" | "check_out_date" | "num_guests" | "total_amount" | "notes" | "created_by"
  >
) {
  const { data, error } = await supabase()
    .from("bookings")
    .insert({ ...values, booking_code: "" })
    .select(BOOKING_SELECT)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function updateBooking(
  id: string,
  values: Partial<
    Pick<Booking, "guest_id" | "room_id" | "check_in_date" | "check_out_date" | "num_guests" | "total_amount" | "paid_amount" | "notes" | "status">
  >
) {
  const { data, error } = await supabase()
    .from("bookings")
    .update(values)
    .eq("id", id)
    .select(BOOKING_SELECT)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function checkIn(id: string) {
  const { data, error } = await supabase()
    .from("bookings")
    .update({
      status: "checked_in",
      actual_check_in: new Date().toISOString(),
    })
    .eq("id", id)
    .select(BOOKING_SELECT)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function checkOut(id: string, paidAmount?: number) {
  const updates: Record<string, unknown> = {
    status: "checked_out",
    actual_check_out: new Date().toISOString(),
  };
  if (paidAmount !== undefined) {
    updates.paid_amount = paidAmount;
  }
  const { data, error } = await supabase()
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select(BOOKING_SELECT)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function cancelBooking(id: string) {
  const { data, error } = await supabase()
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select(BOOKING_SELECT)
    .single();
  if (error) throw error;
  return data as Booking;
}

// Booking services
export async function getBookingServices(bookingId: string) {
  const { data, error } = await supabase()
    .from("booking_services")
    .select("*")
    .eq("booking_id", bookingId)
    .order("added_at");
  if (error) throw error;
  return data as BookingService[];
}

export async function addBookingService(
  values: Pick<BookingService, "booking_id" | "service_name" | "quantity" | "unit_price" | "total_price">
) {
  const { data, error } = await supabase()
    .from("booking_services")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data as BookingService;
}

export async function deleteBookingService(id: string) {
  const { error } = await supabase()
    .from("booking_services")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
