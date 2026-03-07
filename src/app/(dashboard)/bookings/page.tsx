"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/lib/auth-context";
import { getRooms, updateRoomStatus } from "@/lib/api/rooms";
import { getRoomTypes } from "@/lib/api/room-types";
import {
  getBookingsByDateRange,
  getActiveBookingByRoom,
  getUpcomingBookingByRoom,
  createBooking,
  checkIn,
  checkOut,
  getBookingServices,
  addBookingService,
  deleteBookingService,
  updateBooking,
} from "@/lib/api/bookings";
import { searchGuests, createGuest } from "@/lib/api/guests";
import type {
  Room,
  RoomType,
  RoomStatus,
  Booking,
  BookingService,
  Guest,
} from "@/types/database";

// ---- Status config ----
const statusColors: Record<RoomStatus, string> = {
  ready: "bg-green-100 border-green-400 hover:bg-green-200",
  occupied: "bg-red-100 border-red-400 hover:bg-red-200",
  dirty: "bg-slate-200 border-slate-400 hover:bg-slate-300",
};

const statusBadge: Record<RoomStatus, { label: string; variant: "success" | "danger" | "default" }> = {
  ready: { label: "San sang", variant: "success" },
  occupied: { label: "Dang o", variant: "danger" },
  dirty: { label: "Phong ban", variant: "default" },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN");
}

// ---- Room Card ----
function RoomCard({
  room,
  upcomingNote,
  onClick,
}: {
  room: Room;
  upcomingNote: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${statusColors[room.status]}`}
    >
      {upcomingNote && (
        <div className="absolute -top-2 left-2 right-2 rounded bg-amber-400 px-2 py-0.5 text-center text-[10px] font-semibold text-amber-900 shadow-sm">
          {upcomingNote}
        </div>
      )}
      <p className="text-lg font-bold text-slate-800">{room.room_number}</p>
      <p className="text-xs text-slate-500">{room.room_type?.name}</p>
      <div className="mt-1">
        <Badge variant={statusBadge[room.status].variant}>
          {statusBadge[room.status].label}
        </Badge>
      </div>
    </button>
  );
}

// ---- Main page ----
export default function BookingBoardPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [upcomingNotes, setUpcomingNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Action modal
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Check-in modal
  const [checkInModal, setCheckInModal] = useState(false);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestResults, setGuestResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [newGuestMode, setNewGuestMode] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestIdNumber, setNewGuestIdNumber] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numGuests, setNumGuests] = useState("1");

  // Checkout modal
  const [checkOutModal, setCheckOutModal] = useState(false);

  // Service modal
  const [serviceModal, setServiceModal] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [svcName, setSvcName] = useState("");
  const [svcQty, setSvcQty] = useState("1");
  const [svcPrice, setSvcPrice] = useState("");

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);

  // Transfer modal
  const [transferModal, setTransferModal] = useState(false);
  const [transferRoomId, setTransferRoomId] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [roomsData, typesData] = await Promise.all([
        getRooms(),
        getRoomTypes(),
      ]);
      setRooms(roomsData);
      setRoomTypes(typesData);

      // Load upcoming booking notes for ready rooms
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const bookings = await getBookingsByDateRange(today, tomorrow);
      const notes: Record<string, string> = {};
      for (const b of bookings) {
        if (b.status === "confirmed" && b.check_in_date === today) {
          notes[b.room_id] = `Dat truoc ${b.notes || "18:00"}`;
        }
      }
      setUpcomingNotes(notes);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Click room card ----
  async function handleRoomClick(room: Room) {
    setSelectedRoom(room);
    if (room.status === "occupied") {
      const booking = await getActiveBookingByRoom(room.id);
      setActiveBooking(booking);
    } else {
      setActiveBooking(null);
    }
  }

  // ---- Quick check-in ----
  function openCheckIn() {
    setCheckInModal(true);
    setSelectedGuest(null);
    setNewGuestMode(false);
    setGuestSearch("");
    setGuestResults([]);
    setNewGuestName("");
    setNewGuestPhone("");
    setNewGuestIdNumber("");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setCheckOutDate(tomorrow);
    setNumGuests("1");
  }

  async function handleGuestSearch(q: string) {
    setGuestSearch(q);
    if (q.length < 2) {
      setGuestResults([]);
      return;
    }
    const results = await searchGuests(q);
    setGuestResults(results);
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedRoom) return;
    setLoadingAction(true);

    try {
      let guestId = selectedGuest?.id;

      // Create new guest if needed
      if (newGuestMode && !guestId) {
        const guest = await createGuest({
          hotel_id: profile.hotel_id,
          full_name: newGuestName,
          phone: newGuestPhone || null,
          id_number: newGuestIdNumber || null,
          email: null,
          address: null,
          nationality: "Viet Nam",
        });
        guestId = guest.id;
      }

      if (!guestId) return;

      const today = new Date().toISOString().split("T")[0];
      const nights = Math.max(
        1,
        Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(today).getTime()) / 86400000
        )
      );
      const totalAmount = (selectedRoom.room_type?.base_price || 0) * nights;

      // Create booking + check in
      const booking = await createBooking({
        hotel_id: profile.hotel_id,
        guest_id: guestId,
        room_id: selectedRoom.id,
        check_in_date: today,
        check_out_date: checkOutDate,
        num_guests: Number(numGuests),
        total_amount: totalAmount,
        notes: null,
        created_by: profile.id,
      });

      await checkIn(booking.id);
      await updateRoomStatus(selectedRoom.id, "occupied");

      setCheckInModal(false);
      setSelectedRoom(null);
      await loadData();
    } catch {
      // handle error
    } finally {
      setLoadingAction(false);
    }
  }

  // ---- Checkout ----
  async function handleCheckOut() {
    if (!activeBooking || !selectedRoom) return;
    setLoadingAction(true);
    try {
      await checkOut(activeBooking.id, activeBooking.total_amount);
      await updateRoomStatus(selectedRoom.id, "dirty");
      setCheckOutModal(false);
      setSelectedRoom(null);
      await loadData();
    } catch {
      // handle error
    } finally {
      setLoadingAction(false);
    }
  }

  // ---- Mark dirty ----
  async function handleMarkDirty() {
    if (!selectedRoom) return;
    await updateRoomStatus(selectedRoom.id, "dirty");
    setSelectedRoom(null);
    await loadData();
  }

  // ---- Services ----
  async function openServices() {
    if (!activeBooking) return;
    setServiceModal(true);
    setSvcName("");
    setSvcQty("1");
    setSvcPrice("");
    const svcs = await getBookingServices(activeBooking.id);
    setServices(svcs);
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBooking) return;
    const qty = Number(svcQty);
    const price = Number(svcPrice);
    await addBookingService({
      booking_id: activeBooking.id,
      service_name: svcName,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
    });
    // Update booking total
    const svcs = await getBookingServices(activeBooking.id);
    setServices(svcs);
    const svcTotal = svcs.reduce((sum, s) => sum + s.total_price, 0);
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(activeBooking.check_out_date).getTime() -
          new Date(activeBooking.check_in_date).getTime()) /
          86400000
      )
    );
    const roomPrice = (activeBooking.room?.room_type?.base_price || 0) * nights;
    await updateBooking(activeBooking.id, { total_amount: roomPrice + svcTotal });
    setSvcName("");
    setSvcQty("1");
    setSvcPrice("");
  }

  async function handleDeleteService(id: string) {
    await deleteBookingService(id);
    if (activeBooking) {
      const svcs = await getBookingServices(activeBooking.id);
      setServices(svcs);
    }
  }

  // ---- Transfer room ----
  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBooking || !selectedRoom) return;
    setLoadingAction(true);
    try {
      await updateBooking(activeBooking.id, { room_id: transferRoomId });
      await updateRoomStatus(selectedRoom.id, "dirty");
      await updateRoomStatus(transferRoomId, "occupied");
      setTransferModal(false);
      setSelectedRoom(null);
      await loadData();
    } catch {
      // handle error
    } finally {
      setLoadingAction(false);
    }
  }

  // ---- Group rooms: Floor → RoomType ----
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  function getRoomsByFloorAndType(floor: number) {
    const floorRooms = rooms.filter((r) => r.floor === floor);
    const typeIds = [...new Set(floorRooms.map((r) => r.room_type_id))];
    return typeIds.map((tid) => {
      const type = roomTypes.find((rt) => rt.id === tid);
      return {
        type,
        rooms: floorRooms.filter((r) => r.room_type_id === tid),
      };
    });
  }

  const availableRoomsForTransfer = rooms.filter(
    (r) => r.status === "ready" && r.id !== selectedRoom?.id
  );

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
        <h2 className="text-2xl font-bold text-slate-800">So do phong</h2>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
            San sang
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
            Dang o
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-slate-400" />
            Phong ban
          </span>
        </div>
      </div>

      {/* Board grouped Floor → Category */}
      <div className="space-y-8">
        {floors.map((floor) => (
          <div key={floor}>
            <h3 className="mb-4 text-base font-bold text-slate-700 border-b border-slate-200 pb-2">
              Tang {floor}
            </h3>
            <div className="space-y-4 pl-2">
              {getRoomsByFloorAndType(floor).map(({ type, rooms: typeRooms }) => (
                <div key={type?.id || "unknown"}>
                  <h4 className="mb-2 text-sm font-semibold text-slate-500">
                    {type?.name || "Khong phan loai"}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                    {typeRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        upcomingNote={upcomingNotes[room.id] || null}
                        onClick={() => handleRoomClick(room)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ========== Room Action Modal ========== */}
      <Modal
        open={!!selectedRoom && !checkInModal && !checkOutModal && !serviceModal && !detailModal && !transferModal}
        onClose={() => setSelectedRoom(null)}
        title={`Phong ${selectedRoom?.room_number || ""}`}
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={statusBadge[selectedRoom.status].variant}>
                {statusBadge[selectedRoom.status].label}
              </Badge>
              <span className="text-sm text-slate-500">
                {selectedRoom.room_type?.name} — {formatPrice(selectedRoom.room_type?.base_price || 0)}/dem
              </span>
            </div>

            {/* Actions based on status */}
            {selectedRoom.status === "ready" && (
              <div className="space-y-2">
                <Button className="w-full justify-start" onClick={openCheckIn}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Nhan phong nhanh
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={handleMarkDirty}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Danh dau phong ban
                </Button>
              </div>
            )}

            {selectedRoom.status === "occupied" && activeBooking && (
              <div className="space-y-2">
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p><strong>Khach:</strong> {activeBooking.guest?.full_name}</p>
                  <p><strong>Check-in:</strong> {formatDate(activeBooking.check_in_date)}</p>
                  <p><strong>Check-out:</strong> {formatDate(activeBooking.check_out_date)}</p>
                  <p><strong>Tong tien:</strong> {formatPrice(activeBooking.total_amount)}</p>
                </div>
                <Button className="w-full justify-start" variant="secondary" onClick={() => setDetailModal(true)}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xem chi tiet
                </Button>
                <Button className="w-full justify-start" variant="danger" onClick={() => setCheckOutModal(true)}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Tra phong
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={openServices}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Them dich vu
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => { setTransferModal(true); setTransferRoomId(""); }}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Chuyen phong
                </Button>
              </div>
            )}

            {selectedRoom.status === "dirty" && (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Phong can duoc don dep truoc khi nhan khach.</p>
                <Button
                  className="w-full"
                  onClick={async () => {
                    await updateRoomStatus(selectedRoom.id, "ready");
                    setSelectedRoom(null);
                    await loadData();
                  }}
                >
                  Danh dau san sang
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========== Quick Check-in Modal ========== */}
      <Modal
        open={checkInModal}
        onClose={() => setCheckInModal(false)}
        title={`Nhan phong nhanh — ${selectedRoom?.room_number}`}
      >
        <form onSubmit={handleCheckIn} className="space-y-4">
          {/* Guest search or create */}
          {!newGuestMode ? (
            <div className="space-y-2">
              <Input
                label="Tim khach hang (ten, SDT, CMND)"
                value={guestSearch}
                onChange={(e) => handleGuestSearch(e.target.value)}
                placeholder="Nhap de tim..."
              />
              {guestResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200">
                  {guestResults.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGuest(g);
                        setGuestSearch(g.full_name);
                        setGuestResults([]);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        selectedGuest?.id === g.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="font-medium">{g.full_name}</span>
                      {g.phone && <span className="ml-2 text-slate-400">{g.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedGuest && (
                <p className="text-sm text-green-600">
                  Da chon: <strong>{selectedGuest.full_name}</strong>
                </p>
              )}
              <button
                type="button"
                onClick={() => setNewGuestMode(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                + Tao khach moi
              </button>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-700">Khach moi</p>
              <Input
                label="Ho ten"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                required
              />
              <Input
                label="So dien thoai"
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
              />
              <Input
                label="CMND/CCCD"
                value={newGuestIdNumber}
                onChange={(e) => setNewGuestIdNumber(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setNewGuestMode(false)}
                className="text-sm text-slate-500 hover:underline"
              >
                Quay lai tim kiem
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngay tra phong"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              required
            />
            <Input
              label="So khach"
              type="number"
              value={numGuests}
              onChange={(e) => setNumGuests(e.target.value)}
              min="1"
              required
            />
          </div>

          {selectedRoom?.room_type && checkOutDate && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p>
                <strong>Gia phong:</strong>{" "}
                {formatPrice(selectedRoom.room_type.base_price)}/dem
              </p>
              <p>
                <strong>Tam tinh:</strong>{" "}
                {formatPrice(
                  selectedRoom.room_type.base_price *
                    Math.max(
                      1,
                      Math.ceil(
                        (new Date(checkOutDate).getTime() - Date.now()) / 86400000
                      )
                    )
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCheckInModal(false)}>
              Huy
            </Button>
            <Button
              type="submit"
              disabled={loadingAction || (!selectedGuest && !newGuestMode) || (newGuestMode && !newGuestName)}
            >
              {loadingAction ? "Dang xu ly..." : "Nhan phong"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== Checkout Modal ========== */}
      <Modal
        open={checkOutModal}
        onClose={() => setCheckOutModal(false)}
        title={`Tra phong — ${selectedRoom?.room_number}`}
      >
        {activeBooking && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
              <p><strong>Khach:</strong> {activeBooking.guest?.full_name}</p>
              <p><strong>Check-in:</strong> {formatDate(activeBooking.check_in_date)}</p>
              <p><strong>Check-out:</strong> {formatDate(activeBooking.check_out_date)}</p>
              <p className="text-lg font-bold text-slate-800 pt-2">
                Tong tien: {formatPrice(activeBooking.total_amount)}
              </p>
              <p className="text-sm text-slate-500">
                Da thanh toan: {formatPrice(activeBooking.paid_amount)}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCheckOutModal(false)}>
                Huy
              </Button>
              <Button variant="danger" onClick={handleCheckOut} disabled={loadingAction}>
                {loadingAction ? "Dang xu ly..." : "Xac nhan tra phong"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========== Detail Modal ========== */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title={`Chi tiet — Phong ${selectedRoom?.room_number}`}
      >
        {activeBooking && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-slate-400">Ma dat phong</p>
                <p className="font-medium">{activeBooking.booking_code}</p>
              </div>
              <div>
                <p className="text-slate-400">Trang thai</p>
                <Badge variant="danger">Dang o</Badge>
              </div>
              <div>
                <p className="text-slate-400">Khach hang</p>
                <p className="font-medium">{activeBooking.guest?.full_name}</p>
              </div>
              <div>
                <p className="text-slate-400">SDT</p>
                <p className="font-medium">{activeBooking.guest?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-slate-400">Check-in</p>
                <p className="font-medium">{formatDate(activeBooking.check_in_date)}</p>
              </div>
              <div>
                <p className="text-slate-400">Check-out</p>
                <p className="font-medium">{formatDate(activeBooking.check_out_date)}</p>
              </div>
              <div>
                <p className="text-slate-400">So khach</p>
                <p className="font-medium">{activeBooking.num_guests}</p>
              </div>
              <div>
                <p className="text-slate-400">CMND/CCCD</p>
                <p className="font-medium">{activeBooking.guest?.id_number || "—"}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-slate-400">Tong tien</p>
              <p className="text-xl font-bold text-slate-800">{formatPrice(activeBooking.total_amount)}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setDetailModal(false)}>
                Dong
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========== Service Modal ========== */}
      <Modal
        open={serviceModal}
        onClose={() => setServiceModal(false)}
        title={`Dich vu — Phong ${selectedRoom?.room_number}`}
      >
        <div className="space-y-4">
          {/* Existing services */}
          {services.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Dich vu</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">SL</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">Thanh tien</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2">{s.service_name}</td>
                      <td className="px-3 py-2 text-right">{s.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatPrice(s.total_price)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Xoa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add service */}
          <form onSubmit={handleAddService} className="space-y-3 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">Them dich vu moi</p>
            <Input
              label="Ten dich vu"
              value={svcName}
              onChange={(e) => setSvcName(e.target.value)}
              placeholder="VD: Minibar, Giat ui..."
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="So luong"
                type="number"
                value={svcQty}
                onChange={(e) => setSvcQty(e.target.value)}
                min="1"
                required
              />
              <Input
                label="Don gia (VND)"
                type="number"
                value={svcPrice}
                onChange={(e) => setSvcPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Them
              </Button>
            </div>
          </form>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setServiceModal(false)}>
              Dong
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========== Transfer Modal ========== */}
      <Modal
        open={transferModal}
        onClose={() => setTransferModal(false)}
        title={`Chuyen phong — ${selectedRoom?.room_number}`}
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <p className="text-sm text-slate-500">
            Chuyen khach tu phong <strong>{selectedRoom?.room_number}</strong> sang phong khac.
          </p>
          <Select
            label="Phong moi"
            value={transferRoomId}
            onChange={(e) => setTransferRoomId(e.target.value)}
            options={availableRoomsForTransfer.map((r) => ({
              value: r.id,
              label: `${r.room_number} — ${r.room_type?.name || ""}`,
            }))}
            placeholder="Chon phong"
            required
          />
          {availableRoomsForTransfer.length === 0 && (
            <p className="text-sm text-red-500">Khong co phong trong de chuyen.</p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setTransferModal(false)}>
              Huy
            </Button>
            <Button type="submit" disabled={loadingAction || !transferRoomId}>
              {loadingAction ? "Dang xu ly..." : "Chuyen phong"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
