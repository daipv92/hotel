"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import type { Room, Floor, RoomCategory } from "@/types/database";

export default function RoomsPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    room_number: "",
    floor_id: "",
    room_category_id: "",
  });
  const [saving, setSaving] = useState(false);

  // Floor management
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [newFloorName, setNewFloorName] = useState("");
  const [addingFloor, setAddingFloor] = useState(false);

  async function fetchAll() {
    const [roomsRes, floorsRes, catsRes] = await Promise.all([
      supabase
        .from("rooms")
        .select("*, floors(*), room_categories(*)")
        .eq("hotel_id", hotelId)
        .order("sort_order")
        .order("room_number"),
      supabase
        .from("floors")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order")
        .order("floor_number"),
      supabase
        .from("room_categories")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order")
        .order("name"),
    ]);

    setRooms(roomsRes.data ?? []);
    setFloors(floorsRes.data ?? []);
    setCategories(catsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddFloor(e: React.FormEvent) {
    e.preventDefault();
    if (!newFloorNumber.trim()) return;
    setAddingFloor(true);
    const floorNum = Number(newFloorNumber);
    await supabase.from("floors").insert({
      floor_number: floorNum,
      name: newFloorName.trim() || `Tầng ${floorNum}`,
      hotel_id: hotelId,
      sort_order: floorNum,
    });
    setNewFloorNumber("");
    setNewFloorName("");
    setAddingFloor(false);
    fetchAll();
  }

  async function handleDeleteFloor(id: string) {
    if (!confirm("Xóa tầng này? Các phòng thuộc tầng sẽ bị ảnh hưởng."))
      return;
    await supabase.from("floors").delete().eq("id", id);
    fetchAll();
  }

  function openAdd() {
    setEditingId(null);
    setForm({ room_number: "", floor_id: "", room_category_id: "" });
    setShowModal(true);
  }

  function openEdit(room: Room) {
    setEditingId(room.id);
    setForm({
      room_number: room.room_number,
      floor_id: room.floor_id,
      room_category_id: room.room_category_id,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      room_number: form.room_number.trim(),
      floor_id: form.floor_id,
      room_category_id: form.room_category_id,
      hotel_id: hotelId,
    };

    if (editingId) {
      await supabase.from("rooms").update(payload).eq("id", editingId);
    } else {
      await supabase.from("rooms").insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa phòng này?")) return;
    await supabase.from("rooms").delete().eq("id", id);
    fetchAll();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải...</p>;
  }

  return (
    <>
      {/* Floor management */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Quản lý tầng
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <form onSubmit={handleAddFloor} className="mb-3 flex gap-2">
            <input
              type="number"
              value={newFloorNumber}
              onChange={(e) => setNewFloorNumber(e.target.value)}
              placeholder="Số tầng"
              min="0"
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              placeholder="Tên tầng (tùy chọn)"
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={addingFloor || !newFloorNumber.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm tầng
            </button>
          </form>
          {floors.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có tầng nào.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {floors.map((floor) => (
                <span
                  key={floor.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  {floor.name} (Tầng {floor.floor_number})
                  <button
                    onClick={() => handleDeleteFloor(floor.id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    title="Xóa tầng"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Room management */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Danh sách phòng
        </h2>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Thêm phòng
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Chưa có phòng nào. Hãy thêm tầng và loại phòng trước, sau đó thêm
          phòng.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Số phòng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tầng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Loại phòng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {room.room_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {room.floors?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {room.room_categories?.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        room.status === "available"
                          ? "bg-green-50 text-green-700"
                          : room.status === "occupied"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {room.status === "available"
                        ? "Trống"
                        : room.status === "occupied"
                          ? "Đang sử dụng"
                          : "Cần dọn"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(room)}
                      className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
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
              {editingId ? "Sửa phòng" : "Thêm phòng"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Số phòng
                </label>
                <input
                  type="text"
                  value={form.room_number}
                  onChange={(e) =>
                    setForm({ ...form, room_number: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="VD: 301"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tầng
                </label>
                <select
                  value={form.floor_id}
                  onChange={(e) =>
                    setForm({ ...form, floor_id: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Chọn tầng --</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Tầng {f.floor_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Loại phòng
                </label>
                <select
                  value={form.room_category_id}
                  onChange={(e) =>
                    setForm({ ...form, room_category_id: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Chọn loại phòng --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
