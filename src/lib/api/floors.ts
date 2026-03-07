import { createClient } from "@/lib/supabase/client";
import type { Floor } from "@/types/database";

const supabase = () => createClient();

export async function getFloors() {
  const { data, error } = await supabase()
    .from("floors")
    .select("*")
    .order("floor_number");
  if (error) throw error;
  return data as Floor[];
}

export async function createFloor(
  values: Pick<Floor, "hotel_id" | "name" | "floor_number" | "description">
) {
  const { data, error } = await supabase()
    .from("floors")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data as Floor;
}

export async function updateFloor(
  id: string,
  values: Partial<Pick<Floor, "name" | "floor_number" | "description">>
) {
  const { data, error } = await supabase()
    .from("floors")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Floor;
}

export async function deleteFloor(id: string) {
  const { error } = await supabase()
    .from("floors")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
