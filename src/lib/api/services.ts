import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types/database";

const supabase = () => createClient();

export async function getServices() {
  const { data, error } = await supabase()
    .from("services")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw error;
  return data as Service[];
}

export async function createService(
  values: Pick<Service, "hotel_id" | "name" | "price" | "category">
) {
  const { data, error } = await supabase()
    .from("services")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

export async function updateService(
  id: string,
  values: Partial<Pick<Service, "name" | "price" | "category">>
) {
  const { data, error } = await supabase()
    .from("services")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

export async function deleteService(id: string) {
  const { error } = await supabase()
    .from("services")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
