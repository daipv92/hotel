import { createClient } from "@/lib/supabase/client";
import type { PricingRule } from "@/types/database";

const supabase = () => createClient();

export async function getPricingRules() {
  const { data, error } = await supabase()
    .from("pricing_rules")
    .select("*, room_type:room_types(*)")
    .order("room_type_id")
    .order("pricing_type");
  if (error) throw error;
  return data as PricingRule[];
}

export async function createPricingRule(
  values: Pick<PricingRule, "hotel_id" | "room_type_id" | "pricing_type" | "price" | "start_hour" | "end_hour" | "description">
) {
  const { data, error } = await supabase()
    .from("pricing_rules")
    .insert(values)
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return data as PricingRule;
}

export async function updatePricingRule(
  id: string,
  values: Partial<Pick<PricingRule, "room_type_id" | "pricing_type" | "price" | "start_hour" | "end_hour" | "description">>
) {
  const { data, error } = await supabase()
    .from("pricing_rules")
    .update(values)
    .eq("id", id)
    .select("*, room_type:room_types(*)")
    .single();
  if (error) throw error;
  return data as PricingRule;
}

export async function deletePricingRule(id: string) {
  const { error } = await supabase()
    .from("pricing_rules")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
