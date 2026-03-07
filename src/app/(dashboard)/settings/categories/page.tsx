"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import type { RoomCategory } from "@/types/database";

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " đ";
}

export default function CategoriesPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();

  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", base_price: "" });
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    const { data } = await supabase
      .from("room_categories")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("name");
    setCategories(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", base_price: "" });
    setShowModal(true);
  }

  function openEdit(cat: RoomCategory) {
    setEditingId(cat.id);
    setForm({ name: cat.name, base_price: String(cat.base_price) });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      base_price: Number(form.base_price),
      hotel_id: hotelId,
    };

    if (editingId) {
      await supabase
        .from("room_categories")
        .update(payload)
        .eq("id", editingId);
    } else {
      await supabase.from("room_categories").insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa loại phòng này?")) return;
    await supabase.from("room_categories").delete().eq("id", id);
    fetchCategories();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải...</p>;
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Loại phòng</h2>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Thêm loại phòng
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Chưa có loại phòng nào. Bấm &quot;Thêm loại phòng&quot; để bắt đầu.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tên loại phòng
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Giá cơ bản
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {formatPrice(cat.base_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(cat)}
                      className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Sửa loại phòng" : "Thêm loại phòng"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tên loại phòng
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="VD: Standard, VIP, Deluxe..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Giá cơ bản (VND)
                </label>
                <input
                  type="number"
                  value={form.base_price}
                  onChange={(e) =>
                    setForm({ ...form, base_price: e.target.value })
                  }
                  required
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="200000"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
