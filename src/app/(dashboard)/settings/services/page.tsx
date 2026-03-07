"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import type { Service, ServiceCategory } from "@/types/database";

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " đ";
}

export default function ServicesPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<
    ServiceCategory[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Service form
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    unit: "lần",
    category_id: "",
  });
  const [saving, setSaving] = useState(false);

  // Category management
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  async function fetchAll() {
    const [servicesRes, catsRes] = await Promise.all([
      supabase
        .from("services")
        .select("*, service_categories(*)")
        .eq("hotel_id", hotelId)
        .order("sort_order")
        .order("name"),
      supabase
        .from("service_categories")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order")
        .order("name"),
    ]);

    setServices(servicesRes.data ?? []);
    setServiceCategories(catsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Category CRUD
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    await supabase.from("service_categories").insert({
      name: newCategoryName.trim(),
      hotel_id: hotelId,
    });
    setNewCategoryName("");
    setAddingCategory(false);
    fetchAll();
  }

  async function handleDeleteCategory(id: string) {
    if (
      !confirm(
        "Xóa nhóm dịch vụ này? Các dịch vụ thuộc nhóm sẽ trở thành chưa phân loại.",
      )
    )
      return;
    await supabase.from("service_categories").delete().eq("id", id);
    fetchAll();
  }

  // Service CRUD
  function openAdd() {
    setEditingId(null);
    setForm({ name: "", price: "", unit: "lần", category_id: "" });
    setShowModal(true);
  }

  function openEdit(svc: Service) {
    setEditingId(svc.id);
    setForm({
      name: svc.name,
      price: String(svc.price),
      unit: svc.unit,
      category_id: svc.category_id ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      unit: form.unit.trim() || "lần",
      category_id: form.category_id || null,
      hotel_id: hotelId,
    };

    if (editingId) {
      await supabase.from("services").update(payload).eq("id", editingId);
    } else {
      await supabase.from("services").insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;
    await supabase.from("services").delete().eq("id", id);
    fetchAll();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải...</p>;
  }

  // Group services by category
  const grouped = serviceCategories
    .map((cat) => ({
      category: cat,
      services: services.filter((s) => s.category_id === cat.id),
    }))
    .filter((g) => g.services.length > 0);

  const uncategorized = services.filter((s) => !s.category_id);

  return (
    <>
      {/* Category management */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Nhóm dịch vụ
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <form onSubmit={handleAddCategory} className="mb-3 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Tên nhóm (VD: Đồ ăn, Đồ uống...)"
              className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={addingCategory || !newCategoryName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm nhóm
            </button>
          </form>
          {serviceCategories.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có nhóm dịch vụ nào.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  {cat.name}
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    title="Xóa nhóm"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Danh sách dịch vụ
        </h2>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Thêm dịch vụ
        </button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Chưa có dịch vụ nào. Bấm &quot;Thêm dịch vụ&quot; để bắt đầu.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ category, services: catServices }) => (
            <div
              key={category.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {category.name}
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tên dịch vụ
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Giá
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Đơn vị
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {catServices.map((svc) => (
                    <tr key={svc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {svc.name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {formatPrice(svc.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {svc.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(svc)}
                          className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
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
          ))}

          {uncategorized.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-500">
                  Chưa phân loại
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tên dịch vụ
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Giá
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Đơn vị
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uncategorized.map((svc) => (
                    <tr key={svc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {svc.name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {formatPrice(svc.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {svc.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(svc)}
                          className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
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
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Sửa dịch vụ" : "Thêm dịch vụ"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tên dịch vụ
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="VD: Nước suối, Giặt ủi..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Giá (VND)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Đơn vị
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) =>
                      setForm({ ...form, unit: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="VD: chai, lon, phần, kg..."
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nhóm dịch vụ
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Không phân loại --</option>
                  {serviceCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
