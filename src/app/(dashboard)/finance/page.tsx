"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import type { Transaction, ExpenseCategory } from "@/types/database";

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " d";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TabType = "income" | "expense";

function getDefaultDateRange() {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

export default function FinancePage() {
  const [tab, setTab] = useState<TabType>("income");

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Quan ly thu chi
        </h2>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("income")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "income"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Thu (Doanh thu)
        </button>
        <button
          onClick={() => setTab("expense")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "expense"
              ? "bg-red-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Chi (Chi phi)
        </button>
      </div>

      {tab === "income" ? <IncomeSection /> : <ExpenseSection />}
    </>
  );
}

// ─── Income Section ───
function IncomeSection() {
  const { hotelId } = useHotel();
  const supabase = createClient();
  const defaultRange = getDefaultDateRange();

  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [bookings, setBookings] = useState<
    {
      id: string;
      guest_name: string;
      room_charge: number;
      service_total: number;
      discount: number;
      total_amount: number;
      check_out_at: string;
      rooms?: { room_number: string };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("bookings")
      .select("id, guest_name, room_charge, service_total, discount, total_amount, check_out_at, rooms(room_number)")
      .eq("hotel_id", hotelId)
      .eq("status", "checked_out")
      .gte("check_out_at", fromDate.toISOString())
      .lte("check_out_at", toDate.toISOString())
      .order("check_out_at", { ascending: false });

    setBookings(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((b: any) => ({
        ...b,
        rooms: Array.isArray(b.rooms) ? b.rooms[0] : b.rooms,
      })),
    );
    setLoading(false);
  }, [hotelId, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const totalRoom = bookings.reduce((s, b) => s + b.room_charge, 0);
  const totalService = bookings.reduce((s, b) => s + b.service_total, 0);
  const totalDiscount = bookings.reduce((s, b) => s + b.discount, 0);
  const totalIncome = bookings.reduce((s, b) => s + b.total_amount, 0);

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Tu ngay
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Den ngay
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Tien phong</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatPrice(totalRoom)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Dich vu</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatPrice(totalService)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Giam gia</p>
          <p className="mt-1 text-lg font-semibold text-red-600">
            {totalDiscount > 0 ? "-" : ""}
            {formatPrice(totalDiscount)}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-600">Tong doanh thu</p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {formatPrice(totalIncome)}
          </p>
        </div>
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-500">Dang tai...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Khong co doanh thu trong khoang thoi gian nay.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Khach
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Phong
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Tra phong
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Tien phong
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Dich vu
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Tong
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {b.guest_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.rooms?.room_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.check_out_at ? formatDateTime(b.check_out_at) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPrice(b.room_charge)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {b.service_total > 0 ? formatPrice(b.service_total) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(b.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-gray-100">
            {bookings.map((b) => (
              <div key={b.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {b.guest_name}
                  </span>
                  <span className="text-sm font-semibold text-green-700">
                    {formatPrice(b.total_amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  {b.rooms?.room_number && (
                    <span>P.{b.rooms.room_number}</span>
                  )}
                  <span>
                    {b.check_out_at ? formatDate(b.check_out_at) : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Expense Section ───
function ExpenseSection() {
  const { hotelId } = useHotel();
  const supabase = createClient();
  const defaultRange = getDefaultDateRange();

  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [txnRes, catRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, expense_categories(*)")
        .eq("hotel_id", hotelId)
        .eq("type", "expense")
        .gte("transaction_date", dateFrom)
        .lte("transaction_date", dateTo)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("expense_categories")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order"),
    ]);

    setTransactions(txnRes.data ?? []);
    setCategories(catRes.data ?? []);
    setLoading(false);
  }, [hotelId, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalExpense = transactions.reduce((s, t) => s + t.amount, 0);

  // Group by category
  const byCategory = new Map<string, { name: string; total: number }>();
  for (const txn of transactions) {
    const catName = txn.expense_categories?.name ?? "Khac";
    const existing = byCategory.get(catName);
    if (existing) {
      existing.total += txn.amount;
    } else {
      byCategory.set(catName, { name: catName, total: txn.amount });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoa khoan chi nay?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    fetchData();
  }

  return (
    <div className="space-y-4">
      {/* Date filter + Add button */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Tu ngay
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Den ngay
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          + Them chi phi
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from(byCategory.values()).map((cat) => (
          <div
            key={cat.name}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs text-gray-500">{cat.name}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatPrice(cat.total)}
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-600">Tong chi</p>
          <p className="mt-1 text-lg font-bold text-red-700">
            {formatPrice(totalExpense)}
          </p>
        </div>
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-500">Dang tai...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Khong co chi phi trong khoang thoi gian nay.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Ngay
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Loai
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Mo ta
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    So tien
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">
                    Xoa
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {txn.expense_categories?.name ?? "Khac"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {txn.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      {formatPrice(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(txn.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Xoa"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-gray-100">
            {transactions.map((txn) => (
              <div key={txn.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {txn.expense_categories?.name ?? "Khac"}
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    {formatPrice(txn.amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {txn.description || "-"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(txn.transaction_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          hotelId={hotelId}
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ─── Add Expense Modal ───
function AddExpenseModal({
  hotelId,
  categories,
  onClose,
  onSuccess,
}: {
  hotelId: string;
  categories: ExpenseCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    expense_category_id: categories[0]?.id ?? "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.expense_category_id || !form.amount) return;
    setSaving(true);

    const { error } = await supabase.from("transactions").insert({
      hotel_id: hotelId,
      type: "expense" as const,
      expense_category_id: form.expense_category_id,
      amount: Number(form.amount),
      description: form.description.trim() || "Chi phi",
      transaction_date: form.transaction_date,
    });

    if (!error) {
      onSuccess();
    } else {
      alert("Loi: " + error.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Them chi phi
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Loai chi phi *
            </label>
            <select
              value={form.expense_category_id}
              onChange={(e) =>
                setForm({ ...form, expense_category_id: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Chon loai --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              So tien (d) *
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              min="1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="VD: 500000"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ngay chi
            </label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={(e) =>
                setForm({ ...form, transaction_date: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mo ta
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="VD: Mua thuc pham sang nay"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Dang luu..." : "Luu chi phi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
