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
  deleteRoom,
} from "@/lib/api/rooms";
import { getRoomTypes } from "@/lib/api/room-types";
import { getFloors } from "@/lib/api/floors";
import type { Room, RoomType, RoomStatus, Floor } from "@/types/database";

const statusConfig: Record<
  RoomStatus,
  { label: string; variant: "success" | "danger" | "default" }
> = {
  ready: { label: "San sang", variant: "success" },
  occupied: { label: "Dang o", variant: "danger" },
  dirty: { label: "Phong ban", variant: "default" },
};

export default function SettingsRoomsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Room | null>(null);

  const [roomNumber, setRoomNumber] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [roomsData, typesData, floorsData] = await Promise.all([
        getRooms(),
        getRoomTypes(),
        getFloors(),
      ]);
      setRooms(roomsData);
      setRoomTypes(typesData);
      setFloors(floorsData);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setRoomNumber("");
    setFloorId("");
    setRoomTypeId(roomTypes[0]?.id || "");
    setNotes("");
    setModalOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setRoomNumber(room.room_number);
    const matchFloor = floors.find((f) => f.floor_number === room.floor);
    setFloorId(matchFloor?.id || "");
    setRoomTypeId(room.room_type_id);
    setNotes(room.notes || "");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const selectedFloor = floors.find((f) => f.id === floorId);
    const floorNumber = selectedFloor?.floor_number ?? 1;

    try {
      if (editing) {
        await updateRoom(editing.id, {
          room_number: roomNumber,
          floor: floorNumber,
          room_type_id: roomTypeId,
          notes: notes || null,
        });
      } else {
        await createRoom({
          hotel_id: profile.hotel_id,
          room_number: roomNumber,
          floor: floorNumber,
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
        <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Cau hinh Phong</h2>
        <Button onClick={openCreate}>Them phong</Button>
      </div>

      <Table columns={columns} data={rooms} rowKey={(r) => r.id} />

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
          <Select
            label="Tang"
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            options={floors.map((f) => ({
              value: f.id,
              label: `${f.name} (Tang ${f.floor_number})`,
            }))}
            placeholder="Chon tang"
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
