"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import { useI18n } from "@/lib/i18n";
import type { PricingRule, RoomCategory } from "@/types/database";

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " đ";
}

export default function PricingPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();
  const { t } = useI18n();

  const PRICING_TYPES = [
    { value: "hourly", label: t("pricingTypeHourly") },
    { value: "overnight", label: t("pricingTypeOvernight") },
    { value: "daily", label: t("pricingTypeDaily") },
  ] as const;

  function pricingTypeLabel(type: string) {
    return PRICING_TYPES.find((r) => r.value === type)?.label ?? type;
  }

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    room_category_id: "",
    pricing_type: "hourly" as string,
    price: "",
    min_hours: "",
    max_hours: "",
    extra_hour_price: "",
    overnight_checkin_from: "",
    overnight_checkout_before: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    const [rulesRes, catsRes] = await Promise.all([
      supabase
        .from("pricing_rules")
        .select("*, room_categories(*)")
        .order("room_category_id"),
      supabase
        .from("room_categories")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order")
        .order("name"),
    ]);

    setRules(rulesRes.data ?? []);
    setCategories(catsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditingId(null);
    setForm({
      room_category_id: "",
      pricing_type: "hourly",
      price: "",
      min_hours: "",
      max_hours: "",
      extra_hour_price: "",
      overnight_checkin_from: "",
      overnight_checkout_before: "",
      description: "",
    });
    setShowModal(true);
  }

  function openEdit(rule: PricingRule) {
    setEditingId(rule.id);
    setForm({
      room_category_id: rule.room_category_id,
      pricing_type: rule.pricing_type,
      price: String(rule.price),
      min_hours: rule.min_hours != null ? String(rule.min_hours) : "",
      max_hours: rule.max_hours != null ? String(rule.max_hours) : "",
      extra_hour_price:
        rule.extra_hour_price != null ? String(rule.extra_hour_price) : "",
      overnight_checkin_from: rule.overnight_checkin_from ?? "",
      overnight_checkout_before: rule.overnight_checkout_before ?? "",
      description: rule.description ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      room_category_id: form.room_category_id,
      pricing_type: form.pricing_type,
      price: Number(form.price),
      min_hours: form.min_hours ? Number(form.min_hours) : null,
      max_hours: form.max_hours ? Number(form.max_hours) : null,
      extra_hour_price: form.extra_hour_price
        ? Number(form.extra_hour_price)
        : null,
      overnight_checkin_from: form.overnight_checkin_from || null,
      overnight_checkout_before: form.overnight_checkout_before || null,
      description: form.description.trim() || null,
    };

    if (editingId) {
      await supabase
        .from("pricing_rules")
        .update(payload)
        .eq("id", editingId);
    } else {
      await supabase.from("pricing_rules").insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("deletePricingConfirm"))) return;
    await supabase.from("pricing_rules").delete().eq("id", id);
    fetchAll();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">{t("loading")}</p>;
  }

  // Group rules by category
  const grouped = categories
    .map((cat) => ({
      category: cat,
      rules: rules.filter((r) => r.room_category_id === cat.id),
    }))
    .filter((g) => g.rules.length > 0);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          {t("pricingTitle")}
        </h2>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t("addPricingRule")}
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          {t("noPricingRulesYet")}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ category, rules: catRules }) => (
            <div
              key={category.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {category.name}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({t("basePriceInfo")} {formatPrice(category.base_price)})
                  </span>
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("thPricingType")}
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("thPrice")}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("thDetail")}
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {catRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {pricingTypeLabel(rule.pricing_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatPrice(rule.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {rule.pricing_type === "hourly" && (
                          <span>
                            {rule.min_hours}–{rule.max_hours} {t("hourLabel")}
                            {rule.extra_hour_price != null &&
                              `, ${t("surchargeLabel")} ${formatPrice(rule.extra_hour_price)}${t("perHour")}`}
                          </span>
                        )}
                        {rule.pricing_type === "overnight" &&
                          rule.overnight_checkin_from && (
                            <span>
                              {t("checkinFrom")} {rule.overnight_checkin_from} – {t("checkoutBefore")}{" "}
                              {rule.overnight_checkout_before}
                            </span>
                          )}
                        {rule.pricing_type === "daily" &&
                          rule.overnight_checkin_from && (
                            <span>
                              {t("checkinFrom")} {rule.overnight_checkin_from} – {t("checkoutBefore")}{" "}
                              {rule.overnight_checkout_before}
                            </span>
                          )}
                        {rule.description && (
                          <span className="block text-xs text-gray-400">
                            {rule.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(rule)}
                          className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? t("editPricingRule") : t("addPricingRule")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t("roomTypeLabel")}
                  </label>
                  <select
                    value={form.room_category_id}
                    onChange={(e) =>
                      setForm({ ...form, room_category_id: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{t("selectPlaceholder")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t("thPricingType")}
                  </label>
                  <select
                    value={form.pricing_type}
                    onChange={(e) =>
                      setForm({ ...form, pricing_type: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {PRICING_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("priceVNDLabel")}
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={t("pricePlaceholder")}
                />
              </div>

              {form.pricing_type === "hourly" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("minHoursLabel")}
                    </label>
                    <input
                      type="number"
                      value={form.min_hours}
                      onChange={(e) =>
                        setForm({ ...form, min_hours: e.target.value })
                      }
                      step="0.5"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("maxHoursLabel")}
                    </label>
                    <input
                      type="number"
                      value={form.max_hours}
                      onChange={(e) =>
                        setForm({ ...form, max_hours: e.target.value })
                      }
                      step="0.5"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("extraHourLabel")}
                    </label>
                    <input
                      type="number"
                      value={form.extra_hour_price}
                      onChange={(e) =>
                        setForm({ ...form, extra_hour_price: e.target.value })
                      }
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder={t("extraHourPlaceholder")}
                    />
                  </div>
                </div>
              )}

              {(form.pricing_type === "overnight" ||
                form.pricing_type === "daily") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("checkinFromLabel")}
                    </label>
                    <input
                      type="time"
                      value={form.overnight_checkin_from}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          overnight_checkin_from: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("checkoutBeforeLabel")}
                    </label>
                    <input
                      type="time"
                      value={form.overnight_checkout_before}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          overnight_checkout_before: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("descriptionOptional")}
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={t("descriptionPlaceholder")}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
