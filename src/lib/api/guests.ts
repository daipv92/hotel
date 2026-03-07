import { createClient } from "@/lib/supabase/client";
import type { Guest } from "@/types/database";

const supabase = () => createClient();

export async function getGuests() {
  const { data, error } = await supabase()
    .from("guests")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return data as Guest[];
}

export async function searchGuests(query: string) {
  const { data, error } = await supabase()
    .from("guests")
    .select("*")
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,id_number.ilike.%${query}%`)
    .limit(10);
  if (error) throw error;
  return data as Guest[];
}

export async function getGuestById(id: string) {
  const { data, error } = await supabase()
    .from("guests")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Guest;
}

export async function createGuest(
  values: Pick<Guest, "hotel_id" | "full_name" | "id_number" | "phone" | "email" | "address" | "nationality">
) {
  const { data, error } = await supabase()
    .from("guests")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data as Guest;
}

export async function updateGuest(
  id: string,
  values: Partial<Pick<Guest, "full_name" | "id_number" | "phone" | "email" | "address" | "nationality">>
) {
  const { data, error } = await supabase()
    .from("guests")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Guest;
}
