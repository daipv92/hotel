"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import { useI18n } from "@/lib/i18n";
import type { Room, Floor, RoomCategory } from "@/types/database";

export default function RoomsPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();
  const { t } = useI18n();

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
      name: newFloorName.trim() || `${t("floorLabel")} ${floorNum}`,
      hotel_id: hotelId,
      sort_order: floorNum,
    });
    setNewFloorNumber("");
    setNewFloorName("");
    setAddingFloor(false);
    fetchAll();
  }

  async function handleDeleteFloor(id: string) {
    if (!confirm(t("deleteFloorConfirm")))
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
    if (!confirm(t("deleteRoomConfirm"))) return;
    await supabase.from("rooms").delete().eq("id", id);
    fetchAll();
  }

  if (loading) {
    return <p className="text-sm text-gray-500">{t("loading")}</p>;
  }

  return (
    <>
      {/* Floor management */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          {t("floorManagement")}
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <form onSubmit={handleAddFloor} className="mb-3 flex gap-2">
            <input
              type="number"
              value={newFloorNumber}
              onChange={(e) => setNewFloorNumber(e.target.value)}
              placeholder={t("floorNumberPlaceholder")}
              min="0"
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              placeholder={t("floorNamePlaceholder")}
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={addingFloor || !newFloorNumber.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {t("addFloor")}
            </button>
          </form>
          {floors.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noFloorsYet")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {floors.map((floor) => (
                <span
                  key={floor.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  {floor.name} ({t("floorLabel")} {floor.floor_number})
                  <button
                    onClick={() => handleDeleteFloor(floor.id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    title={t("deleteFloor")}
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
          {t("roomList")}
        </h2>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t("addRoom")}
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          {t("noRoomsYet")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("thRoomNumber")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("thFloor")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("thRoomType")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("thStatus")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("actions")}
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
                        ? t("roomStatusAvailable")
                        : room.status === "occupied"
                          ? t("roomStatusOccupied")
                          : t("roomStatusDirty")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(room)}
                      className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
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
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? t("editRoom") : t("addRoom")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("roomNumberLabel")}
                </label>
                <input
                  type="text"
                  value={form.room_number}
                  onChange={(e) =>
                    setForm({ ...form, room_number: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={t("roomNumberPlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("floorLabel")}
                </label>
                <select
                  value={form.floor_id}
                  onChange={(e) =>
                    setForm({ ...form, floor_id: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{t("selectFloorPlaceholder")}</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({t("floorLabel")} {f.floor_number})
                    </option>
                  ))}
                </select>
              </div>
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
                  <option value="">{t("selectRoomTypePlaceholder")}</option>
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
