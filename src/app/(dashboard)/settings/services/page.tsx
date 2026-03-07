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
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/api/services";
import type { Service, ServiceCategory } from "@/types/database";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

const categoryOptions: { value: ServiceCategory; label: string }[] = [
  { value: "food", label: "Do an" },
  { value: "drink", label: "Do uong" },
  { value: "clean", label: "Ve sinh" },
  { value: "other", label: "Khac" },
];

const categoryLabels: Record<ServiceCategory, { label: string; variant: "success" | "danger" | "default" }> = {
  food: { label: "Do an", variant: "success" },
  drink: { label: "Do uong", variant: "default" },
  clean: { label: "Ve sinh", variant: "danger" },
  other: { label: "Khac", variant: "default" },
};

export default function ServicesPage() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("food");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getServices();
      setServices(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setPrice("");
    setCategory("food");
    setModalOpen(true);
  }

  function openEdit(svc: Service) {
    setEditing(svc);
    setName(svc.name);
    setPrice(String(svc.price));
    setCategory(svc.category);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const values = {
      name,
      price: Number(price),
      category,
    };

    try {
      if (editing) {
        await updateService(editing.id, values);
      } else {
        await createService({ ...values, hotel_id: profile.hotel_id });
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
      await deleteService(confirmDelete.id);
      setConfirmDelete(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  const columns = [
    { key: "name", label: "Ten dich vu" },
    {
      key: "category",
      label: "Danh muc",
      render: (s: Service) => (
        <Badge variant={categoryLabels[s.category].variant}>
          {categoryLabels[s.category].label}
        </Badge>
      ),
    },
    {
      key: "price",
      label: "Gia",
      render: (s: Service) => formatPrice(s.price),
    },
    {
      key: "actions",
      label: "",
      render: (s: Service) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
            Sua
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDelete(s)}
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
        <h2 className="text-2xl font-bold text-slate-800">Dich vu</h2>
        <Button onClick={openCreate}>Them dich vu</Button>
      </div>

      <Table columns={columns} data={services} rowKey={(s) => s.id} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sua dich vu" : "Them dich vu"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ten dich vu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Nuoc suoi"
            required
          />
          <Select
            label="Danh muc"
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            options={categoryOptions}
            required
          />
          <Input
            label="Gia (VND)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="10000"
            required
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
          Ban co chac chan muon xoa dich vu{" "}
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
