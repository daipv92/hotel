import { createClient } from "@/lib/supabase/client";
import type { RoomType } from "@/types/database";

const supabase = () => createClient();

export async function getRoomTypes() {
  const { data, error } = await supabase()
    .from("room_types")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as RoomType[];
}

export async function getRoomTypeById(id: string) {
  const { data, error } = await supabase()
    .from("room_types")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as RoomType;
}

export async function createRoomType(
  values: Pick<RoomType, "hotel_id" | "name" | "code" | "description" | "base_price" | "max_occupancy" | "amenities">
) {
  const { data, error } = await supabase()
    .from("room_types")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data as RoomType;
}

export async function updateRoomType(
  id: string,
  values: Partial<Pick<RoomType, "name" | "code" | "description" | "base_price" | "max_occupancy" | "amenities">>
) {
  const { data, error } = await supabase()
    .from("room_types")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RoomType;
}

export async function deleteRoomType(id: string) {
  const { error } = await supabase()
    .from("room_types")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
