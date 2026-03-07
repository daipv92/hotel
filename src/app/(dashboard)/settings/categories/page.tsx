"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import {
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "@/lib/api/room-types";
import {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "@/lib/api/pricing-rules";
import type { RoomType, PricingRule, PricingType } from "@/types/database";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

const pricingTypeOptions: { value: PricingType; label: string }[] = [
  { value: "hourly", label: "Theo gio" },
  { value: "daily", label: "Theo ngay" },
];

const pricingTypeLabels: Record<PricingType, string> = {
  hourly: "Theo gio",
  daily: "Theo ngay",
};

export default function CategoriesPage() {
  const { profile } = useAuth();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<RoomType | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<RoomType | null>(null);
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catBasePrice, setCatBasePrice] = useState("");
  const [catMaxOccupancy, setCatMaxOccupancy] = useState("2");
  const [catAmenities, setCatAmenities] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  // Pricing modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PricingRule | null>(null);
  const [confirmDeletePrice, setConfirmDeletePrice] = useState<PricingRule | null>(null);
  const [priceRoomTypeId, setPriceRoomTypeId] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("hourly");
  const [priceAmount, setPriceAmount] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [priceDescription, setPriceDescription] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [typesData, rulesData] = await Promise.all([
        getRoomTypes(),
        getPricingRules(),
      ]);
      setRoomTypes(typesData);
      setPricingRules(rulesData);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  // Category CRUD
  function openCreateCat() {
    setEditingCat(null);
    setCatName("");
    setCatCode("");
    setCatDescription("");
    setCatBasePrice("");
    setCatMaxOccupancy("2");
    setCatAmenities("");
    setCatModalOpen(true);
  }

  function openEditCat(rt: RoomType) {
    setEditingCat(rt);
    setCatName(rt.name);
    setCatCode(rt.code);
    setCatDescription(rt.description || "");
    setCatBasePrice(String(rt.base_price));
    setCatMaxOccupancy(String(rt.max_occupancy));
    setCatAmenities((rt.amenities || []).join(", "));
    setCatModalOpen(true);
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setCatSaving(true);

    const values = {
      name: catName,
      code: catCode,
      description: catDescription || null,
      base_price: Number(catBasePrice),
      max_occupancy: Number(catMaxOccupancy),
      amenities: catAmenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingCat) {
        await updateRoomType(editingCat.id, values);
      } else {
        await createRoomType({ ...values, hotel_id: profile.hotel_id });
      }
      setCatModalOpen(false);
      await loadData();
    } catch {
      // handle error
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCat() {
    if (!confirmDeleteCat) return;
    try {
      await deleteRoomType(confirmDeleteCat.id);
      setConfirmDeleteCat(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  // Pricing CRUD
  function openCreatePrice() {
    setEditingPrice(null);
    setPriceRoomTypeId(roomTypes[0]?.id || "");
    setPricingType("hourly");
    setPriceAmount("");
    setStartHour("");
    setEndHour("");
    setPriceDescription("");
    setPriceModalOpen(true);
  }

  function openEditPrice(rule: PricingRule) {
    setEditingPrice(rule);
    setPriceRoomTypeId(rule.room_type_id);
    setPricingType(rule.pricing_type);
    setPriceAmount(String(rule.price));
    setStartHour(rule.start_hour != null ? String(rule.start_hour) : "");
    setEndHour(rule.end_hour != null ? String(rule.end_hour) : "");
    setPriceDescription(rule.description || "");
    setPriceModalOpen(true);
  }

  async function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setPriceSaving(true);

    const values = {
      room_type_id: priceRoomTypeId,
      pricing_type: pricingType,
      price: Number(priceAmount),
      start_hour: startHour ? Number(startHour) : null,
      end_hour: endHour ? Number(endHour) : null,
      description: priceDescription || null,
    };

    try {
      if (editingPrice) {
        await updatePricingRule(editingPrice.id, values);
      } else {
        await createPricingRule({ ...values, hotel_id: profile.hotel_id });
      }
      setPriceModalOpen(false);
      await loadData();
    } catch {
      // handle error
    } finally {
      setPriceSaving(false);
    }
  }

  async function handleDeletePrice() {
    if (!confirmDeletePrice) return;
    try {
      await deletePricingRule(confirmDeletePrice.id);
      setConfirmDeletePrice(null);
      await loadData();
    } catch {
      // handle error
    }
  }

  const catColumns = [
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
          <Button size="sm" variant="ghost" onClick={() => openEditCat(rt)}>
            Sua
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDeleteCat(rt)}
          >
            Xoa
          </Button>
        </div>
      ),
    },
  ];

  const priceColumns = [
    {
      key: "room_type",
      label: "Loai phong",
      render: (r: PricingRule) => r.room_type?.name || "—",
    },
    {
      key: "pricing_type",
      label: "Loai gia",
      render: (r: PricingRule) => (
        <Badge variant={r.pricing_type === "hourly" ? "default" : "success"}>
          {pricingTypeLabels[r.pricing_type]}
        </Badge>
      ),
    },
    {
      key: "price",
      label: "Gia",
      render: (r: PricingRule) => formatPrice(r.price),
    },
    {
      key: "time_range",
      label: "Khung gio",
      render: (r: PricingRule) =>
        r.start_hour != null && r.end_hour != null
          ? `${r.start_hour}:00 — ${r.end_hour}:00`
          : "—",
    },
    {
      key: "description",
      label: "Mo ta",
      render: (r: PricingRule) => r.description || "—",
    },
    {
      key: "actions",
      label: "",
      render: (r: PricingRule) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEditPrice(r)}>
            Sua
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDeletePrice(r)}
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
    <div className="space-y-10">
      {/* Room Categories Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Loai phong</h2>
          <Button onClick={openCreateCat}>Them loai phong</Button>
        </div>
        <Table columns={catColumns} data={roomTypes} rowKey={(rt) => rt.id} />
      </div>

      {/* Pricing Rules Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Bang gia</h2>
          <Button onClick={openCreatePrice}>Them bang gia</Button>
        </div>
        <Table columns={priceColumns} data={pricingRules} rowKey={(r) => r.id} />
      </div>

      {/* Category Create/Edit Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? "Sua loai phong" : "Them loai phong"}
      >
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <Input
            label="Ten loai phong"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="VD: Phong Deluxe"
            required
          />
          <Input
            label="Ma"
            value={catCode}
            onChange={(e) => setCatCode(e.target.value)}
            placeholder="VD: DLX"
            required
          />
          <Input
            label="Mo ta"
            value={catDescription}
            onChange={(e) => setCatDescription(e.target.value)}
            placeholder="Mo ta loai phong"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gia co ban (VND)"
              type="number"
              value={catBasePrice}
              onChange={(e) => setCatBasePrice(e.target.value)}
              placeholder="500000"
              required
            />
            <Input
              label="Suc chua"
              type="number"
              value={catMaxOccupancy}
              onChange={(e) => setCatMaxOccupancy(e.target.value)}
              min="1"
              required
            />
          </div>
          <Input
            label="Tien nghi (cach boi dau phay)"
            value={catAmenities}
            onChange={(e) => setCatAmenities(e.target.value)}
            placeholder="WiFi, TV, Dieu hoa"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCatModalOpen(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={catSaving}>
              {catSaving ? "Dang luu..." : editingCat ? "Cap nhat" : "Them moi"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Delete Confirm */}
      <Modal
        open={!!confirmDeleteCat}
        onClose={() => setConfirmDeleteCat(null)}
        title="Xac nhan xoa"
      >
        <p className="text-slate-600">
          Ban co chac chan muon xoa loai phong{" "}
          <strong>{confirmDeleteCat?.name}</strong>? Hanh dong nay khong the hoan
          tac.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDeleteCat(null)}>
            Huy
          </Button>
          <Button variant="danger" onClick={handleDeleteCat}>
            Xoa
          </Button>
        </div>
      </Modal>

      {/* Pricing Create/Edit Modal */}
      <Modal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        title={editingPrice ? "Sua bang gia" : "Them bang gia"}
      >
        <form onSubmit={handlePriceSubmit} className="space-y-4">
          <Select
            label="Loai phong"
            value={priceRoomTypeId}
            onChange={(e) => setPriceRoomTypeId(e.target.value)}
            options={roomTypes.map((rt) => ({
              value: rt.id,
              label: `${rt.name} (${rt.code})`,
            }))}
            placeholder="Chon loai phong"
            required
          />
          <Select
            label="Loai gia"
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as PricingType)}
            options={pricingTypeOptions}
            required
          />
          <Input
            label="Gia (VND)"
            type="number"
            value={priceAmount}
            onChange={(e) => setPriceAmount(e.target.value)}
            placeholder="80000"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gio bat dau (0-23)"
              type="number"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              min="0"
              max="23"
              placeholder="VD: 14"
            />
            <Input
              label="Gio ket thuc (0-23)"
              type="number"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              min="0"
              max="23"
              placeholder="VD: 12"
            />
          </div>
          <Input
            label="Mo ta"
            value={priceDescription}
            onChange={(e) => setPriceDescription(e.target.value)}
            placeholder="VD: Gia qua dem 22h-12h"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPriceModalOpen(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={priceSaving}>
              {priceSaving ? "Dang luu..." : editingPrice ? "Cap nhat" : "Them moi"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pricing Delete Confirm */}
      <Modal
        open={!!confirmDeletePrice}
        onClose={() => setConfirmDeletePrice(null)}
        title="Xac nhan xoa"
      >
        <p className="text-slate-600">
          Ban co chac chan muon xoa bang gia nay? Hanh dong nay khong the hoan
          tac.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDeletePrice(null)}>
            Huy
          </Button>
          <Button variant="danger" onClick={handleDeletePrice}>
            Xoa
          </Button>
        </div>
      </Modal>
    </div>
  );
}
