import { createClient } from "@/lib/supabase/client";
import type { Room, RoomStatus } from "@/types/database";

const supabase = () => createClient();

export async function getRooms() {
  const { data, error } = await supabase()
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .order("floor")
    .order("room_number");
  if (error) throw error;
  return data as Room[];
}

export async function getRoomsByFloor(floor: number) {
  const { data, error } = await supabase()
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .eq("floor", floor)
    .order("room_number");
  if (error) throw error;
  return data as Room[];
}

export async function getRoomById(id: string) {
  const { data, error } = await supabase()
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Room;
}

export async function createRoom(
  values: Pick<Room, "hotel_id" | "room_number" | "floor" | "room_type_id" | "notes">
) {
  const { data, error } = await supabase()
    .from("rooms")
    .insert(values)
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function updateRoom(
  id: string,
  values: Partial<Pick<Room, "room_number" | "floor" | "room_type_id" | "notes">>
) {
  const { data, error } = await supabase()
    .from("rooms")
    .update(values)
    .eq("id", id)
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function updateRoomStatus(id: string, status: RoomStatus) {
  const { data, error } = await supabase()
    .from("rooms")
    .update({ status })
    .eq("id", id)
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(id: string) {
  const { error } = await supabase()
    .from("rooms")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
