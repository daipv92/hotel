"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import {
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
} from "@/lib/api/floors";
import type { Floor } from "@/types/database";

export default function FloorsPage() {
  const { profile } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Floor | null>(null);

  const [name, setName] = useState("");
  const [floorNumber, setFloorNumber] = useState("1");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getFloors();
      setFloors(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setFloorNumber(String((floors.at(-1)?.floor_number ?? 0) + 1));
    setDescription("");
    setModalOpen(true);
  }

  function openEdit(floor: Floor) {
    setEditing(floor);
    setName(floor.name);
    setFloorNumber(String(floor.floor_number));
    setDescription(floor.description || "");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const values = {
      name,
      floor_number: Number(floorNumber),
      description: description || null,
    };

    try {
      if (editing) {
        await updateFloor(editing.id, values);
      } else {
        await createFloor({ ...values, hotel_id: profile.hotel_id });
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
      await deleteFloor(confirmDelete.id);
      setConfirmDelete(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  const columns = [
    { key: "floor_number", label: "So tang" },
    { key: "name", label: "Ten tang" },
    {
      key: "description",
      label: "Mo ta",
      render: (f: Floor) => f.description || "—",
    },
    {
      key: "actions",
      label: "",
      render: (f: Floor) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(f)}>
            Sua
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDelete(f)}
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
        <h2 className="text-2xl font-bold text-slate-800">Quan ly Tang</h2>
        <Button onClick={openCreate}>Them tang</Button>
      </div>

      <Table columns={columns} data={floors} rowKey={(f) => f.id} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sua tang" : "Them tang"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="So tang"
            type="number"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
            min="1"
            required
          />
          <Input
            label="Ten tang"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Tang 1"
            required
          />
          <Input
            label="Mo ta"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mo ta tang"
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
          Ban co chac chan muon xoa{" "}
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
