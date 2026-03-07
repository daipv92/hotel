"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/lib/auth-context";
import {
  getRooms,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from "@/lib/api/rooms";
import { getRoomTypes } from "@/lib/api/room-types";
import type { Room, RoomType, RoomStatus } from "@/types/database";

const statusConfig: Record<
  RoomStatus,
  { label: string; variant: "success" | "danger" | "default"; bg: string }
> = {
  ready: { label: "San sang", variant: "success", bg: "bg-green-100 border-green-300" },
  occupied: { label: "Dang o", variant: "danger", bg: "bg-red-100 border-red-300" },
  dirty: { label: "Phong ban", variant: "default", bg: "bg-slate-100 border-slate-300" },
};

const statusOptions: { value: RoomStatus; label: string }[] = [
  { value: "ready", label: "San sang" },
  { value: "occupied", label: "Dang o" },
  { value: "dirty", label: "Phong ban" },
];

type ViewMode = "grid" | "table";

export default function RoomsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Room | null>(null);
  const [statusModal, setStatusModal] = useState<Room | null>(null);

  // Form state
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("1");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [roomsData, typesData] = await Promise.all([
        getRooms(),
        getRoomTypes(),
      ]);
      setRooms(roomsData);
      setRoomTypes(typesData);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setRoomNumber("");
    setFloor("1");
    setRoomTypeId(roomTypes[0]?.id || "");
    setNotes("");
    setModalOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setRoomNumber(room.room_number);
    setFloor(String(room.floor));
    setRoomTypeId(room.room_type_id);
    setNotes(room.notes || "");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    try {
      if (editing) {
        await updateRoom(editing.id, {
          room_number: roomNumber,
          floor: Number(floor),
          room_type_id: roomTypeId,
          notes: notes || null,
        });
      } else {
        await createRoom({
          hotel_id: profile.hotel_id,
          room_number: roomNumber,
          floor: Number(floor),
          room_type_id: roomTypeId,
          notes: notes || null,
        });
      }
      setModalOpen(false);
      await loadData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(room: Room, newStatus: RoomStatus) {
    try {
      await updateRoomStatus(room.id, newStatus);
      setStatusModal(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteRoom(confirmDelete.id);
      setConfirmDelete(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  // Group rooms by floor for grid view
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  const columns = [
    { key: "room_number", label: "So phong" },
    { key: "floor", label: "Tang" },
    {
      key: "room_type",
      label: "Loai phong",
      render: (r: Room) => r.room_type?.name || "—",
    },
    {
      key: "status",
      label: "Trang thai",
      render: (r: Room) => (
        <Badge variant={statusConfig[r.status].variant}>
          {statusConfig[r.status].label}
        </Badge>
      ),
    },
    { key: "notes", label: "Ghi chu", render: (r: Room) => r.notes || "—" },
    {
      key: "actions",
      label: "",
      render: (r: Room) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setStatusModal(r)}>
            Doi TT
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
            Sua
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDelete(r)}
          >
            Xoa
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Quan ly Phong</h2>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm ${
                viewMode === "grid"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50"
              } rounded-l-lg`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm ${
                viewMode === "table"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50"
              } rounded-r-lg`}
            >
              Table
            </button>
          </div>
          <Button onClick={openCreate}>Them phong</Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="space-y-6">
          {floors.length === 0 && (
            <p className="py-12 text-center text-slate-400">
              Chua co phong nao. Bam &quot;Them phong&quot; de bat dau.
            </p>
          )}
          {floors.map((f) => (
            <div key={f}>
              <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase">
                Tang {f}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {rooms
                  .filter((r) => r.floor === f)
                  .map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setStatusModal(room)}
                      className={`rounded-xl border-2 p-4 text-left transition-shadow hover:shadow-md ${statusConfig[room.status].bg}`}
                    >
                      <p className="text-lg font-bold text-slate-800">
                        {room.room_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {room.room_type?.name}
                      </p>
                      <Badge variant={statusConfig[room.status].variant}>
                        {statusConfig[room.status].label}
                      </Badge>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table columns={columns} data={rooms} rowKey={(r) => r.id} />
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sua phong" : "Them phong"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="So phong"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="VD: 101"
            required
          />
          <Input
            label="Tang"
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            min="1"
            required
          />
          <Select
            label="Loai phong"
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
            options={roomTypes.map((rt) => ({
              value: rt.id,
              label: `${rt.name} (${rt.code})`,
            }))}
            placeholder="Chon loai phong"
            required
          />
          <Input
            label="Ghi chu"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chu ve phong"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Dang luu..." : editing ? "Cap nhat" : "Them moi"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Status Change Modal */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={`Phong ${statusModal?.room_number} — Doi trang thai`}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Trang thai hien tai:{" "}
            <Badge variant={statusConfig[statusModal?.status || "ready"].variant}>
              {statusConfig[statusModal?.status || "ready"].label}
            </Badge>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {statusOptions
              .filter((s) => s.value !== statusModal?.status)
              .map((s) => (
                <button
                  key={s.value}
                  onClick={() =>
                    statusModal && handleStatusChange(statusModal, s.value)
                  }
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors hover:shadow-sm ${statusConfig[s.value].bg}`}
                >
                  {s.label}
                </button>
              ))}
          </div>
          <div className="flex justify-between pt-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (statusModal) {
                    setStatusModal(null);
                    openEdit(statusModal);
                  }
                }}
              >
                Sua phong
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  if (statusModal) {
                    setStatusModal(null);
                    setConfirmDelete(statusModal);
                  }
                }}
              >
                Xoa phong
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStatusModal(null)}
            >
              Dong
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xac nhan xoa"
      >
        <p className="text-slate-600">
          Ban co chac chan muon xoa phong{" "}
          <strong>{confirmDelete?.room_number}</strong>? Hanh dong nay khong the
          hoan tac.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Huy
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Xoa
          </Button>
        </div>
      </Modal>
    </div>
  );
}
