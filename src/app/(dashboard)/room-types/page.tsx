"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import {
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "@/lib/api/room-types";
import type { RoomType } from "@/types/database";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function RoomTypesPage() {
  const { profile } = useAuth();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoomType | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [maxOccupancy, setMaxOccupancy] = useState("2");
  const [amenities, setAmenities] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getRoomTypes();
      setRoomTypes(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setCode("");
    setDescription("");
    setBasePrice("");
    setMaxOccupancy("2");
    setAmenities("");
    setModalOpen(true);
  }

  function openEdit(rt: RoomType) {
    setEditing(rt);
    setName(rt.name);
    setCode(rt.code);
    setDescription(rt.description || "");
    setBasePrice(String(rt.base_price));
    setMaxOccupancy(String(rt.max_occupancy));
    setAmenities((rt.amenities || []).join(", "));
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const values = {
      name,
      code,
      description: description || null,
      base_price: Number(basePrice),
      max_occupancy: Number(maxOccupancy),
      amenities: amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editing) {
        await updateRoomType(editing.id, values);
      } else {
        await createRoomType({ ...values, hotel_id: profile.hotel_id });
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
      await deleteRoomType(confirmDelete.id);
      setConfirmDelete(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  const columns = [
    { key: "name", label: "Ten" },
    { key: "code", label: "Ma" },
    {
      key: "base_price",
      label: "Gia co ban",
      render: (rt: RoomType) => formatPrice(rt.base_price),
    },
    {
      key: "max_occupancy",
      label: "Suc chua",
      render: (rt: RoomType) => `${rt.max_occupancy} nguoi`,
    },
    {
      key: "amenities",
      label: "Tien nghi",
      render: (rt: RoomType) => (rt.amenities || []).join(", ") || "—",
    },
    {
      key: "actions",
      label: "",
      render: (rt: RoomType) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(rt)}>
            Sua
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDelete(rt)}
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
        <h2 className="text-2xl font-bold text-slate-800">Loai phong</h2>
        <Button onClick={openCreate}>Them loai phong</Button>
      </div>

      <Table columns={columns} data={roomTypes} rowKey={(rt) => rt.id} />

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sua loai phong" : "Them loai phong"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ten loai phong"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Phong Deluxe"
            required
          />
          <Input
            label="Ma"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VD: DLX"
            required
          />
          <Input
            label="Mo ta"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mo ta loai phong"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gia co ban (VND)"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="500000"
              required
            />
            <Input
              label="Suc chua"
              type="number"
              value={maxOccupancy}
              onChange={(e) => setMaxOccupancy(e.target.value)}
              min="1"
              required
            />
          </div>
          <Input
            label="Tien nghi (cach boi dau phay)"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
            placeholder="WiFi, TV, Dieu hoa"
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

      {/* Confirm Delete Modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xac nhan xoa"
      >
        <p className="text-slate-600">
          Ban co chac chan muon xoa loai phong{" "}
          <strong>{confirmDelete?.name}</strong>? Hanh dong nay khong the hoan
          tac.
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
